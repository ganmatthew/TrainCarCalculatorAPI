import type { Context } from "hono";
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

export type AppContext = Context<{ Bindings: Env }>;

export const Payload = z.object({
    line: z.string(),
    origin: z.int(),
    destination: z.int(),
    exit: z.int(),
    carConfig: z.int(),
    priority: z.boolean()
})

export const Result = z.object({
	nearestCars: z.array(z.number())
});
