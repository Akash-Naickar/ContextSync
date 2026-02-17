import requests
import json

def test_retrieve():
    url = "http://127.0.0.1:8000/context/retrieve"
    payload = {
        "code_snippet": "def process_payment(currency='USD'): pass",
        "file_path": "/fake/path/payment.py",
        "line_numbers": [10, 11]
    }
    
    print(f"Sending request to {url} with payload related to 'payment'...")
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            print("\nResponse (Context Objects):")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    test_retrieve()
