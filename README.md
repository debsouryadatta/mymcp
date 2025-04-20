### MCP
- Model Context Protocol, a new standard/rule to provide tools to LLMs
- MCP Server - Server that serve the tools to the LLMs
- MCP Client - LLM/Agent that requests the MCP server for tool usuage(Put in the inputs and get the outputs)
- MCP Server Implementation - 
  - StdioServerTransport - For local usuage(Runs the mcp server locally and mcp client connects to it using stdin and stdout)
  - ServerSideEventsTransport - For remote usuage(Runs the mcp server in the cloud and mcp client connects to it using Server-Sent Events[with http])
- MCP Clients may be - Cursor, Windsurf, or your own crewai/langgraph llms/agents
