
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
CHROMA_DATABASE =  "RAG_Chatbot_1_nerv"
CHROMA_COLLECTION = "alumni_collection"

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set")
if not CHROMA_API_KEY:
    raise RuntimeError("CHROMA_API_KEY is not set")
if not CHROMA_TENANT:
    raise RuntimeError("CHROMA_TENANT is not set")

genai.configure(api_key=GEMINI_API_KEY)

client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE
)

collection = client.get_or_create_collection(name=CHROMA_COLLECTION)

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

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

@app.get("/health")
async def health():
    return {"status": "ok"}


def query_chroma(user_query: str, n_results: int = 2) -> dict:
    """
    Returns a dict with keys:
      - context_text: concatenated documents ("" if none)
      - docs: list of documents returned
      - metadatas: list of metadatas (if any)
      - distances: list of distances (if any)
    """
    
    emb_vector = embedding_model.encode([user_query])[0].tolist()

    results = collection.query(
        query_embeddings=[emb_vector],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )

    docs = results.get("documents", [[]])[0] if "documents" in results else []
    metadatas = results.get("metadatas", [[]])[0] if "metadatas" in results else []
    distances = results.get("distances", [[]])[0] if "distances" in results else []

    context_text = " ".join(docs) if docs else ""
    return {
        "context_text": context_text,
        "docs": docs,
        "metadatas": metadatas,
        "distances": distances
    }


def ask_gemini(context: str, question: str, model_name: str = "gemini-2.5-flash") -> str:
    if context:
        prompt = f"Context: {context}\n\nQuestion: {question}\nAnswer:"
    else:
        prompt = (
            "Context: (No relevant context found in the knowledge base.)\n\n"
            f"Question: {question}\nAnswer:"
        )

    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)
    return getattr(resp, "text", "") or str(resp)


@app.post("/ask")
async def ask(req: QueryRequest):
    try:
        chroma_res = query_chroma(req.question, n_results=req.n_results)
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
