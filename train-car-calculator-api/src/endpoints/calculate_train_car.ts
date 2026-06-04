import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { getLineData } from "../get_line_data";
import { type Car, LineData, AppContext, Payload, Result } from "../types";

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
    usePriorityCar = false) {

    const line = data.line;
    const stationsData = data.stations;

    if (!stationsData) { throw new Error('Invalid data') }

    const origin = stationsData[originInd];
    const destination = stationsData[destInd];
    
    if (!origin || !destination) { throw new Error('Invalid station indices'); }
    
    const directions = data.directions;
    const direction = getTrainDirection(directions, originInd, destInd);

    if (!direction) { throw new Error(`Missing line directions OR origin ${origin} and destination ${destination} are out of range`) }

    const exitMap = destination.exitMap[direction];

	if (!exitMap) {
        throw new Error(`Cannot find exitMap of destination ${destination.name}`);
    }

    if (!exitMap[exitValue]) {
        throw new Error(`Invalid exit value: ${exitValue} not in [${exitMap}]`);
    }
    
    let carArr = exitMap[exitValue];

    const modeName = getNearestCar ? "NearestExit" : "FurthestExit";
    console.info(
        `Line: ${line}\nMode: ${modeName}\nOrigin: ${origin.name} (${originInd})\nDestination: ${destination.name} (${destInd})\nDirection: ${direction}\nExit Number: ${exitValue}\nUse Priority Car: ${usePriorityCar}\nCar Configuration: ${carConfig}\nCar Result: [${carArr}]`
    );
    
    // If not using 4-car, car 4 must be changed to car 3
    if (carConfig === 3) {
        if (carArr.includes(4)) {
            const oldValue = carArr;
            carArr = filterAllowedTrainCars(carArr, 4, 3, 1, 3);
            console.info(`Using 3-car config: Changed from ${oldValue} to ${carArr}`);
        } else {
            console.info(`Using 3-car config: No changes made`);
        }
    } else if (carConfig === 4) {
        console.info(`Using 4-car config: No changes made`);
    } else {
        throw new Error('Error in train car configuration checking condition')
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
            console.info(`Priority Car disabled: Changed from ${oldValue} to ${carArr}`);
        } else {
            console.info(`Priority Car disabled: No changes made`);
        }
    } else if (isLRT2) {
        console.info(`Using LRT-2: No changes made`);
    } else if (usePriorityCar) {
        console.info(`Priority Car enabled: No changes made`);
    } else {
        throw new Error('Error in priority car checking condition')
    }
    
    return [carArr, carArrDiff];
}

export class CalculateTrainCar extends OpenAPIRoute {
	schema = {
		tags: [],
		summary: "Calculates the train cars closest to a destination station exit for a given LRT/MRT line and journey.",
		request: {
			body: {
				content: {
					"application/json": {
						schema: Payload,
                        examples: {
                            "MRT-3 - North Avenue to Shaw Boulevard - Starmall Exit": {
                                value: {
                                    line: "MRT3",
                                    origin: 0,
                                    destination: 6,
                                    exit: 0,
                                    carConfig: 3,
                                    priority: false
                                }
                            }
                        }
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns a list of train car numbers closest to the exit.",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							result: Result,
						}),
                        examples: {
                            "MRT-3 - North Avenue to Shaw Boulevard - Starmall Exit": {
                                value: {
                                    success: true,
                                    result: {
                                        nearestCars: [3, 4]
                                    }
                                }
                            }
                        }
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const params = data.body;
        
        if (!params) {
            return c.json({ success: false, error: "Missing request body" }, 400);
        }

        const line = params.line;
        const origin = params.origin;
        const destination = params.destination;
        const exit = params.exit;
        const carConfig = params.carConfig;
        const priority = params.priority;

        const lineData = getLineData(line)

		const [carArr, carArrDiff] = calculateTrainCar(
            lineData, origin, destination, exit, carConfig, true, priority
        );

		return c.json(
			{
				success: true,
				result: {
					nearestCars: carArr,
				},
			},
			200,
		);
	}
}
