import { agent } from "../agent.js";

const result = await agent({
  question: "Population of USA except for Texas",
  format: "number",
});

console.log(result);
