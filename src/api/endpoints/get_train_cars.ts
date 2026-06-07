import { getLineData } from "../get_line_data";
import { log } from "../logger";
import { type Car, type LineData, type PayloadType } from "../types";

function getTrainCarDiff(carArr: Car[], carConfig: Car) {
	const fullSet = carConfig === 3 ? [1, 2, 3] : [1, 2, 3, 4];
	const filteredArr = fullSet.filter(car => !carArr.includes(car));
	console.info(`FurthestExit mode: Changed [${carArr}] to [${filteredArr}]`)
	return filteredArr;
}

function getTrainDirection(directions: string[], originInd: number, destinationInd: number) {
	if (directions.includes("north") && directions.includes("south")) {
		return originInd < destinationInd ? 'south' : 'north';
	} else if (directions.includes("west") && directions.includes("east")) {
		return originInd < destinationInd ? 'east' : 'west';
	} else {
		throw new Error("The directions array is invalid or the origin/destination indices are out of range");
	}
}

function filterAllowedTrainCars(carArr: Car[], numToRemove: Car, newNum: Car, minNum: Car, maxNum: Car) {
	let updatedCars = [...new Set(
		carArr.map(num => num === numToRemove ? newNum : num)
	)];
	return updatedCars.filter(num => (num >= minNum && num <= maxNum));
}

function calculateTrainCar(
    data: LineData,
    originInd: number,
    destInd: number,
    exitValue: number,
    carConfig: number,
    getNearestCar = true,
    usePriorityCar = false,
    sender = "") {

    const requestId = crypto.randomUUID();

    const line = data.line;
    const stationsData = data.stations;

    if (!stationsData) { throw new Error('Invalid data') }

    const origin = stationsData[originInd];
    const destination = stationsData[destInd];
    
    if (!origin || !destination) { throw new Error(`Invalid station indices: Value must be in range [0, ${stationsData.length - 1}]`); }
    
    const directions = data.directions;
    const direction = getTrainDirection(directions, originInd, destInd);

    if (!direction) { throw new Error(`Missing line directions OR origin ${origin} and destination ${destination} are out of range`) }

    const exitMap = destination.exitMap[direction];

	if (!exitMap) {
        throw new Error(`Cannot find exitMap of destination ${destination.name}`);
    }

    if (!exitMap[exitValue]) {
        throw new Error(`Invalid exit value: Value must be in range [0, ${exitMap.length - 1}]`);
    }

    log(requestId, "INFO", "Processing request", {
        sender,
        line,
        mode: getNearestCar ? "NearestExit" : "FurthestExit",
        origin: { name: origin.name, index: originInd },
        destination: { name: destination.name, index: destInd },
        direction,
        exitValue,
        carConfig,
        usePriorityCar
    });
    
    let carArr = exitMap[exitValue];
    
    // If not using 4-car, car 4 must be changed to car 3
    if (carConfig === 3) {
        if (carArr.includes(4)) {
            const oldValue = carArr;
            carArr = filterAllowedTrainCars(carArr, 4, 3, 1, 3);
            // console.info(`Using 3-car config: Changed from ${oldValue} to ${carArr}`);
        } else {
            // console.info(`Using 3-car config: No changes made`);
        }
    } else if (carConfig === 4) {
        // console.info(`Using 4-car config: No changes made`);
    } else {
        // throw new Error('Error in train car configuration checking condition')
    }

    // Get furthest car instead if enabled
    const carArrDiff = getNearestCar ? null : getTrainCarDiff(carArr, carConfig);

    if (usePriorityCar && carArrDiff && !carArrDiff.includes(1)) {
        carArrDiff.unshift(1);
    }

    const isLRT2 = line === "LRT-2";
    
    // If priorityCar is not checked, car 1 must be removed
    if (!isLRT2 && !usePriorityCar) {
        if (carArr.includes(1)) {
            const oldValue = carArr;
            carArr = filterAllowedTrainCars(carArr, 1, 2, 2, 4);
            // console.info(`Priority Car disabled: Changed from ${oldValue} to ${carArr}`);
        } else {
            // console.info(`Priority Car disabled: No changes made`);
        }
    } else if (isLRT2) {
        // console.info(`Using LRT-2: No changes made`);
    } else if (usePriorityCar) {
        // console.info(`Priority Car enabled: No changes made`);
    } else {
        throw new Error('Error in priority car checking condition')
    }

    const carLabel = getNearestCar ? "carArrDiff" : "carArr"
    const carValue = getNearestCar ? carArr : carArrDiff

    log(requestId, "INFO", "Request successful", { carLabel: carLabel, carValue: carValue });
    
    return [requestId, carValue];
}

export function getTrainCars(params: PayloadType) {
    if (!params) {
        return { success: false, error: "Missing request body", code: 400 };
    }

    const { line, origin, destination, exit, carConfig, priority, sender } = params;
    const lineData = getLineData(line);

    try {
        const [logId, carArr] = calculateTrainCar(
            lineData, origin, destination, exit, carConfig, true, priority, sender
        );

        return {
            success: true,
            result: { nearestCars: carArr },
            code: 200
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
            code: 500
        };
    }
}