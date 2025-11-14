# main_logic.py
import os, sys, logging, threading, time
from dotenv import load_dotenv
from google import generativeai as genai
import chromadb

load_dotenv()
os.environ["GRPC_VERBOSITY"] = "NONE"
os.environ["GRPC_TRACE"] = "none"
logging.getLogger("absl").setLevel(logging.FATAL)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "RAG_Chatbot_1_nerv")
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "alumni_collection")

client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE
)
collection = client.get_or_create_collection(name=COLLECTION_NAME)

def get_query_embedding(text: str):
    model = genai.GenerativeModel("models/text-embedding-004")
    resp = model.embed_content(text)
    return resp.get("embedding")

def query_chroma(user_query, n_results=2):
    emb = get_query_embedding(user_query)
    if emb is None:
        raise RuntimeError("Failed to create embedding for query.")
    results = collection.query(
        query_embeddings=[emb],
        n_results=n_results,
        include=["documents", "distances"]
    )
    docs = results.get("documents", [[]])[0]
    return docs

def ask_gemini(context, query_text, model_name="gemini-2.5-flash"):
    model = genai.GenerativeModel(model_name)
    if context:
        prompt = f"Context: {context}\n\nQuestion: {query_text}\nAnswer:"
    else:
        prompt = f"Context: (no context)\n\nQuestion: {query_text}\nAnswer:"
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
    sys.stdout.flush()

if __name__ == "__main__":
    print("Hi I'm Drona AI 🤖! Your AI assistant for this website.")
    print("Type 'exit' to quit.\n")
    while True:
        user_query = input("You: ").strip()
        if user_query.lower() == "exit":
            print("Goodbye!")
            break

        stop_event = threading.Event()
        t = threading.Thread(target=show_thinking, args=(stop_event,))
        t.start()

        try:
            docs = query_chroma(user_query, n_results=2)
            context = " ".join(docs)[:2000]  # trim context for prompt
            reply = ask_gemini(context, user_query)
        except Exception as e:
            reply = f"Error: {e}"

        stop_event.set()
        t.join()
        print("\nBot:", reply, "\n")
