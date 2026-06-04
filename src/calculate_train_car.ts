type Car = number;

type Station = {
    name: string,
    platformType: string,
    exits: string[],
    exitMap: Record<string, Car[][]>
}

type LineData = {
    line: string,
    numberOfCars: number[],
    directions: string[],
    stations: Station[]
}

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
    const carArrDiff = !getNearestCar ? getTrainCarDiff(carArr, carConfig) : null;

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

export { calculateTrainCar }