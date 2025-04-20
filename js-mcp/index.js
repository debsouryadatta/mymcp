import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "Weather Data Fetcher",
  version: "1.0.0",
});

async function getWeatherByCity(city = "") {
  if (city.toLocaleLowerCase() === "agartala") {
    return { temp: "28C", forecast: "light rain" };
  }
  if (city.toLocaleLowerCase() === "delhi") {
    return { temp: "33C", forecast: "chances of high warm winds" };
  }
  return { temp: null, error: "Unable to get data" };
}

server.tool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
  },
  async ({ city }) => {
    return { type: "text", text: JSON.stringify(getWeatherByCity(city)) };
  }
);

async function init() {
  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

init();
