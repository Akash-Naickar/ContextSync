import os
import sys
from dotenv import load_dotenv
from langchain_core.documents import Document

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.integrations import IntegrationService
from app.services.rag import RAGService

def ingest_notion():
    load_dotenv(".env")
    
    print("Initializing Services...")
    integrations = IntegrationService()
    rag = RAGService()
    
    if not integrations.notion:
        print("❌ Notion not initialized. Check NOTION_API_KEY.")
        return

    if not rag.db:
        print("❌ RAG Service (ChromaDB) not initialized.")
        return

    print("🔍 Searching Notion pages...")
    pages = integrations.search_notion_pages(query="", limit=10)
    print(f"--> Found {len(pages)} pages.")

    documents = []
    for page in pages:
        # Create a formatted content string for embedding
        full_content = f"Title: {page['title']}\nSource: Notion\n\n{page['content']}"
        
        doc = Document(
            page_content=full_content,
            metadata={
                "source": "notion",
                "title": page['title'],
                "url": page['url'],
                "id": page['id'],
                "last_edited": page.get('last_edited', '')
            }
        )
        documents.append(doc)
        print(f"   Prepared: {page['title']}")

    if documents:
        print(f"📥 Ingesting {len(documents)} Notion pages into ChromaDB...")
        rag.add_documents(documents)
        print("✅ Ingestion Complete!")
    else:
        print("⚠️ No documents to ingest.")

if __name__ == "__main__":
    ingest_notion()
