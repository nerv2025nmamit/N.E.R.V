# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import chromadb
from sentence_transformers import SentenceTransformer
from google import generativeai as genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "RAG_Chatbot_1_nerv")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "alumni_collection")

if not all([GEMINI_API_KEY, CHROMA_API_KEY, CHROMA_TENANT]):
    raise RuntimeError("❌ Missing required environment variables for Gemini or Chroma.")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Drona AI Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str
    n_results: int = 2

@app.get("/")
async def root():
    return {"message": "🤖 Drona AI Chatbot is running!"}

@app.get("/health")
async def health():
    return {"status": "ok"}


client = None
collection = None
embedding_model = None

def init_resources():
    """Initialize Chroma client and embedding model (lazy load)."""
    global client, collection, embedding_model
    if client is None:
        headers = {
            "Authorization": f"Bearer {CHROMA_API_KEY}"
        }
        client = chromadb.HttpClient(
            "https://api.trychroma.com",  
            headers=headers,               
            tenant=CHROMA_TENANT,
            database=CHROMA_DATABASE
        )
        collection = client.get_or_create_collection(name=CHROMA_COLLECTION)

    if embedding_model is None:
        embedding_model = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L3-v2")

def query_chroma(user_query: str, n_results: int = 2) -> dict:
    """Query Chroma Cloud for most relevant chunks."""
    init_resources()
    emb_vector = embedding_model.encode([user_query])[0].tolist()
    results = collection.query(
        query_embeddings=[emb_vector],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )
    docs = results.get("documents", [[]])[0] if isinstance(results.get("documents"), list) else []
    metadatas = results.get("metadatas", [[]])[0] if isinstance(results.get("metadatas"), list) else []
    distances = results.get("distances", [[]])[0] if isinstance(results.get("distances"), list) else []
    context_text = " ".join(docs) if docs else ""
    return {
        "context_text": context_text,
        "docs": docs,
        "metadatas": metadatas,
        "distances": distances
    }

def ask_gemini(context: str, question: str, model_name="gemini-2.0-flash"):
    """Ask Gemini with provided context."""
    prompt = f"""
You are Drona AI, a helpful assistant that answers based on alumni data.

Context:
{context or '(no context available)'}

Question:
{question}

Answer helpfully and concisely:
"""
    try:
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(prompt)
        if hasattr(resp, "text") and resp.text:
            return resp.text
        if hasattr(resp, "candidates") and resp.candidates:
            first = resp.candidates[0]
            if hasattr(first, "content"):
                try:
                    return first.content[0].text
                except Exception:
                    try:
                        return first.content
                    except Exception:
                        pass
            return str(first)
        return str(resp)
    except Exception as e:
        raise RuntimeError(f"Gemini API Error: {e}")

@app.post("/ask")
async def ask(req: QueryRequest):
    """Main endpoint: query Chroma + ask Gemini."""
    try:
        chroma_res = query_chroma(req.question, req.n_results)
        context = chroma_res["context_text"]
        answer = ask_gemini(context, req.question)
        return {
            "question": req.question,
            "answer": answer,
            "source_docs": chroma_res["docs"],
            "metadatas": chroma_res["metadatas"],
            "distances": chroma_res["distances"]
        }
    except Exception as e:
        
        raise HTTPException(status_code=500, detail=str(e))
