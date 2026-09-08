// import { log } from "./logger";
import { Station } from "./types";
import { ValidationError } from "./errors"

export function getTrainDirection(directions: string[], originInd: number, destinationInd: number) {
    if (directions.includes("north") && directions.includes("south")) {
        return originInd < destinationInd ? 'south' : 'north';
    } else if (directions.includes("west") && directions.includes("east")) {
        return originInd < destinationInd ? 'east' : 'west';
    } else {
        throw new ValidationError("The directions array is invalid or the origin/destination indices are out of range");
    }
}

export function validateLineData(
    line: string,
    stations: Station[],
    originInd: number | null,
    destInd: number | null,
    directions: string[],
    directionOverride?: string,
) {
    if (destInd === null || destInd < 0 || destInd >= stations.length) {
        throw new ValidationError(`Invalid destination station indices: Value must be in range [0, ${stations.length - 1}] for line ${line}`);
    }

    if (directionOverride === undefined && (originInd === null || originInd < 0 || originInd >= stations.length)) {
        throw new ValidationError(
            `Invalid origin station index: Value must be in range [0, ${stations.length - 1}] for line ${line}`
        )
    }

    const origin = originInd ? stations[originInd] : null;
    const destination = stations[destInd];
    const direction = directionOverride ?? getTrainDirection(directions, originInd as number, destInd);

    if (!directions.includes(direction)) {
        throw new Error(`Invalid direction ${direction}. Valid directions are: ${directions.join(", ")}`) 
    }

    return { line, origin, destination, direction }
}