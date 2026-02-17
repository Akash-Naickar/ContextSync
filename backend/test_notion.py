import os
import sys

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.integrations import IntegrationService
from dotenv import load_dotenv

load_dotenv(".env")

def test_integration():
    print("Initializing IntegrationService...")
    service = IntegrationService()
    
    if not service.notion:
        print("Notion service not initialized. Check credentials.")
        return

    print("Searching Notion pages...")
    # Empty query to find all
    pages = service.search_notion_pages(query="", limit=5)
    
    print(f"Found {len(pages)} pages.")
    
    for page in pages:
        print(f"\n--- Page: {page['title']} (ID: {page['id']}) ---")
        print(f"URL: {page['url']}")
        print("Content Preview:")
        print(page['content'][:500]) # Print first 500 chars
        print("---------------------------------------------------")

if __name__ == "__main__":
    test_integration()
