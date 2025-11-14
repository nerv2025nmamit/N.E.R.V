
import os
import threading
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import generativeai as genai
import chromadb
import time

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "RAG_Chatbot_1_nerv")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "alumni_collection")

if not all([GEMINI_API_KEY, CHROMA_API_KEY, CHROMA_TENANT]):
    raise RuntimeError("Missing GEMINI_API_KEY or CHROMA credentials in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)
GENIE_TEXT_MODEL = "gemini-2.5-flash"

EMBEDDING_MODEL_NAME = "models/text-embedding-004"

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
    n_results: int = 2

def get_query_embedding(text: str):
    """
    Create an embedding vector for `text` using the genai SDK in a way
    that's tolerant to small differences between versions of google-generativeai.
    Returns: list[float] or None
    """

    if not text:
        return None
    txt = text if len(text) <= 2000 else text[:2000]

    try:
        emb_model = genai.EmbeddingModel(EMBEDDING_MODEL_NAME)
    except Exception:
        emb_model = None

    
    candidates = []

    if emb_model is not None:
       
        try:
            resp = emb_model.embed_content(txt)
            candidates.append(resp)
        except AttributeError:
            pass
        except Exception:
         
            pass

        try:
            resp = emb_model.embed(txt)
            candidates.append(resp)
        except AttributeError:
            pass
        except Exception:
            pass

    try:
        resp = genai.embed(text=txt)  
        candidates.append(resp)
    except Exception:
        pass

    try:
        gm = genai.GenerativeModel(EMBEDDING_MODEL_NAME)
        try:
            resp = gm.embed_content(txt)
            candidates.append(resp)
        except Exception:
            pass
    except Exception:
        pass

    for resp in candidates:
        if resp is None:
            continue
        
        if isinstance(resp, dict):
            
            if "embedding" in resp:
                return resp["embedding"]
            if "data" in resp and isinstance(resp["data"], list) and resp["data"]:
                
                first = resp["data"][0]
                if isinstance(first, dict) and "embedding" in first:
                    return first["embedding"]
        
        try:
            if hasattr(resp, "embedding"):
                return getattr(resp, "embedding")
            if hasattr(resp, "data") and getattr(resp, "data"):
                d0 = getattr(resp, "data")[0]
                if hasattr(d0, "embedding"):
                    return getattr(d0, "embedding")
        except Exception:
            pass

    return None

def query_chroma(user_query: str, n_results: int = 2):
    """
    Query Chroma Cloud using an embedding created by get_query_embedding.
    Returns a dict with trimmed context and arrays.
    """
    emb = get_query_embedding(user_query)
    if not emb:
        raise RuntimeError("Failed to create embedding for the query. Check GEMINI embedding API or SDK compatibility.")
   
    results = collection.query(
        query_embeddings=[emb],
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

def ask_gemini(context: str, question: str, model_name: str = GENIE_TEXT_MODEL):
    prompt = (
        "You are Drona AI, a helpful assistant that answers based on alumni data.\n\n"
        f"Context:\n{context or '(no context available)'}\n\n"
        f"Question:\n{question}\n\nAnswer helpfully and concisely:"
    )
    try:
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(prompt)
       
        if isinstance(resp, dict):
           
            return resp.get("text") or str(resp)
        else:
            return getattr(resp, "text", None) or str(resp)
    except Exception as e:
        raise RuntimeError(f"Gemini API Error: {e}")

@app.get("/")
async def root():
    return {"message": "🤖 Drona AI Chatbot is running!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/ask")
async def ask(req: QueryRequest):
    try:
      
        trimmed_q = (req.question[:120] + "...") if len(req.question) > 120 else req.question
        print("Incoming question (trimmed):", trimmed_q)

        chroma_res = query_chroma(req.question, req.n_results)
        context = chroma_res["context_text"][:3000] 
        answer = ask_gemini(context, req.question)

        trimmed_docs = []
        for d in chroma_res.get("docs", []):
            if not isinstance(d, str):
                try:
                    d = str(d)
                except Exception:
                    d = ""
            trimmed_docs.append(d[:400] + ("..." if len(d) > 400 else ""))

        return {
            "question": req.question,
            "answer": answer,
            "source_docs": trimmed_docs,
            "distances": chroma_res.get("distances", [])
        }

    except Exception as e:
       
        print("ERROR in /ask:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("chtbt_api:app", host="0.0.0.0", port=int(os.getenv("PORT", 10000)))
