import requests

url = f"http://127.0.0.1:8787/api/get_train_cars"

payload = {
    "line": "MRT3",
    "origin": 0,
    "destination": 6,
    "exit": 0,
    "carConfig": 3,
    "priority": False
}

response = requests.post(url, json=payload)

print("Status code:", response.status_code)

try:
    print("Response JSON:", response.json())
except Exception:
    print("Response Text:", response.text)