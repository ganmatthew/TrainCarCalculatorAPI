import unittest
from sample_request import get_train_cars
from dotenv import load_dotenv
import sys

load_dotenv()

USE_LOCAL = "--local" in sys.argv

class TrainCarsAPITest(unittest.TestCase):

    def test_valid(self):
        res = get_train_cars({
            "inputType": "station",
            "line": "LRT1",
            "origin": "Doroteo Jose",
            "destination": "EDSA",
            "exit": 0,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [4])

    def test_valid_exit(self):
        res = get_train_cars({
            "inputType": "station",
            "line": "LRT1",
            "origin": "Doroteo Jose",
            "destination": "EDSA",
            "exit": 2,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [2])

    def test_valid_exit_priority(self):
        res = get_train_cars({
            "inputType": "station",
            "line": "LRT1",
            "origin": "Doroteo Jose",
            "destination": "EDSA",
            "exit": 2,
            "carConfig": 4,
            "priority": True,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [1])

    def test_valid_three_car(self):
        res = get_train_cars({
            "inputType": "station",
            "line": "MRT3",
            "origin": "North Avenue",
            "destination": "Quezon Avenue",
            "exit": 0,
            "carConfig": 3,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [3])

    def test_valid_four_car(self):
        res = get_train_cars({
            "inputType": "station",
            "line": "MRT3",
            "origin": "North Avenue",
            "destination": "Quezon Avenue",
            "exit": 0,
            "carConfig": 4,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [4])

    def test_aliases(self):
        res = get_train_cars({
            "inputType": "station",
            "line": "MRT3",
            "origin": "Araneta-Cubao",
            "destination": "GMA-Kamuning",
            "exit": 0,
            "carConfig": 3,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["nearestCars"] == [3])

    def test_same_origin_destination(self):
        res = get_train_cars({
            "inputType": "station",
            "line": "MRT3",
            "origin": "Taft Avenue",
            "destination": "Taft Avenue",
            "exit": 0,
            "carConfig": 3,
            "priority": False,
            "sender": "test"
        }, USE_LOCAL)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 400)


    def test_invalid_index(self):
        res = get_train_cars({
            "inputType": "station",
            "line": "LRT1",
            "origin": "North Avenue",
            "destination": "Balintawak",
            "exit": 0,
            "carConfig": 4
        }, USE_LOCAL)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 400)

    def test_missing_body(self):
        res = get_train_cars(None)

        self.assertFalse(res["success"])
        self.assertEqual(res["code"], 400)

if __name__ == "__main__":
    print(f"Running tests on {"local" if USE_LOCAL else "live"} deployment")
    unittest.main(verbosity=0)