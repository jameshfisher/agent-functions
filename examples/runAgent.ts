import { agent } from "../agent.js";

const result = await agent({
  question: "Number of COVID-19 cases in the world right now",
  format: "number",
});

console.log(result);
