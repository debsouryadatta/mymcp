import { MCPClient } from 'easy-mcp-use';
import { MCPAgent, MCPAgentOptions } from 'easy-mcp-use';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
dotenv.config();
 

const openAIApiKey = process.env.openRouteApiKey; 

if (!openAIApiKey) {
  throw new Error("openAIApiKey environment variable is not set");
}
console.log(`openAIApiKey: ${openAIApiKey}`);

async function main() {
    

  let config = {
    "mcpServers": {
      "n8n": {
        "command": "npx",
        "args": [
          "-y",
          "supergateway",
          "--sse",
          process.env.N8N_URL
        ]
      }
    }
  }
  
  // 从配置文件创建客户端
  const client = MCPClient.fromConfig( config );

  try { 
    const chat = new ChatOpenAI(
      {
        modelName: 'google/gemini-2.0-flash-exp:free', 
        streaming: true,
        openAIApiKey: openAIApiKey,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1'
        }
      }
    );
    let options = {
      client: client,
      // verbose: true,
      maxSteps: 30, 
      llm:  chat,
    }
    let agent = new MCPAgent(options)

    let result = await agent.run(
      `
      what are my todos?
      ` 
    );

    console.log("Result:", JSON.stringify(result) );
    console.log("Result:", result.output );
  } finally {
    // Properly terminate the process after execution
    console.info('Terminating process...');
    // Give some time for any pending operations to complete
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
}

main().catch(console.error);
