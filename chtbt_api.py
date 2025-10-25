from fastapi import FastAPI, Request
from pydantic import BaseModel
from google import generativeai as genai
from dotenv import load_dotenv
from chromadb import PersistentClient
import chromadb
import requests
import json
import os

# Load .env and Gemini API key
load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

client = PersistentClient(path="./chroma_data")
collection = client.get_collection(name="alumni_collection")

app = FastAPI()

class QueryRequest(BaseModel):
    question: str

def query_chroma(user_query):
    """Fetch relevant alumni info from ChromaDB"""
    results = collection.query(query_texts=[user_query], n_results=2)
    documents = results['documents'][0]
    context = " ".join(documents)
    return context



_GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # set this in your environment
genai.configure(api_key=_GEMINI_API_KEY)

def ask_gemini(context, query, model_name="gemini-2.5-flash"):
    """Send prompt to Google Gemini API and return text response."""
    prompt = f"Context: {context}\n\nQuestion: {query}\nAnswer:"
    
    # Create model instance
    model = genai.GenerativeModel(model_name)
    
    # Generate response
    response = model.generate_content(prompt)
    
    # Return the text response safely
    return getattr(response, "text", "") or str(response)


@app.post("/ask")
async def ask(request: QueryRequest):
    """Main API endpoint for chatbot"""
    context = query_chroma(request.question)
    answer = ask_gemini(context, request.question)
    return {"question": request.question, "answer": answer}

print("running successfully")