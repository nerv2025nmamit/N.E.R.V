from fastapi import FastAPI, Request
from pydantic import BaseModel
import chromadb
import requests
import json

# Initialize ChromaDB client
from chromadb import PersistentClient
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

def ask_gemma(context, query):
    """Send prompt to local Ollama API (Gemma3)"""
    prompt = f"Context: {context}\n\nQuestion: {query}\nAnswer:"

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "gemma3:latest", "prompt": prompt},
        stream=True,
    )

    full_response = ""
    for line in response.iter_lines():
        if line:
            data = json.loads(line.decode("utf-8"))
            if "response" in data:
                full_response += data["response"]
    return full_response.strip()

@app.post("/ask")
async def ask(request: QueryRequest):
    """Main API endpoint for chatbot"""
    context = query_chroma(request.question)
    answer = ask_gemma(context, request.question)
    return {"question": request.question, "answer": answer}
