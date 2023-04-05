import { OpenAIChat } from "../llms/openai.js";
const result = await OpenAIChat("Who is the president of the USA?");
console.log(result);
