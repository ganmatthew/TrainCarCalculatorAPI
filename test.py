import unittest
import requests
import os
import sys

USE_LOCAL = "--local" in sys.argv

local_domain = "http://127.0.0.1:8787/api/"
live_domain = "https://train-car-calculator-api.ganmatthew.workers.dev/api/"
endpoint = "get_train_cars"

def get_train_cars(payload: dict):
    print(f"\nRequest:\n{payload}")

    base_url = local_domain if USE_LOCAL else live_domain
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

class TrainCarsAPITest(unittest.TestCase):

    def test_valid(self):
        res = get_train_cars({
            "line": "LRT1",
            "origin": 9,
            "destination": 18,
            "exit": 0,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        })

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [4])

    def test_valid_exit(self):
        res = get_train_cars({
            "line": "LRT1",
            "origin": 9,
            "destination": 18,
            "exit": 2,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        })

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [2])

    def test_valid_exit_priority(self):
        res = get_train_cars({
            "line": "LRT1",
            "origin": 9,
            "destination": 18,
            "exit": 2,
            "carConfig": 4,
            "priority": True,
            "sender": "test"
        })

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [1])

    def test_valid_three_car(self):
        res = get_train_cars({
            "line": "MRT3",
            "origin": 0,
            "destination": 1,
            "exit": 0,
            "carConfig": 3,
            "priority": False,
            "sender": "test"
        })

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [3])

    def test_valid_four_car(self):
        res = get_train_cars({
            "line": "MRT3",
            "origin": 0,
            "destination": 1,
            "exit": 0,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        })

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [4])

    def test_invalid_index(self):
        res = get_train_cars({
            "line": "LRT1",
            "origin": 999,
            "destination": 1,
            "exit": 0,
            "carConfig": 4
        })

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 500)

    def test_missing_body(self):
        res = get_train_cars(None)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 400)

if __name__ == "__main__":
    print(f"Running tests on {"local" if USE_LOCAL else "live"} deployment")
    unittest.main(verbosity=0)