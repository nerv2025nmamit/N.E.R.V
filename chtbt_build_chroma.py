from sentence_transformers import SentenceTransformer
import chromadb
from PyPDF2 import PdfReader
from chromadb import PersistentClient

# Initialize embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize Chroma client
client = PersistentClient(path="./chroma_data")

# Create (or get) collection
collection = client.get_or_create_collection(name="alumni_collection")

# Load and extract text from PDF
pdf_path = r"C:\Users\HP\.vscode\nerv_1\alumni data.pdf"
reader = PdfReader(pdf_path)

text_data = []
for page in reader.pages:
    text = page.extract_text()
    if text:
        text_data.append(text.strip())

# Compute embeddings
embeddings = embedding_model.encode(text_data).tolist()

# Add text and embeddings to ChromaDB
for i, (chunk, emb) in enumerate(zip(text_data, embeddings)):
    collection.add(documents=[chunk], embeddings=[emb], ids=[str(i)])


print(f"✅ Added {len(text_data)} PDF pages to Chroma DB successfully with embeddings!")
