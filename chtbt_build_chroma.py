import os
import requests
from io import BytesIO
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb
from dotenv import load_dotenv

load_dotenv()

client = chromadb.CloudClient(
    api_key=os.getenv("CHROMA_API_KEY"),
    tenant=os.getenv("CHROMA-TENANT"),
    database="RAG_Chatbot_1_nerv"
)

collection = client.get_or_create_collection("alumni_collection")

embedding_model = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L3-v2")

pdf_url = "https://raw.githubusercontent.com/gauravkumarp33/RAG-Chatbot-1-NERV/main/alumni%20data.pdf"

headers = {"User-Agent": "Mozilla/5.0"}
response = requests.get(pdf_url, headers=headers)
response.raise_for_status()

content_type = response.headers.get("content-type", "").lower()
if not ("pdf" in content_type or "octet-stream" in content_type):
    raise ValueError(f"❌ Invalid file type: {content_type}")

try:
    reader = PdfReader(BytesIO(response.content))
except Exception as e:
    raise RuntimeError(f"❌ Error reading PDF: {e}")

text_data = []
for page_num, page in enumerate(reader.pages, start=1):
    text = page.extract_text()
    if text:
        text_data.append(text.strip())
    else:
        print(f"⚠️ Warning: Page {page_num} has no extractable text.")

if not text_data:
    raise RuntimeError("❌ No text could be extracted from the PDF.")

print(f"📄 Extracted {len(text_data)} pages from PDF. Generating embeddings...")

embeddings = embedding_model.encode(text_data).tolist()

for i, (chunk, emb) in enumerate(zip(text_data, embeddings)):
    collection.add(documents=[chunk], embeddings=[emb], ids=[str(i)])

print(f"✅ Successfully added {len(text_data)} PDF pages to Chroma Cloud!")
