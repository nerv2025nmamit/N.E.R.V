# chroma_build.py
import os
import requests
from io import BytesIO
from PyPDF2 import PdfReader
import chromadb
from dotenv import load_dotenv
from google import generativeai as genai
import time

load_dotenv()

# Configure
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "RAG_Chatbot_1_nerv")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "alumni_collection")

if not all([CHROMA_API_KEY, CHROMA_TENANT, os.getenv("GEMINI_API_KEY")]):
    raise RuntimeError("Missing GEMINI_API_KEY or Chroma credentials in env.")

client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE
)

collection = client.get_or_create_collection(name=CHROMA_COLLECTION)

def get_embedding(text: str):
    """Get embedding from Gemini embedding model."""
    # Keep text reasonably sized — chunking should be done prior to calling this function for large docs.
    embed_model = genai.GenerativeModel("models/text-embedding-004")
    resp = embed_model.embed_content(text)
    # resp should contain an "embedding" key; adapt if your genai version differs
    return resp.get("embedding")

def extract_text_from_pdf_bytes(pdf_bytes: bytes):
    reader = PdfReader(BytesIO(pdf_bytes))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        txt = page.extract_text()
        if txt:
            pages.append(txt.strip())
        else:
            print(f"⚠️ Warning: page {i} had no extractable text.")
    return pages

def ingest_pdf_from_url(pdf_url: str):
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(pdf_url, headers=headers)
    r.raise_for_status()
    content_type = r.headers.get("content-type", "").lower()
    if not ("pdf" in content_type or "octet-stream" in content_type):
        raise ValueError(f"Invalid file type: {content_type}")

    pages = extract_text_from_pdf_bytes(r.content)
    if not pages:
        raise RuntimeError("No text extracted from PDF.")

    print(f"📄 Extracted {len(pages)} pages. Generating embeddings (this may take a while)...")

    batch = []
    ids = []
    embeddings = []
    # You can chunk pages further; here we upload page-wise
    for i, chunk in enumerate(pages):
        emb = get_embedding(chunk)
        if emb is None:
            raise RuntimeError("Embedding API returned no embedding.")
        ids.append(f"page_{i}")
        batch.append(chunk)
        embeddings.append(emb)
        # avoid very tight rate causing issues
        time.sleep(0.2)

    # Replace collection or add depending on your needs:
    collection.add(documents=batch, embeddings=embeddings, ids=ids)
    print(f"✅ Added {len(batch)} items to Chroma collection '{CHROMA_COLLECTION}'.")


if __name__ == "__main__":
    PDF_URL = "https://raw.githubusercontent.com/gauravkumarp33/RAG-Chatbot-1-NERV/main/alumni%20data.pdf"
    ingest_pdf_from_url(PDF_URL)

