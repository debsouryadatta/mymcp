import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from 'express';
import cors from 'cors';

// Create server instance
const server = new McpServer({
  name: "js-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// 1. Calculator Tool - For performing basic mathematical operations
server.tool(
  "calculator",
  "Perform basic mathematical operations",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("The mathematical operation to perform"),
    a: z.number().describe("First operand"),
    b: z.number().describe("Second operand"),
  },
  async ({ operation, a, b }) => {
    let result;
    
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Division by zero is not allowed.",
              },
            ],
          };
        }
        result = a / b;
        break;
      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown operation: ${operation}`,
            },
          ],
        };
    }

    return {
      content: [
        {
          type: "text",
          text: `Result of ${operation}(${a}, ${b}) = ${result}`,
        },
      ],
    };
  }
);

// 2. Static Weather Info Tool - For demonstrating a simple static response
server.tool(
  "weather-info",
  "Get static weather information for a city",
  {
    city: z.string().describe("Name of the city to get weather information for"),
  },
  async ({ city }) => {
    // Static weather data (this would normally come from an API)
    const weatherData = {
      "New York": {
        temperature: 72,
        condition: "Partly Cloudy",
        humidity: 65,
      },
      "London": {
        temperature: 62,
        condition: "Rainy",
        humidity: 80,
      },
      "Tokyo": {
        temperature: 80,
        condition: "Sunny",
        humidity: 50,
      },
      "Sydney": {
        temperature: 85,
        condition: "Clear",
        humidity: 45,
      },
    };

    // Check if we have data for the requested city
    if (weatherData[city]) {
      const data = weatherData[city];
      return {
        content: [
          {
            type: "text",
            text: `Weather for ${city}:\nTemperature: ${data.temperature}°F\nCondition: ${data.condition}\nHumidity: ${data.humidity}%`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `No weather data available for ${city}. Available cities are: ${Object.keys(weatherData).join(", ")}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const args = process.argv.slice(2);
  const transportType = args[0] || "stdio"; // Default to stdio if no argument

  if (transportType === "sse") {
    // --- SSE Transport Setup using Express ---
    const app = express();
    const port = 3000;

    // Enable CORS for all origins (adjust in production)
    app.use(cors());

    let transportInstance = null;

    // Endpoint for SSE connection initiation
    app.get("/sse", (req, res) => {
      console.error("SSE client connected");
      // Note: The SDK's SseServerTransport might differ slightly from the example.
      // Correct argument order: path, then response object
      transportInstance = new SSEServerTransport("/messages", res); 
      server.connect(transportInstance);
      
      // Keep connection open
      req.on('close', () => {
        console.error("SSE client disconnected");
        // Optionally handle disconnection cleanup if needed by the SDK
        // transportInstance?.close(); // Check SDK docs if manual close is needed
        transportInstance = null; 
      });
    });

    // Endpoint for receiving messages from the client via POST
    app.post("/messages", (req, res) => { 
      if (transportInstance) {
        try {
          // Pass raw req and res, assume SDK handles everything
          transportInstance.handlePostMessage(req, res);
        } catch (error) {
          console.error("Error handling POST message:", error);
          // Send a generic error if headers aren't already sent (e.g., by SDK)
          if (!res.headersSent) {
            res.status(500).send("Internal Server Error handling message");
          }
        }
      } else {
        console.error("POST /messages received but no active SSE transport instance.");
        res.status(503).send("SSE transport not available");
      }
    });

    app.listen(port, '127.0.0.1', () => { 
      console.error(`MCP Server running with SSE transport on http://127.0.0.1:${port}`);
    });
    // Keep the process running for the Express server
    await new Promise(() => {}); 

  } else {
    // --- stdio Transport Setup ---
    const transport = new StdioServerTransport();
    console.error("MCP Server running on stdio");
    await server.connect(transport);
    // Keep the process running for stdio
    await new Promise(() => {});
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});