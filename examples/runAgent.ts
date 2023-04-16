import { agent } from "../agent.js";
import { OpenAIChat } from "../llms/openai.js";
import { JavaScriptEvaluatorTool } from "../tools/javascript.js";

const result = await agent(
  "What is the UK's population plus the population of the USA?"
);

console.log(result);
