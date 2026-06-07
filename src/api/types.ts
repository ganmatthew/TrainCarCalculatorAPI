import { z } from "zod";

export type Car = number;

export type Station = {
    name: string,
    platformType: string,
    exits: string[],
    exitMap: Record<string, Car[][]>
}

export type LineData = {
    line: string,
    numberOfCars: number[],
    directions: string[],
    stations: Station[]
}

export const Payload = z.object({
    line: z.enum(["LRT1", "LRT2", "MRT3"])
		.describe("Train line"),
    origin: z.int().min(0)
		.describe("Index of the origin station"),
    destination: z.int().min(0)
		.describe("Index of the destination station"),
    exit: z.int().min(0).default(0)
		.describe("Exit index at the destination station. Default value is 0."),
    carConfig: z.int().min(3).max(4)
		.describe("Type of train car configuration"),
    priority: z.boolean().default(false)
		.describe("When true, the priority car (first car) will be included in the results."),
    sender: z.string().max(30).default("")
        .describe("As a courtesy, you may optionally identify what application is sending this API request.")
})

export type PayloadType = z.infer<typeof Payload>;

export const Response = z.object({
	nearestCars: z.array(z.number())
});
