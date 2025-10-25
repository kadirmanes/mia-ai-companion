from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List
import os
from dotenv import load_dotenv
# from emergentintegrations.llm.chat import LlmChat, UserMessage
import openai
import asyncio

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client["mia_db"]
users_collection = db["users"]
pets_collection = db["pets"]
chats_collection = db["chats"]
stats_collection = db["stats"]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

# Predefined personalities
PREDEFINED_PERSONALITIES = [
    {"id": "cheerful", "name": "Cheerful", "description": "Always happy and optimistic, loves to spread joy!", "emoji": "😊"},
    {"id": "shy", "name": "Shy", "description": "A bit timid but very sweet and caring.", "emoji": "😌"},
    {"id": "adventurous", "name": "Adventurous", "description": "Bold and curious, always ready for new experiences!", "emoji": "🌟"},
    {"id": "calm", "name": "Calm", "description": "Peaceful and wise, brings tranquility to your day.", "emoji": "🧘"}
]

# Pydantic Models
class CreatePetRequest(BaseModel):
    user_id: str
    name: str
    personality_type: str  # 'predefined' or 'custom'
    personality_id: Optional[str] = None  # for predefined
    custom_personality: Optional[str] = None  # for custom
    color: str = "#FFB6C1"  # default light pink

class ChatRequest(BaseModel):
    pet_id: str
    message: str

class UpdateStatsRequest(BaseModel):
    pet_id: str
    affection: Optional[int] = None
    hunger: Optional[int] = None
    energy: Optional[int] = None

# Helper Functions
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def get_emotion_from_sentiment(sentiment_score: float) -> str:
    """Convert sentiment score (-1 to 1) to emotion state"""
    if sentiment_score > 0.5:
        return "happy"
    elif sentiment_score > 0.2:
        return "content"
    elif sentiment_score > -0.2:
        return "neutral"
    elif sentiment_score > -0.5:
        return "sad"
    else:
        return "very_sad"

def analyze_sentiment(text: str) -> float:
    """Simple sentiment analysis based on keywords"""
    positive_words = ['love', 'happy', 'joy', 'great', 'awesome', 'wonderful', 'good', 'nice', 'beautiful', 'amazing', 'excited', 'yes', 'perfect', 'best']
    negative_words = ['hate', 'sad', 'bad', 'terrible', 'awful', 'horrible', 'no', 'never', 'angry', 'upset', 'disappointed', 'lonely', 'miss']
    
    text_lower = text.lower()
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    total = positive_count + negative_count
    if total == 0:
        return 0.0
    
    score = (positive_count - negative_count) / max(total, 1)
    return max(-1.0, min(1.0, score))

def get_personality_prompt(pet_data: dict) -> str:
    """Generate personality prompt for AI"""
    name = pet_data.get("name", "MIA")
    personality_type = pet_data.get("personality_type")
    
    base_prompt = f"You are {name}, a cute AI pet companion. You are emotional, caring, and remember your conversations with your owner. "
    
    if personality_type == "predefined":
        personality_id = pet_data.get("personality_id")
        personality = next((p for p in PREDEFINED_PERSONALITIES if p["id"] == personality_id), None)
        if personality:
            base_prompt += f"Your personality is {personality['name']}: {personality['description']} "
    elif personality_type == "custom":
        custom = pet_data.get("custom_personality", "")
        base_prompt += f"Your unique personality: {custom} "
    
    base_prompt += "Keep responses short, warm, and emotionally expressive (2-3 sentences max). Show emotions through your words."
    return base_prompt

# API Endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "MIA Backend"}

@app.get("/api/personalities")
async def get_personalities():
    return {"personalities": PREDEFINED_PERSONALITIES}

@app.post("/api/pet/create")
async def create_pet(request: CreatePetRequest):
    try:
        # Create pet document
        pet_data = {
            "user_id": request.user_id,
            "name": request.name,
            "personality_type": request.personality_type,
            "personality_id": request.personality_id,
            "custom_personality": request.custom_personality,
            "color": request.color,
            "level": 1,
            "created_at": datetime.utcnow(),
            "last_interaction": datetime.utcnow()
        }
        
        result = pets_collection.insert_one(pet_data)
        pet_id = str(result.inserted_id)
        
        # Initialize stats
        stats_data = {
            "pet_id": pet_id,
            "affection": 50,
            "hunger": 50,
            "energy": 50,
            "mood": "neutral",
            "updated_at": datetime.utcnow()
        }
        stats_collection.insert_one(stats_data)
        
        pet_data["_id"] = pet_id
        return {"success": True, "pet": serialize_doc(pet_data)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pet/{pet_id}")
async def get_pet(pet_id: str):
    try:
        pet = pets_collection.find_one({"_id": ObjectId(pet_id)})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        stats = stats_collection.find_one({"pet_id": pet_id})
        
        return {
            "pet": serialize_doc(pet),
            "stats": serialize_doc(stats) if stats else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_with_pet(request: ChatRequest):
    try:
        # Get pet data
        pet = pets_collection.find_one({"_id": ObjectId(request.pet_id)})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Get recent chat history (last 10 messages)
        recent_chats = list(chats_collection.find(
            {"pet_id": request.pet_id}
                    # Build messages for OpenAI ChatCompletion
        messages = []
        # Add system prompt based on personality
        messages.append({"role": "system", "content": personality_prompt})
        # Include recent chat history
        for c in recent_chats:
            messages.append({"role": "user", "content": c.get("User_message", "")})
            messages.append({"role": "assistant", "content": c.get("ai_response", "")})
        # Current user message
        messages.append({"role": "user", "content": request.message})
        # Call OpenAI chat completion or return fallback
        try:
            openai_response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=150
            )
            response_text = openai_response["choices"][0]["message"]["content"].strip()
        except Exception as e:
            response_text = f"{pet['pet_name']} diyor ki: Merhaba!"

        ).sort("timestamp", -1).limit(10))
        recent_chats.reverse()
        
        # Analyze user sentiment
        user_sentiment = analyze_sentiment(request.message)
        emotion = get_emotion_from_sentiment(user_sentiment)
        
        # Create AI chat instance
        personality_prompt = get_personality_prompt(pet)
#        session_id = f"pet_{request.pet_id}"
        
        #chat = LlmChat(
            #api_key=EMERGENT_LLM_KEY,
            #session_id=session_id,
            #system_message=personality_prompt
        #).with_model("openai", "gpt-4o")
        
        # Send message
#        user_message = UserMessage(text=request.message)
#        response_text = await chat.send_message(user_message)
        
        # Save chat to database
        chat_doc = {
            "pet_id": request.pet_id,
            "user_message": request.message,
            "ai_response": response_text,
            "user_sentiment": user_sentiment,
            "emotion": emotion,
            "timestamp": datetime.utcnow()
        }
        chats_collection.insert_one(chat_doc)
        
        # Update pet last interaction
        pets_collection.update_one(
            {"_id": ObjectId(request.pet_id)},
            {"$set": {"last_interaction": datetime.utcnow()}}
        )
        
        # Update stats based on interaction
        current_stats = stats_collection.find_one({"pet_id": request.pet_id})
        if current_stats:
            new_affection = min(100, current_stats.get("affection", 50) + 5)
            new_energy = max(0, current_stats.get("energy", 50) - 2)
            
            stats_collection.update_one(
                {"pet_id": request.pet_id},
                {"$set": {
                    "affection": new_affection,
                    "energy": new_energy,
                    "mood": emotion,
                    "updated_at": datetime.utcnow()
                }}
            )
        
        return {
            "success": True,
            "response": response_text,
            "emotion": emotion,
            "sentiment_score": user_sentiment
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/{pet_id}")
async def get_stats(pet_id: str):
    try:
        stats = stats_collection.find_one({"pet_id": pet_id})
        if not stats:
            raise HTTPException(status_code=404, detail="Stats not found")
        
        return {"stats": serialize_doc(stats)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stats/update")
async def update_stats(request: UpdateStatsRequest):
    try:
        update_fields = {"updated_at": datetime.utcnow()}
        
        if request.affection is not None:
            update_fields["affection"] = max(0, min(100, request.affection))
        if request.hunger is not None:
            update_fields["hunger"] = max(0, min(100, request.hunger))
        if request.energy is not None:
            update_fields["energy"] = max(0, min(100, request.energy))
        
        stats_collection.update_one(
            {"pet_id": request.pet_id},
            {"$set": update_fields}
        )
        
        updated_stats = stats_collection.find_one({"pet_id": request.pet_id})
        return {"success": True, "stats": serialize_doc(updated_stats)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history/{pet_id}")
async def get_chat_history(pet_id: str, limit: int = 20):
    try:
        chats = list(chats_collection.find(
            {"pet_id": pet_id}
        ).sort("timestamp", -1).limit(limit))
        
        chats.reverse()
        return {"chats": [serialize_doc(chat) for chat in chats]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/check-inactive/{pet_id}")
async def check_inactive(pet_id: str):
    try:
        pet = pets_collection.find_one({"_id": ObjectId(pet_id)})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        last_interaction = pet.get("last_interaction")
        if last_interaction:
            time_diff = datetime.utcnow() - last_interaction
            hours_inactive = time_diff.total_seconds() / 3600
            
            if hours_inactive >= 24:
                return {
                    "inactive": True,
                    "hours": int(hours_inactive),
                    "message": f"{pet.get('name', 'MIA')} misses you! 🥺"
                }
        
        return {"inactive": False}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
