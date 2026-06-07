import { getTrainCars } from "./api/endpoints/get_train_cars";
import { Payload } from "./api/types";

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      
      if (request.method === 'POST' && url.pathname === '/api/get_train_cars') {
        try {
          const body = await request.json();
          const parsedData = Payload.safeParse(body);
          
          if (!parsedData.success) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: "Invalid payload", 
              issues: parsedData.error.issues 
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          const responseData = getTrainCars(parsedData.data);

          return new Response(JSON.stringify(responseData), {
            status: responseData.code,
            headers: { "Content-Type": "application/json" }
          });

        } catch (error) {

          return new Response(JSON.stringify({ 
            success: false, 
            code: 400,
            error: "Invalid JSON payload" 
          }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          });
        }
      }

      return new Response(JSON.stringify({ success: false, error: "Endpoint not found", code: 404 }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" }
      });
    }

    return env.ASSETS.fetch(request);
  }
};