import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import generativeai as genai
import chromadb

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "RAG_Chatbot_1_nerv")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "alumni_collection_new")

if not all([GEMINI_API_KEY, CHROMA_API_KEY, CHROMA_TENANT]):
    raise RuntimeError("Missing environment variables!")

genai.configure(api_key=GEMINI_API_KEY)
EMBED_MODEL = "models/text-embedding-004"
TEXT_MODEL = "gemini-2.5-flash"

app = FastAPI(title="Drona AI Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE
)

collection = client.get_or_create_collection(name=CHROMA_COLLECTION)

class QueryRequest(BaseModel):
    question: str


def get_embedding(text: str):
    """Embed using the new stable method."""
    if not text:
        return None

    snippet = text[:2000]

    try:
        resp = genai.embed_content(model=EMBED_MODEL, content=snippet)

        if isinstance(resp, dict) and "embedding" in resp:
            return resp["embedding"]

        if hasattr(resp, "embedding"):
            return resp.embedding

        raise RuntimeError("Unexpected embedding response shape.")

    except Exception as e:
        raise RuntimeError(f"Embedding error: {e}")


def extract_num_results(query: str, default: int, total_docs: int):
    q = query.lower()

    if "count" in q or "total" in q:
        return total_docs

    if "all alumni" in q or "all details" in q:
        return total_docs

    for w in query.split():
        if w.isdigit():
            return int(w)

    return default


def query_chroma(user_query: str, default_n: int = 3):
    total_items = collection.count()

    n_results = extract_num_results(
        user_query,
        default=default_n,
        total_docs=total_items
    )

    emb = get_embedding(user_query)
    if not emb:
        raise RuntimeError("Failed to generate embedding.")

    results = collection.query(
        query_embeddings=[emb],
        n_results=n_results,
        include=["documents", "metadatas"]
    )

    docs = results.get("documents", [[]])[0] or []
    metas = results.get("metadatas", [[]])[0] or []

    return docs, metas, total_items



def ask_gemini(context: str, question: str):
    prompt = f"""
You are Drona AI, a helpful assistant that answers only from alumni data.

Context:
{context if context.strip() else "(no relevant context found)"}

Question:
{question}

Answer clearly, politely, and concisely. Do NOT create data that is not present in context.
"""

    try:
        model = genai.GenerativeModel(TEXT_MODEL)
        resp = model.generate_content(prompt)
        if hasattr(resp, "text"):
            return resp.text
        return str(resp)
    except Exception as e:
        return f"Gemini Error: {e}"
@app.post("/ask")
def chat_api(request: QueryRequest):
    try:
        docs, metas, total_items = query_chroma(request.question, default_n=3)

        # Join context
        context = "\n\n---\n\n".join(docs)
        context = context[:18000]  # safety cutoff

        # Special case: user asked total count
        if "count" in request.question.lower() or "total" in request.question.lower():
            return {"answer": f"There are {total_items} alumni in the database."}

        # Ask Gemini
        answer = ask_gemini(context, request.question)

        return {
            "answer": answer,
            "matched_documents": len(docs),
            "total_alumni": total_items
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

        
