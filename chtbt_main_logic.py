# chtbt_main_logic.py

import os
import sys
import time
import threading
from dotenv import load_dotenv
from google import generativeai as genai
import chromadb

# -------------------------
# Environment Setup
# -------------------------

load_dotenv()

os.environ["GRPC_VERBOSITY"] = os.getenv("GRPC_VERBOSITY", "NONE")
os.environ["GRPC_TRACE"] = os.getenv("GRPC_TRACE", "none")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in .env")

genai.configure(api_key=GEMINI_API_KEY)

EMBED_MODEL = "models/text-embedding-004"
TEXT_MODEL = "gemini-2.5-flash"

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = "RAG_Chatbot_1_nerv"
COLLECTION_NAME = "alumni_collection_new"

if not CHROMA_API_KEY or not CHROMA_TENANT:
    raise RuntimeError("Missing Chroma credentials in .env")

client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE
)

collection = client.get_or_create_collection(name=COLLECTION_NAME)


# -------------------------
# Embeddings
# -------------------------

def get_embedding(text: str):
    if not text:
        return None

    snippet = text[:2000]
    try:
        resp = genai.embed_content(model=EMBED_MODEL, content=snippet)
        if isinstance(resp, dict) and "embedding" in resp:
            return resp["embedding"]
        if hasattr(resp, "embedding"):
            return resp.embedding
        raise RuntimeError("Unexpected embed_content response format")
    except Exception as e:
        raise RuntimeError(f"Embedding error: {e}")


# -------------------------
# Extract number of results
# -------------------------

def extract_num_results(query: str, default: int = 3, total_docs_count: int = None):
    query_lower = query.lower()

    # If user wants ALL alumni
    if "all alumni" in query_lower or "all details" in query_lower:
        return total_docs_count

    # If user wants total/count → only count, not listings
    if "count" in query_lower or "total" in query_lower:
        return total_docs_count

    # Extract numeric value
    for word in query.split():
        if word.isdigit():
            return int(word)

    return default



# -------------------------
# Chroma Retrieval
# -------------------------

def query_chroma(user_query: str, default_n: int = 3):
    total_items = collection.count()

    # Detect requested output size
    n_results = extract_num_results(user_query, default=default_n, total_docs_count=total_items)

    emb = get_embedding(user_query)
    if not emb:
        raise RuntimeError("Failed to generate embedding")

    results = collection.query(
        query_embeddings=[emb],
        n_results=n_results,
        include=["documents", "metadatas"]
    )

    docs = results.get("documents", [[]])[0] or []
    metas = results.get("metadatas", [[]])[0] or []

    return docs, metas, total_items



# -------------------------
# Gemini Response
# -------------------------

def ask_gemini(context: str, question: str):
    prompt = f"""
You are Drona AI, a helpful assistant that answers from alumni data.

Context:
{context if context.strip() else "(no relevant context found)"}

Question:
{question}

Answer clearly and concisely based only on the data.
"""

    try:
        model = genai.GenerativeModel(TEXT_MODEL)
        resp = model.generate_content(prompt)
        if isinstance(resp, dict) and "text" in resp:
            return resp["text"]
        return getattr(resp, "text", None) or str(resp)
    except Exception as e:
        return f"Gemini Error: {e}"


# -------------------------
# CLI Spinner Animation
# -------------------------

def show_thinking(stop_event):
    symbols = ["⏳", "🤔", "🧠", "⌛"]
    i = 0
    while not stop_event.is_set():
        sys.stdout.write(f"\r{symbols[i % len(symbols)]} Thinking...")
        sys.stdout.flush()
        time.sleep(0.4)
        i += 1
    sys.stdout.write("\r" + " " * 40 + "\r")
    sys.stdout.flush()


# -------------------------
# Main Program Loop
# -------------------------

if __name__ == "__main__":
    print("Hi, I'm Drona AI 🤖 — your Alumni Roadmap Assistant!")
    print("I'm here to guide you with your placement journey ")
    print("Type 'exit' to quit.\n")

    while True:
        user_query = input("You: ").strip()
        if user_query.lower() == "exit":
            print("👋 Goodbye!")
            print("Keep Learning and Keep Exploring")
            break

        stop_event = threading.Event()
        t = threading.Thread(target=show_thinking, args=(stop_event,))
        t.start()

        try:
            docs, metas, total_items = query_chroma(user_query, default_n=3)

            # Build context
            full_context = "\n\n---\n\n".join(docs)

            # If user wants count
            if "count" in user_query.lower() or "total" in user_query.lower():
                reply = f"There are {total_items} alumni in the database."

            else:
                # Limit context to safety boundary
                safe_context = full_context[:18000]
                reply = ask_gemini(safe_context, user_query)

        except Exception as e:
            reply = f"Error: {e}"

        stop_event.set()
        t.join()

        print("\nBot:", reply, "\n")
