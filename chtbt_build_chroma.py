import os
import requests
from io import BytesIO
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Chroma Cloud client
client = chromadb.CloudClient(
    api_key=os.getenv("CHROMA_API_KEY"),
    tenant="1c9ca09b-e3ee-4994-83ff-e3df2c6f9108",
    database="RAG_Chatbot_1_nerv"
)

# Get or create the collection
collection = client.get_or_create_collection("alumni_collection")

# Load a lightweight embedding model for better performance
embedding_model = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L3-v2")

# PDF URL (raw GitHub file)
pdf_url = "https://raw.githubusercontent.com/gauravkumarp33/RAG-Chatbot-1-NERV/main/alumni%20data.pdf"

# Download PDF safely
headers = {"User-Agent": "Mozilla/5.0"}
response = requests.get(pdf_url, headers=headers)
response.raise_for_status()

# ✅ Accept both "application/pdf" and "application/octet-stream"
content_type = response.headers.get("content-type", "").lower()
if not ("pdf" in content_type or "octet-stream" in content_type):
    raise ValueError(f"❌ Invalid file type: {content_type}")

# Read the PDF content
try:
    reader = PdfReader(BytesIO(response.content))
except Exception as e:
    raise RuntimeError(f"❌ Error reading PDF: {e}")

# Extract text
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

# Generate embeddings
embeddings = embedding_model.encode(text_data).tolist()

# Add to Chroma Cloud
for i, (chunk, emb) in enumerate(zip(text_data, embeddings)):
    collection.add(documents=[chunk], embeddings=[emb], ids=[str(i)])

print(f"✅ Successfully added {len(text_data)} PDF pages to Chroma Cloud!")
