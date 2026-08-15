import unittest
from sample_request import get_train_cars, get_station_exits
from dotenv import load_dotenv
import sys

load_dotenv()

USE_LOCAL = "--local" in sys.argv

class TrainCarsAPITest(unittest.TestCase):

    def test_valid(self):
        res = get_train_cars({
            "inputType": "index",
            "line": "LRT-1",
            "origin": 9,
            "destination": 18,
            "exit": 0,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [4])

    def test_valid_exit(self):
        res = get_train_cars({
            "inputType": "index",
            "line": "LRT-1",
            "origin": 9,
            "destination": 18,
            "exit": 2,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [2])

    def test_valid_exit_priority(self):
        res = get_train_cars({
            "inputType": "index",
            "line": "1",
            "origin": 9,
            "destination": 18,
            "exit": 2,
            "carConfig": 4,
            "priority": True,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [1])

    def test_valid_three_car(self):
        res = get_train_cars({
            "inputType": "index",
            "line": "3",
            "origin": 0,
            "destination": 1,
            "exit": 0,
            "carConfig": 3,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [3])

    def test_valid_four_car(self):
        res = get_train_cars({
            "inputType": "index",
            "line": "mrt3",
            "origin": 0,
            "destination": 1,
            "exit": 0,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [4])

    def test_get_station_exits_index(self):
        res = get_station_exits({
            "inputType": "index",
            "line": "lrt-2",
            "origin": 6,
            "destination": 7,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertEqual(res["result"]["exits"][0]["index"], 0)
        self.assertEqual(res["result"]["exits"][1]["index"], 1)

    def test_same_origin_destination(self):
        res = get_train_cars({
            "inputType": "index",
            "line": "MRT3",
            "origin": 12,
            "destination": 12,
            "exit": 0,
            "carConfig": 3,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 400)

    def test_invalid_line_alias(self):
        res = get_train_cars({
            "inputType": "index",
            "line": "LRT Line 1",
            "origin": 9,
            "destination": 10,
            "exit": 0,
            "carConfig": 4
        }, USE_LOCAL)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 400)

    def test_invalid_index(self):
        res = get_train_cars({
            "inputType": "index",
            "line": "LRT1",
            "origin": 25,
            "destination": -25,
            "exit": 0,
            "carConfig": 4
        }, USE_LOCAL)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 400)

    def test_missing_body(self):
        res = get_train_cars(None, USE_LOCAL)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 400)

if __name__ == "__main__":
    print(f"Running tests on {"local" if USE_LOCAL else "live"} deployment")
    unittest.main(verbosity=0)