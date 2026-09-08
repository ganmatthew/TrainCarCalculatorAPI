import { ZodError } from "zod";

import { getLineData } from "../getLineData";
import { validateLineData } from "../utils";

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
	directionOverride?: string,
	sender = ""
) {
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
		throw new Error(`Cannot find exitMap for destination ${destination.name}`);
	}

	const exits = destination.exits ?? [];
	const stationExits = exitMap.map((carPositions, index) => ({
			index,
			name: exits[index] ?? `Exit ${index}`,
			carPositions
		}))
		.filter(exit => exit.carPositions.length > 0)
		.map(({ index, name }) => ({
			index,
			name
		}));

	log(requestId, "INFO", "Processing station exit request", {
		sender,
		inputType,
		line,
		origin: origin ? { name: origin, index: originInd } : {},
		destination: { name: destination, index: destInd },
		direction,
		directionType: directionOverride ? "override" : "calculated",
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
		let origin: number | null = null;
        let destination: number | null = null;
        let direction: string | undefined;

		if (inputType === "station") {
			origin = params.origin !== undefined ? getStationIndFromName(lineData, params.origin) : null;
			destination = getStationIndFromName(lineData, params.destination);
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

		const [logId, exits] = calculateStationExits(
			lineData,
			origin,
			destination,
			inputType,
			direction,
			sender,
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
