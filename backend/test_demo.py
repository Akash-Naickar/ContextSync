import requests
import json
import time

url = "http://127.0.0.1:8000/context/retrieve"
code_snippet = """
    def process_payment(self, amount: float, card_token: str) -> bool:
        # We need to know about payment APIs
        pass
"""

payload = {
    "code_snippet": code_snippet,
    "file_path": "demo/payment_processor.py",
    "line_numbers": "10-20"
}

start_time = time.time()
try:
    print("Testing /context/retrieve endpoint...")
    response = requests.post(url, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Time Taken: {time.time() - start_time:.2f}s")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Received {len(data)} context objects.")
        for item in data:
            title = item.get('title_or_user', 'No Title')
            source = item.get('source', 'unknown')
            print(f" - [{source}] {title}")
            print(f"   URL: {item.get('url', 'No URL')}")
    else:
        print("Failed!")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
