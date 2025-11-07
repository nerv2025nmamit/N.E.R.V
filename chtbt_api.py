from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import chromadb
from sentence_transformers import SentenceTransformer
from google import generativeai as genai

load_dotenv()

# Load environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = "RAG_Chatbot_1_nerv"
CHROMA_COLLECTION = "alumni_collection"

if not all([GEMINI_API_KEY, CHROMA_API_KEY, CHROMA_TENANT]):
    raise RuntimeError("Missing required environment variables for Gemini or Chroma")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Initialize FastAPI app
app = FastAPI(title="Drona AI Chatbot API")

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class QueryRequest(BaseModel):
    question: str
    n_results: int = 2


@app.get("/health")
async def health():
    return {"status": "ok"}


# Lazy global objects
client = None
collection = None
embedding_model = None


def init_resources():
    """Initialize Chroma and SentenceTransformer lazily."""
    global client, collection, embedding_model

    if client is None:
        client = chromadb.CloudClient(
            api_key=CHROMA_API_KEY,
            tenant=CHROMA_TENANT,
            database=CHROMA_DATABASE
        )
        collection = client.get_or_create_collection(name=CHROMA_COLLECTION)

    if embedding_model is None:
        embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def query_chroma(user_query: str, n_results: int = 2) -> dict:
    init_resources()
    emb_vector = embedding_model.encode([user_query])[0].tolist()

    results = collection.query(
        query_embeddings=[emb_vector],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )

    docs = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    context_text = " ".join(docs) if docs else ""
    return {
        "context_text": context_text,
        "docs": docs,
        "metadatas": metadatas,
        "distances": distances
    }


def ask_gemini(context: str, question: str, model_name="gemini-2.5-flash") -> str:
    prompt = f"Context: {context or '(no context)'}\n\nQuestion: {question}\nAnswer:"
    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)
    return getattr(resp, "text", "") or str(resp)


@app.post("/ask")
async def ask(req: QueryRequest):
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
