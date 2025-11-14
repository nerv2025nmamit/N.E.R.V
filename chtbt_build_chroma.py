# reingest_chroma_with_gemini.py
import os
import time
import requests
from io import BytesIO
from PyPDF2 import PdfReader
from dotenv import load_dotenv
from google import generativeai as genai
import chromadb
from typing import List

load_dotenv()

# --------------------
# Config / env check
# --------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT") or os.getenv("CHROMA-TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "RAG_Chatbot_1_nerv")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "alumni_collection_new")

# If you want to overwrite the existing collection set this True.
# Be careful: this will remove/replace previously stored embeddings if you call collection.delete() (if supported).
REPLACE_COLLECTION = True

if not all([GEMINI_API_KEY, CHROMA_API_KEY, CHROMA_TENANT]):
    raise RuntimeError("Missing GEMINI_API_KEY or Chroma credentials in env. Check CHROMA_TENANT name too.")

genai.configure(api_key=GEMINI_API_KEY)
EMBED_MODEL = "models/text-embedding-004"

# --------------------
# Chroma client
# --------------------
client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE
)

# create or get collection
collection = client.get_or_create_collection(name=CHROMA_COLLECTION)



# --------------------
# Helpers
# --------------------
def pdf_to_pages(url: str) -> List[str]:
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    reader = PdfReader(BytesIO(r.content))
    pages = []
    for i, p in enumerate(reader.pages, start=1):
        txt = p.extract_text()
        if txt:
            pages.append(txt.strip())
        else:
            print(f"⚠️ Warning: page {i} had no extractable text.")
    return pages

def chunk_text(text: str, max_chars: int = 1800) -> List[str]:
    """Split long text into smaller chunks for embedding (keep under ~2000 chars)."""
    text = text.strip()
    if len(text) <= max_chars:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        # try to split on newline or space for nicer chunks
        if end < len(text):
            nl = text.rfind("\n", start, end)
            sp = text.rfind(" ", start, end)
            split = nl if nl > start else sp if sp > start else end
        else:
            split = end
        chunks.append(text[start:split].strip())
        start = split
    return chunks

def get_embedding(text: str):
    """Call Gemini embedding API (correct usage). Returns list[float]."""
    # trim to safe length
    prompt = text if len(text) <= 2000 else text[:2000]
    resp = genai.embed_content(model=EMBED_MODEL, content=prompt)
    # resp expected as dict with 'embedding'
    if isinstance(resp, dict) and "embedding" in resp:
        return resp["embedding"]
    # fallback to attribute
    if hasattr(resp, "embedding"):
        return getattr(resp, "embedding")
    raise RuntimeError("Unexpected embedding response shape: " + str(type(resp)))

# --------------------
# Ingest
# --------------------
def ingest_pdf_from_url(pdf_url: str, sleep_between_calls: float = 0.25):
    print("Fetching PDF:", pdf_url)
    pages = pdf_to_pages(pdf_url)
    if not pages:
        raise RuntimeError("No text extracted from PDF.")

    print(f"📄 Extracted {len(pages)} pages. Preparing chunks and generating embeddings...")

    docs = []
    embeddings = []
    ids = []

    idx = 0
    for page_num, page_text in enumerate(pages):
        # chunk page if too long
        chunks = chunk_text(page_text, max_chars=1800)
        for c in chunks:
            try:
                emb = get_embedding(c)
            except Exception as e:
                print(f"❌ Embedding failed for page {page_num}, chunk {idx}: {e}")
                raise
            ids.append(f"page_{page_num}_chunk_{idx}")
            docs.append(c)
            embeddings.append(emb)
            idx += 1
            time.sleep(sleep_between_calls)  # avoid rate limit spikes

    print(f"📦 Adding {len(docs)} documents to Chroma collection '{CHROMA_COLLECTION}'...")
    # Add in batches to be safe (Chroma add might accept large batches, but safer to chunk)
    batch_size = 64
    for i in range(0, len(docs), batch_size):
        batch_docs = docs[i : i + batch_size]
        batch_embs = embeddings[i : i + batch_size]
        batch_ids = ids[i : i + batch_size]
        collection.add(documents=batch_docs, embeddings=batch_embs, ids=batch_ids)
        print(f"  - added batch {i // batch_size + 1} ({len(batch_docs)} items)")
        time.sleep(0.2)

    print("✅ Ingestion complete.")
    print(collection.count())


# --------------------
# Run
# --------------------
if __name__ == "__main__":
    PDF_URL = "https://raw.githubusercontent.com/gauravkumarp33/RAG-Chatbot-1-NERV/main/alumni%20data.pdf"
    ingest_pdf_from_url(PDF_URL)
