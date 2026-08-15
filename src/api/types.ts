import { z } from "zod";
import { getLineValues } from "./getLineData";

export type Coords = {
  lat: number;
  long: number;
};

export type Car = number;

export type Station = {
	name: string,
	aliases: string[],
	platformType: string,
	exits: string[],
	exitMap: Record<string, Car[][]>
}

export type LineData = {
	line: string,
	aliases: string[],
	numberOfCars: number[],
	directions: string[],
	stations: Station[]
}

export type StationTableProps = {
  lineData: LineData;
};

// Get valid line names and aliases and validate case-insensitively
const allowedLines = getLineValues().map(v => v.toLowerCase());
const preprocessLine = (val: unknown) => typeof val === 'string' ? val.toLowerCase() : val;

const BasePayload = z.object({
	line: z.preprocess(preprocessLine, z.enum(allowedLines as [string, ...string[]])),
	exit: z.number().int().min(0).default(0),
	carConfig: z.number().int().min(3).max(4),
	priority: z.boolean().default(false),
	sender: z.string().max(30).default("")
});

const StationExitBasePayload = z.object({
	line: z.preprocess(preprocessLine, z.enum(allowedLines as [string, ...string[]])),
	sender: z.string().max(30).default("")
});

const IndexPayload = BasePayload.extend({
	inputType: z.literal("index"),
	origin: z.number().int().min(0),
	destination: z.number().int().min(0)
});

const StationPayload = BasePayload.extend({
	inputType: z.literal("station"),
	origin: z.string().min(1),
	destination: z.string().min(1)
});

const StationExitIndexPayload = StationExitBasePayload.extend({
	inputType: z.literal("index"),
	origin: z.number().int().min(0),
	destination: z.number().int().min(0)
});

const StationExitStationPayload = StationExitBasePayload.extend({
	inputType: z.literal("station"),
	origin: z.string().min(1),
	destination: z.string().min(1)
});

// const CoordinatePayload = BasePayload.extend({
//     inputType: z.literal("coordinates"),
//     origin: z.object({
//         lat: z.number(),
//         long: z.number()
//     }),
//     destination: z.object({
//         lat: z.number(),
//         long: z.number()
//     })
// });

export const Payload = z.discriminatedUnion(
	"inputType", 
	[
		IndexPayload,
		StationPayload
		// CoordinatePayload
	]
);

export const StationExitPayload = z.discriminatedUnion(
	"inputType",
	[
		StationExitIndexPayload,
		StationExitStationPayload
	]
);

export type PayloadType = z.infer<typeof Payload>;
export type StationExitPayloadType = z.infer<typeof StationExitPayload>;

export const Response = z.object({
	  nearestCars: z.array(z.number())
});
