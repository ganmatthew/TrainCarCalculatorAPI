import unittest
import requests
import os
from dotenv import load_dotenv
import sys

load_dotenv()

LOCAL_DOMAIN = os.getenv("LOCAL_DOMAIN")
LIVE_DOMAIN = "https://train-car-calculator-api.ganmatthew.workers.dev"
endpoint = "/api/get_train_cars"

def get_train_cars(payload: dict, use_local=False):
    print(f"\nRequest:\n{payload}")

    base_url = LOCAL_DOMAIN if use_local else LIVE_DOMAIN
    url = f"{base_url}{endpoint}"
    response = requests.post(url, json=payload)

    print("Status code:", response.status_code)

    try:
        print(f"Response:\n{response.json()}")
        return response.json()
    except Exception:
        # print(f"\nResponse text:\n{response.text}\n")
        return {
            "success": False,
            "error": "Invalid JSON response",
            "message": response.text,
            "code": response.status_code,
            "nearestCars": []
        }
    
if __name__ == "__main__":
    payload = {
        "line": "LRT1",
        "origin": 9,
        "destination": 18,
        "exit": 0,
        "carConfig": 4,
        "priority": False,
        "sender": "test"
    }
    
    get_train_cars(payload)