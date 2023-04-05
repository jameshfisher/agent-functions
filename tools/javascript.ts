import { Tool } from "../types.js";

export const JavaScriptEvaluatorTool: Tool = {
  name: "JavaScriptEvaluator",
  description: "Works like eval() in JavaScript",

  // Yes, ChatGPT now has full control of your computer.
  use: async (js: string) => JSON.stringify(eval(js)),
};
