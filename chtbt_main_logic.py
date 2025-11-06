import os, sys, logging
os.environ["GRPC_VERBOSITY"] = "NONE"
os.environ["GRPC_TRACE"] = "none"
logging.getLogger("absl").setLevel(logging.FATAL)

sys.stderr = open(os.devnull, "w")
sys.stderr = sys.__stderr__


from dotenv import load_dotenv
import os
import sys
import threading
import time

load_dotenv()

from google import generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

from sentence_transformers import SentenceTransformer
import chromadb

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = "RAG_Chatbot_1_nerv"
COLLECTION_NAME = "alumni_collection"

client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE
)

collection = client.get_or_create_collection(name=COLLECTION_NAME)

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def query_chroma(user_query, n_results=2):
    """
    Embed the user query and query the collection.
    Returns a string context (joined documents). If nothing found, returns empty string.
    """
    emb = embedding_model.encode(user_query).tolist()

    results = collection.query(
        query_embeddings=[emb],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )

    documents_for_query = results.get("documents", [[]])
    if not documents_for_query or not documents_for_query[0]:
       
        return ""

    context = " ".join(documents_for_query[0])
    return context

def ask_gemini(context, query_text):
    """
    Ask Gemini 
    If context is empty, Gemini should be told the context is missing.
    """
    model = genai.GenerativeModel("gemini-2.5-flash")

    if context:
        prompt = f"Context: {context}\n\nQuestion: {query_text}\nAnswer:"
    else:
        prompt = (
            "Context: (no relevant context found in the database)\n\n"
            f"Question: {query_text}\nAnswer:"
        )

    resp = model.generate_content(prompt)
    return getattr(resp, "text", "") or str(resp)

def show_thinking(stop_event):
    symbols = ["⏳", "🤔", "🧠", "⌛"]
    i = 0
    while not stop_event.is_set():
        sys.stdout.write(f"\r{symbols[i % len(symbols)]} Thinking...")
        sys.stdout.flush()
        time.sleep(0.5)
        i += 1
    sys.stdout.write("\r" + " " * 40 + "\r")
    sys.stderr.flush()


if __name__ == "__main__":
    print("Hi I'm Drona AI 🤖! Your AI assistant for this website.")
    print("How can I help you today?")
    print("Type 'exit' to quit.\n")
    sys.stdout.flush()

    while True:
        user_query = input("You: ").strip()
        if user_query.lower() == "exit":
            print("👋 Goodbye! Keep Learning and Exploring 🚀")
            break

        stop_event = threading.Event()
        t = threading.Thread(target=show_thinking, args=(stop_event,))
        t.start()

        try:
            context = query_chroma(user_query)
            reply = ask_gemini(context, user_query)
        except Exception as e:
            reply = f"Error while processing your request: {e}"

       
        stop_event.set()
        t.join()
        sys.stdout.flush()
        print("\nBot:", reply, "\n")
        sys.stdout.flush()
