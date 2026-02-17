import requests

url = "http://127.0.0.1:8000/explain"
code_snippet = """
    def process_payment(self, amount: float, card_token: str) -> bool:
        retry_count = 0
        while retry_count <= self.max_retries:
            try:
                # Call Gateway V2
                result = self.gateway.charge(amount, card_token)
"""

payload = {
    "code_snippet": code_snippet,
    "file_path": "demo/payment_processor.py",
    "line_numbers": "19-33"
}

try:
    print("Testing /explain endpoint...")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
        # print(response.json())
    else:
        print("Failed!")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
