import { ZodError } from "zod";

import { getLineData } from "../getLineData";
import { log } from "../logger";
import { LineData, StationExitPayloadType } from "../types";

class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

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

function getTrainDirection(directions: string[], originInd: number, destinationInd: number) {
    if (directions.includes("north") && directions.includes("south")) {
        return originInd < destinationInd ? 'south' : 'north';
    } else if (directions.includes("west") && directions.includes("east")) {
        return originInd < destinationInd ? 'east' : 'west';
    } else {
        throw new ValidationError("The directions array is invalid or the origin/destination indices are out of range");
    }
}

function calculateStationExits(
    data: LineData,
    originInd: number | null,
    destInd: number | null,
    inputType: string,
    sender = ""
) {
    const requestId = crypto.randomUUID();
    const line = data.line;
    const stations = data.stations;

    if (originInd === null || destInd === null || originInd < 0 || destInd < 0 || originInd >= stations.length || destInd >= stations.length) {
        throw new ValidationError(`Invalid station indices: Value must be in range [0, ${stations.length - 1}] for line ${line}`);
    }

    if (originInd === destInd) {
        throw new ValidationError("Origin and destination cannot be the same");
    }

    const origin = stations[originInd];
    const destination = stations[destInd];
    const direction = getTrainDirection(data.directions, originInd, destInd);

    if (!direction) { throw new Error(`Missing line directions OR origin ${origin} and destination ${destination} are out of range`) }

    const exitMap = destination.exitMap[direction];

    if (!exitMap) {
        throw new Error(`Cannot find exitMap for destination ${destination.name}`);
    }

    const exits = destination.exits ?? [];
    const stationExits = exitMap.map((_, index) => ({
        index,
        name: exits[index] ?? `Exit ${index}`
    }));

    log(requestId, "INFO", "Processing station exit request", {
        sender,
        inputType,
        line,
        origin: { name: origin.name, index: originInd },
        destination: { name: destination.name, index: destInd },
        direction,
        exits: stationExits
    });

    return [requestId, stationExits];
}

export function getStationExits(params: StationExitPayloadType) {
    if (!params) {
        return { success: false, error: "Missing request body", code: 400 };
    }

    const { line, sender, inputType } = params;
    const lineData = getLineData(line);

    try {
        let origin, destination;

        if (inputType === "station") {
            origin = getStationIndFromName(lineData, params.origin);
            destination = getStationIndFromName(lineData, params.destination);
        } else {
            origin = params.origin;
            destination = params.destination;
        }

        const [logId, exits] = calculateStationExits(
            lineData,
            origin,
            destination,
            inputType,
            sender
        );

        return {
            success: true,
            result: { exits },
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
