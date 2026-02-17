import requests
import json

url = "http://127.0.0.1:8000/context/stats"
# Code from demo/payment_processor.py
snippets = [
    """
    def process_payment(self, amount: float, card_token: str) -> bool:
        retry_count = 0
        while retry_count <= self.max_retries:
            try:
                # Call Gateway V2
                result = self.gateway.charge(amount, card_token)
    """
]

try:
    response = requests.post(url, json={"snippets": snippets})
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
