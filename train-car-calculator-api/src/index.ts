import { fromHono } from "chanfana";
import { Hono } from "hono";
import { CalculateTrainCar } from "./endpoints/calculate_train_car";

const app = new Hono<{ Bindings: Env }>();

const openapi = fromHono(app, {
	docs_url: "/",
});

openapi.post("/api/calculate", CalculateTrainCar);

export default app;
