import { getLineData } from "./get_line_data";
import { calculateTrainCar } from "./calculate_train_car";

function requireParam(url: URL, param: string) {
    const value = url.searchParams.get(param)
    if (!value) {
        throw new Response(JSON.stringify({
            error: "Bad request",
            message: `Missing '${param}' parameter in query`
        }), { status: 400 });
    }
    return value;
}

export default {
  async fetch(request, env) {
    try {
        const url = new URL(request.url);

        const line = requireParam(url, "line");
        const origin = requireParam(url, "origin");
        const destination = requireParam(url, "destination");
        const carConfig = requireParam(url, "carConfig");

        const exit = url.searchParams.get("exit") ?? "0"; // defaults to exit 0
        const priority = url.searchParams.get("priority") === "true"; // defaults to false

        const assetUrl = new URL(`/data/${line}.json`, request.url)
        const dataResponse = await env.ASSETS.fetch(
            new Request(assetUrl)
        );

        if (!dataResponse.ok) {
            return new Response(JSON.stringify({
                error: `${line} is not a valid or supported train line`
            }), { status: 400 });
        }

        const lineData = await dataResponse.json();
        
        const [carArr, carArrDiff] = calculateTrainCar(
            lineData, parseInt(origin), parseInt(destination), parseInt(exit), parseInt(carConfig), true, priority
        );

        return new Response(JSON.stringify({
          nearestCars: carArr,
          furthestCars: carArrDiff
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

      } catch (error: any) {
            return new Response(JSON.stringify({
                error: "Internal server error",
                message: error?.message ?? String(error)
            }), { status: 500 });
        }
    }
};
