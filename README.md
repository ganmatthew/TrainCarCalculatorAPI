# Train Car Calculator API

The Train Car Calculator API calculates which train cars are nearest to the station exit based on trip direction, preferred exit, and other preferences on Philippine railway lines. It currently includes station and exit data for LRT-1, LRT-2, and MRT-3 in Metro Manila.

It is hosted on a Cloudflare Worker which contains both the API server and its documentation provided by Docusaurus.

The following are the available endpoints:

- `POST /api/v1/getTrainCars` - returns the nearest train car numbers for a route and destination exit.
- `POST /api/v1/getStationExits` - returns the available exits for a destination station.

Requests can identify stations by zero-based index (`inputType: "index"`) or by name/alias (`inputType: "station"`). Refer to the [API reference](docs/intro.mdx) and [line reference data](docs/reference) for payload constraints and station values.

## Requirements

- Node.js 20 or later
- npm
- A Cloudflare account and Wrangler authentication for deployment

## Local setup

1. Clone the project locally and navigate to the project directory in your terminal.
2. Next, have Node install all required libraries and dependencies by running:

```bash
npm install
```

3. Follow the instructions below when making changes to either the Docusaurus docs or the API server itself.

### Docusaurus

The documentation site is provided by Docusaurus. During Worker deployment, the source files located in the `docs/` folder are compiled into a static site which is live at [https://train-car-calculator-api.ganmatthew.workers.dev/](https://train-car-calculator-api.ganmatthew.workers.dev/).

1. Start the Docusaurus development server by running the following command:

```bash
npm run start
```

2. The Docusaurus website will be deployed to `localhost:3000`. Any changes made to these files will be polled while the server is running.
3. Ensure that the server is stopped before running the Cloudflare Worker locally or when deploying live, then compile the site by running the following command:

```bash
npm run build
```

### API Server

The API server is a Cloudflare Worker written in TypeScript.

1. To run the Worker locally with the compiled Docusaurus site, run the following:

```bash
npx wrangler dev
```

2. The local Worker will be deployed to `http://localhost:8787`.
3. You may test the API by sending requests. Example below:

```bash
curl -X POST http://localhost:8787/api/v1/getTrainCars \
  -H "Content-Type: application/json" \
  -d '{"inputType":"station","line":"LRT1","origin":"EDSA","destination":"Vito Cruz","exit":0,"carConfig":4,"priority":false}'
```

Returns:

```json
{
  "success": true,
  "result": {
    "nearestCars": [3]
  },
  "code": 200
}
```

## Checks and deployment

Run the TypeScript check and production build with:

```bash
npm run typecheck
npm run build
```

After authenticating Wrangler, deploy the Worker and site with the following command:

```bash
npx wrangler deploy
```
