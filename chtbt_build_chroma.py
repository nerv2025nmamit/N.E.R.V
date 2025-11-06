import os
import chromadb
import requests
from io import BytesIO
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
from chromadb import HttpClient
from dotenv import load_dotenv

load_dotenv()

client = chromadb.CloudClient(
  api_key=os.getenv("CHROMA_API_KEY"),
  tenant="1c9ca09b-e3ee-4994-83ff-e3df2c6f9108",
  database="RAG_Chatbot_1_nerv"
)

collection = client.get_or_create_collection("alumni_collection")

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

pdf_url = "https://raw.githubusercontent.com/gauravkumarp33/RAG-Chatbot-1-NERV/main/alumni%20data.pdf"

response = requests.get(pdf_url)
response.raise_for_status()

reader = PdfReader(BytesIO(response.content))

text_data = []
for page in reader.pages:
    text = page.extract_text()
    if text:
        text_data.append(text.strip())

embeddings = embedding_model.encode(text_data).tolist()

for i, (chunk, emb) in enumerate(zip(text_data, embeddings)):
    collection.add(documents=[chunk], embeddings=[emb], ids=[str(i)])

print(f"✅ Successfully added {len(text_data)} PDF pages to Chroma Cloud!")
