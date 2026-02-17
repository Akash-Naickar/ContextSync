import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_chat():
    print("Testing Chat with Gemini...")
    
    # Test case with curly braces in context to verify the fix
    context_with_code = """
    function calculateTotal(price) {
        return price * 1.20; // 20% tax
    }
    """
    
    payload = {
        "message": "Explain the tax rate in this function.",
        "history": [],
        "context": context_with_code
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("\n--- Response ---")
        reply = data.get("reply")
        print(reply)
        print("----------------")
        
        assert "20%" in reply or "tax" in reply, "Response should mention tax or 20%"
        print("✅ Chat Test Passed (Code with Braces)!")
        
    except Exception as e:
        print(f"❌ Chat Test Failed: {e}")
        if 'response' in locals():
            print(response.text)

if __name__ == "__main__":
    test_chat()
