import os
from atlassian import Confluence
from dotenv import load_dotenv

load_dotenv(".env")

url = os.environ.get("CONFLUENCE_URL")
username = os.environ.get("CONFLUENCE_USERNAME")
token = os.environ.get("CONFLUENCE_API_TOKEN")

print(f"Connecting to {url} as {username}...")

try:
    confluence = Confluence(
        url=url,
        username=username,
        password=token,
        cloud=True
    )

    # Test 1: Simple Space Check
    # print("Checking spaces...")
    # spaces = confluence.get_all_spaces(start=0, limit=1)
    # print(f"Found space: {spaces['results'][0]['key']}" if spaces['results'] else "No spaces found")

    # Test 2: CQL Search - Recent
    cql = 'created >= now("-1h")'
    print(f"Searching with CQL: {cql}")
    results = confluence.cql(cql, limit=5)
    
    print(f"Found {len(results.get('results', []))} pages.")
    if results.get('results'):
        import json
        print("DEBUG RAW RESULT:")
        print(json.dumps(results['results'][0], indent=2))
        
except Exception as e:
    print(f"Error: {e}")
