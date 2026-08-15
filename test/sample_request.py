import unittest
import requests
import os
from dotenv import load_dotenv
from time import time
import sys

load_dotenv()

LOCAL_DOMAIN = os.getenv("LOCAL_DOMAIN")
LIVE_DOMAIN = os.getenv("LIVE_DOMAIN")

def post_request(payload: dict, endpoint: str, use_local=False):
    print(f"\nRequest:\n{payload}")

    base_url = LOCAL_DOMAIN if use_local else LIVE_DOMAIN
    url = f"{base_url}{endpoint}"
    start_time = time()
    response = requests.post(url, json=payload)
    latency_ms = int((time() - start_time) * 1000) or 0

    print(f"Status code: {response.status_code}\nLatency: {latency_ms} ms")

    try:
        print(f"Response:\n{response.json()}")
        return response.json()
    except Exception:
        return {
            "success": False,
            "error": "Invalid JSON response",
            "message": response.text,
            "code": response.status_code,
            "nearestCars": []
        }


def get_train_cars(payload: dict, use_local=False):
    return post_request(payload, "/api/v1/getTrainCars", use_local)


def get_station_exits(payload: dict, use_local=False):
    return post_request(payload, "/api/v1/getStationExits", use_local)

if __name__ == "__main__":
    payload = {
        "inputType": "index",
        "line": "LRT1",
        "origin": 9,
        "destination": 18,
        "exit": 0,
        "carConfig": 4,
        "priority": False,
        "sender": "test"
    }
    
    get_train_cars(payload)