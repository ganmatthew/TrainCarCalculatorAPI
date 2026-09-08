import { ZodError } from "zod";

import { getLineData } from "../getLineData";
import { validateLineData } from "../utils"

import { log } from "../logger";
import { Car, LineData, PayloadType } from "../types";
import { ValidationError } from "../errors"

function getStationIndFromName(lineData: LineData, targetStation: string, checkAliases = true) {
    const exactMatchInd = lineData.stations.findIndex(station => station.name === targetStation)
    if (exactMatchInd !== -1) { return exactMatchInd; }

    if (checkAliases) {
        const aliasMatchInd = lineData.stations.findIndex(station =>
            station.aliases?.includes(targetStation)
        );
        if (aliasMatchInd !== -1) { return aliasMatchInd; }
    }

    return null;
}

function getTrainCarDiff(carArr: Car[], carConfig: Car) {
	const fullSet = carConfig === 3 ? [1, 2, 3] : [1, 2, 3, 4];
	const filteredArr = fullSet.filter(car => !carArr.includes(car));
	console.info(`FurthestExit mode: Changed [${carArr}] to [${filteredArr}]`)
	return filteredArr;
}

function filterAllowedTrainCars(carArr: Car[], numToRemove: Car, newNum: Car, minNum: Car, maxNum: Car) {
	let updatedCars = [...new Set(
		carArr.map(num => num === numToRemove ? newNum : num)
	)];
	return updatedCars.filter(num => (num >= minNum && num <= maxNum));
}

function calculateTrainCar(
    data: LineData,
    originInd: number | null,
    destInd: number | null,
    exitValue: number | null,
    carConfig: number,
    getNearestCar = true,
    usePriorityCar = false,
    inputType: string,
    directionOverride?: string,
    sender = "") {

    const requestId = crypto.randomUUID();

    const {
		line, origin, destination, direction
	} = validateLineData(
		data.line,
		data.stations,
		originInd,
		destInd,
		data.directions,
		directionOverride
	)

    const exitMap = destination.exitMap[direction];

	if (!exitMap) {
        throw new Error(`Cannot find exitMap of destination ${destination.name} for direction ${direction}`);
    }

    if (exitMap.length === 1) {
        exitValue = 0;
    } else if (exitValue === null || exitValue === undefined || exitValue < 0 || exitValue >= exitMap.length) {
        throw new ValidationError(
            `Invalid exit value: Value must be in range [0, ${exitMap.length - 1}]`
        );
    }

    log(requestId, "INFO", "Processing request", {
        sender,
        inputType,
        line,
        mode: getNearestCar ? "NearestExit" : "FurthestExit",
        origin: origin ? { name: origin, index: originInd } : {},
        destination: { name: destination, index: destInd },
        direction,
        directionType: directionOverride ? "override" : "calculated",
        exitValue,
        carConfig,
        usePriorityCar
    });
    
    let carArr: number[] = exitMap[exitValue] ?? [];
    
    // If not using 4-car, car 4 must be changed to car 3
    if (carConfig === 3) {
        if (carArr.includes(4)) {
            // const oldValue = carArr;
            carArr = filterAllowedTrainCars(carArr, 4, 3, 1, 3);
            // console.info(`Using 3-car config: Changed from ${oldValue} to ${carArr}`);
        } else {
            // console.info(`Using 3-car config: No changes made`);
        }
    } else if (carConfig === 4) {
        // console.info(`Using 4-car config: No changes made`);
    } else {
        throw new ValidationError(`Invalid carConfig value: Value must be in range [${data.numberOfCars}]`)
    }

    // Get furthest car instead if enabled
    const carArrDiff = !getNearestCar ? getTrainCarDiff(carArr, carConfig) : undefined;

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

    const carLabel = getNearestCar ? "carArr" : "carArrDiff"
    const carValue = getNearestCar ? carArr : (carArrDiff ?? []);

    log(requestId, "INFO", "Request successful", { carLabel: carLabel, carValue: carValue });
    
    return [requestId, carValue];
}

export function getTrainCars(params: PayloadType) {
    if (!params) {
        return { success: false, error: "Missing request body", code: 400 };
    }

    const { line, exit, carConfig, priority, sender, inputType } = params;
    const lineData = getLineData(line);

    try {
        let origin: number | null = null;
        let destination: number | null = null;
        let direction: string | undefined;
        
        if (inputType === "station") {
            origin = params.origin !== undefined ? getStationIndFromName(lineData, params.origin) : null;
            destination = getStationIndFromName(lineData, params.destination);
            direction = params.direction;
        } else {
            origin = params.origin ?? null;
            destination = params.destination;
            direction = params.direction;
        }

        if (destination === null) {
            throw new ValidationError("Invalid destination")
        }

        if (origin !== null && origin === destination) {
            return {
                success: false,
                error: "Origin and destination cannot be the same",
                code: 400
            }
        }

        const [logId, carArr] = calculateTrainCar(
            lineData,
            origin,
            destination,
            exit,
            carConfig,
            true,
            priority,
            inputType,
            direction,
            sender
        );

        return {
            success: true,
            result: { nearestCars: carArr },
            code: 200
        };

    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                error: error.message,
                code: 400
            };
        }
        if (error instanceof ValidationError) {
            return {
                success: false,
                error: error.message,
                code: 400
            };
        };
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
            code: 500
        };
    }
}