import { getTrainCars } from "./api/endpoints/getTrainCars";
import { getStationExits } from "./api/endpoints/getStationExits";
import { Payload, StationExitPayload } from "./api/types";

const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
};

export default {
	async fetch(request: Request, env: any, ctx: any) {
		const url = new URL(request.url);

		if (url.pathname.startsWith('/api/')) {
			
			if (request.method === 'POST' && url.pathname === '/api/v1/getTrainCars') {
				try {
					const rawBody = await request.json();
					const parsed = Payload.safeParse(rawBody);
					
					if (!parsed.success) {
						return new Response(JSON.stringify({ 
							success: false, 
							code: 400,
							error: "Invalid payload", 
							issues: parsed.error.issues 
						}), {
							status: 400,
							headers: corsHeaders
						});
					}

					const inputType = parsed.data.inputType;
					console.log(`Inferred payload input type: '${inputType}'`);
					
					const responseData = getTrainCars(parsed.data);

					return new Response(JSON.stringify(responseData), {
						status: responseData.code,
						headers: corsHeaders
					});

				} catch (error) {

					return new Response(JSON.stringify({ 
						success: false, 
						code: 400,
						error: "Invalid JSON payload" 
					}), { 
						status: 400, 
						headers: corsHeaders
					});
				}
			}

			if (request.method === 'POST' && url.pathname === '/api/v1/getStationExits') {
				try {
					const rawBody = await request.json();
					const parsed = StationExitPayload.safeParse(rawBody);

					if (!parsed.success) {
						return new Response(JSON.stringify({
							success: false,
							code: 400,
							error: "Invalid payload",
							issues: parsed.error.issues
						}), {
							status: 400,
							headers: corsHeaders
						});
					}

					const responseData = getStationExits(parsed.data);

					return new Response(JSON.stringify(responseData), {
						status: responseData.code,
						headers: corsHeaders
					});

				} catch (error) {
					return new Response(JSON.stringify({ 
						success: false, 
						code: 400,
						error: "Invalid JSON payload" 
					}), { 
						status: 400, 
						headers: corsHeaders
					});
				}
			}

			return new Response(JSON.stringify({ success: false, error: "Endpoint not found", code: 404 }), { 
				status: 404, 
				headers: corsHeaders
			});
		}

		return env.ASSETS.fetch(request);
	}
};