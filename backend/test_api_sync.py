import requests
import json

def test_sync():
    url = "http://127.0.0.1:8000/context/sync"
    try:
        print(f"Sending POST request to {url}...")
        response = requests.post(url)
        
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\nSUCCESS: Sync triggered successfully.")
        else:
            print("\nFAILURE: Sync failed.")
            
    except Exception as e:
        print(f"\nERROR: Could not connect to API. Is the backend running? {e}")

if __name__ == "__main__":
    test_sync()
