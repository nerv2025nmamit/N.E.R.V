import requests
import json
from chromadb import PersistentClient
from sentence_transformers import SentenceTransformer


# Connect to ChromaDB
client = PersistentClient(path="./chroma_data")
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


# Send query + context to Ollama (Gemma)

def ask_gemma(context, query):
    """Send prompt to local Ollama API"""
    prompt = f"Context:\n{context}\n\nQuestion:\n{query}\n\nAnswer:"

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "gemma3:latest", "prompt": prompt},
        stream=True
    )

    full_response = ""
    for line in response.iter_lines():
        if line:
            data = json.loads(line.decode("utf-8"))
            if "response" in data:
                print(data["response"],end="",flush=True)
            full_response += data["response"]

    print()        
    return full_response


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

        context = query_chroma(user_query)
        reply = ask_gemma(context, user_query)
        print("\nBot:", reply, "\n")

