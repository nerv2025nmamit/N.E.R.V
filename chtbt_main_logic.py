from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Ensure gRPC logs are silenced at runtime too
os.environ["GRPC_VERBOSITY"] = os.getenv("GRPC_VERBOSITY", "NONE")
os.environ["GRPC_TRACE"] = os.getenv("GRPC_TRACE", "none")

import chromadb
import requests
import json
from chromadb.config import Settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google import generativeai as genai
from dotenv import load_dotenv
from chromadb import PersistentClient
from sentence_transformers import SentenceTransformer

# Load .env and Gemini API key
load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Initialize FastAPI
app = FastAPI(title="Drona AI Chatbot")

# Enable CORS (so frontend can access API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to ChromaDB
# Use a path on the mounted persistent volume
PERSIST_DIR = os.getenv("./chroma_data", "/mnt/chroma_data")

client = chromadb.Client(Settings(persist_directory=PERSIST_DIR))
collection = client.get_or_create_collection(name="alumni_collection")

# Load embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Query ChromaDB for context
def query_chroma(user_query):
    """Fetch relevant alumni info from ChromaDB"""
    query_embedding = embedding_model.encode([user_query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=2
    )

    documents = results["documents"][0]
    context = " ".join(documents)
    return context


# Load API key from .env
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def ask_gemini(context, query):

    model=genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"Context: {context}\n\nQuestion: {query}\nAnswer:"
    """"You're Drona AI, Chatbot that responds to user query.
    Use this context to answer the questions correctly.
    If the user question is out of the given context then respond saying 
    that their question is out of the context"""
    resp = model.generate_content(prompt)
    return getattr(resp, "text", "") or str(resp)

import threading
import time
import sys

def show_thinking():
    """Show a 'thinking...' animation while Gemini processes the query"""
    symbols = ["⏳", "🤔", "🧠", "⌛"]
    i = 0
    while not stop_thinking:
        sys.stdout.write(f"\r{symbols[i % len(symbols)]} Thinking... please wait.")
        sys.stdout.flush()
        time.sleep(0.5)
        i += 1
    sys.stdout.write("\r" + " " * 40 + "\r")  # clear line

# Main chat loop
if __name__ == "__main__":
    print("Hi I'm Drona AI 🤖! Your AI assistant for this website.")
    print("How can I help you today?")
    print("Type 'exit' to quit.\n")

    while True:
        user_query = input("You: ")
        if user_query.lower() == "exit":
            print("👋 Goodbye! Keep Learning and Exploring 🚀")
            break

        # Start the thinking animation in a background thread
        stop_thinking = False
        t = threading.Thread(target=show_thinking)
        t.start()

        # Do the actual processing
        context = query_chroma(user_query)
        reply = ask_gemini(context, user_query)

        # Stop the animation
        stop_thinking = True
        t.join()

        print("\nBot:", reply, "\n")


