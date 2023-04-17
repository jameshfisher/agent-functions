import { VM } from "vm2";
import { llm } from "./llm.js";
import { GoogleSearchTool } from "./tools/google.js";

const PROMPT_TEMPLATE = (
  task: unknown
) => `\`agent\` is an async JS function whose body is dynamically written by an agent when invoked, e.g.:

async agent(task: "Return ninety-four") {
  return 94;
} EOF

The task may be a JSON object, e.g.:

async agent(task: { "question": "What is the second item in foo?", foo: [42, 3.14, null] }) {
  return task.foo[1];
} EOF

The task may specify a return value format, e.g.:

async agent(task: { "question": "What is two times 94", "format": "string" }) {
  // Assuming decimal notation for numeric string
  return (2 * 94).toString();
} EOF

The task may contain useful facts and planning, e.g.:

async agent(task: {
  "question": "How old is the world's most popular programming language?",
  "format": "string",
  "most popular programming language": "JavaScript",
  "javascript invention year": "1995",
  "current year": "2023"
}) {
  return \`${2023 - 1995} years\`;
} EOF

If completing a task requires sequential steps, the agent can invoke sub-agents, e.g.:

async agent (task: "What was the gap in years between Jesus' death and the invention of the printing press?") {
  const jesusDeathYear = await agent({ question: "What year did Jesus die?", "format": "number" });
  const inventionOfPrintingPressYear = await agent({ question: "In what year was the printing press invented", "format": "number" });
  return inventionOfPrintingPressYear - jesusDeathYear;
} EOF

If the task requires external simple facts, the agent can use \`google\`.
To parse a Google response, it must use a sub-agent, e.g.

async agent(task: { question: "What year was Mohammad born?", "format": "number" }) {
  return google(task.question).then(googleAnswer => agent({ ...task, googleAnswer });
} EOF

Agents may be asked to parse Google responses, e.g.

async agent(task: { question: "Parse Google answer: What year was Mohammad born?", "format": "number", "googleAnswer": "Mohammad was born in 570 CE." }) {
  return 570;
} EOF

The agent may do async tasks concurrently, e.g.

async agent(task: "What is the difference in years between the ages of Noam Chomsky and David Cameron?") {
  // Ages can be fetched concurrently
  const [chomskyAgeYears, cameronAgeYears] = await Promise.all([
    await google("How old is Noam Chomsky?").then(googleAnswer => agent({ task: "How old is Noam Chomsky in years?", "format": "number", googleAnswer }),
    await google("How old is David Cameron?").then(googleAnswer => agent({ task: "How old is David Cameron in years?", "format": "number", googleAnswer }),
  ]);
  return Math.abs(chomskyAgeYears - cameronAgeYears);
} EOF

The agent must not use other APIs (e.g. fetch).
The agent must not use regexes for parsing responses; it must use a sub-agent.

Now here's an excellent example of an agent:

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
