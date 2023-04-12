import { runAgent } from "../agent.js";
import { OpenAIChat } from "../llms/openai.js";
import { JavaScriptEvaluatorTool } from "../tools/javascript.js";

const result = await runAgent({
  llm: OpenAIChat,
  question:
    "What is the difference in years between the ages of Noam Chomsky and David Cameron?",
});

console.log(result);
