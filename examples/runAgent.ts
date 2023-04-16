import { agent } from "../agent.js";
import { OpenAIChat } from "../llms/openai.js";
import { JavaScriptEvaluatorTool } from "../tools/javascript.js";

const result = await agent(
  "What was the value of the NASDAQ this week, plus the value of the S&P 500 this week, as a number?"
);

console.log(result);
