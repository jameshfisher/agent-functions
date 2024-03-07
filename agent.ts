import { VM } from "vm2";
import { llm } from "./llm.js";
import { GoogleSearchTool } from "./tools/google.js";

const PROMPT_TEMPLATE = (
  task: unknown
) => `\`agent\` is an async JS function whose body is dynamically written by an agent when invoked.
There are four options for how an agent can complete a task.
Option 1, answering immediately:

async agent(task: { "question": "What is two times 94", "format": "string" }) {
  // All information needed to answer is in the task
  return (2 * 94).toString();
} EOF

Option 2, summarize and simplify the task, returning a continuation agent:

async agent(task: {
  "question": "How old is the world's most popular programming language?",
  "format": "number",
  "most popular programming language": "JavaScript"
}) {
  // Simplify task: forget 'most popular programming language'
  return agent({ "question": "How old is JavaScript in years?", "format": "number" });
} EOF

Option 3, ask Google, returning a continuation agent:

async agent(task: { "question": "What year was Mohammad born?", "format": "number" }) {
  // Use Google to find an answer
  const googleResponse = await google(task.question);
  // Google response has unknown syntax, so return a continuation agent to parse it
  return agent({ ...task, ["Google response to: " + task.question]: googleResponse });
} EOF

Option 4, run sub-tasks concurrently, returning a continuation agent:

async agent(task: { "question": "What is the difference in years between the ages of Noam Chomsky and David Cameron?" }) {
  // Use Google to find answers
  const [noamChomskyDescription, davidCameronDescription] = await Promise.all([
    google("When was Noam Chomsky born?"),
    google("When was David Cameron born?"),
  ]);
  // Return continuation agent to parse the Google responses
  return agent({ ...task, "Noam Chomsky born on": noamChomskyDescription, "David Cameron born on" : davidCameronDescription });
} EOF

It must not use other APIs or libraries (e.g. fetch).
Google responses must never be parsed, but instead passed to a continuation agent.
It must not deviate from the four options above.

Now here are some excellent agent examples:

async agent(task: { question: 'Population of USA except for Texas', format: 'number' }) {
  // Use Google to find answers
  const [usaPopulationDescription, texasPopulationDescription] = await Promise.all([
    google("Population of USA"),
    google("Population of Texas"),
  ]);
  // Return continuation agent to parse the Google responses
  return agent({ ...task, usaPopulationDescription, texasPopulationDescription });
} EOF

async agent(task: ${JSON.stringify(task)}) {`;

let budget = 7;
const decr = () => {
  budget--;
  if (budget <= 0) throw new Error("Budget exceeded");
};

export const agent = async (task: unknown): Promise<unknown> => {
  decr();
  const vm = new VM({
    timeout: 5000,
    allowAsync: true,
    sandbox: {
      google: async (q: unknown) => {
        decr();
        if (typeof q !== "string") throw new Error("google() expects a string");
        console.log("google", q);
        const res = await GoogleSearchTool.use(q);
        console.log("google result", res);
        return res;
      },
      agent, // recursive call
    },
  });

  const prompt = PROMPT_TEMPLATE(task);
  console.log("task =", task);
  const jsFnBodyAndCloseBrace = await llm(prompt, ["EOF"]); // EOF is a hack. Ideally, we'd stop on a balanced brace.
  console.log(`async (task) => {
    ${jsFnBodyAndCloseBrace}`);
  const answer = await vm.run(
    `(async () => { const task = ${JSON.stringify(
      task
    )}; ${jsFnBodyAndCloseBrace} )()`
  );
  console.log({ answer });
  return answer;
};
