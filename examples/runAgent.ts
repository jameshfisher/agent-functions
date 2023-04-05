import { runAgent } from "../agent.js";
import { OpenAIChat } from "../llms/openai.js";
import { JavaScriptEvaluatorTool } from "../tools/javascript.js";

const result = await runAgent({
  llm: OpenAIChat,
  tools: [JavaScriptEvaluatorTool],
  question: "What is the sine of 7 * 9?",
});

console.log(result);
