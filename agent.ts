import { VM } from "vm2";
import { OpenAIChat } from "./llms/openai.js";
import { GoogleSearchTool } from "./tools/google.js";

const PROMPT_TEMPLATE = ({
  task,
}: {
  task: unknown;
}) => `An agent is an async JS function whose body is dynamically written by AI when invoked, e.g.:

async agent(task: "What is ninety-four as a number?") { return 94; }

When an agent can answer with a simple calculation, it can use a JS expression, e.g.:

async agent(task: "What is two times 94 as a string?") { return (2 * 94).toString(); }

The task may be a JSON object, e.g.:

async agent(task: { "question": "What is the second item in foo?", foo: [42, 3.14, null] }) {
  return task.foo[1];
}

If the task requires external simple facts, the agent can use \`google\`, e.g.:

async agent(task: "When was JavaScript invented?") {
  return google(task);
}

If the task requires sequential steps, the agent can invoke sub-agents, e.g.:

async agent (task: "How old was QEII's father when he died?") {
  return agent({ task, "QEII's father's name was": await google("What was QEII's father's name?") });
}

The task may contain useful facts and planning, e.g.:

async agent(task: { "question": "How old is the world's most popular programming language?", "most popular programming language": "JavaScript", "javascript invention year": "1995", "current year": "2023" }) {
  return \`${2023 - 1995} years\`;
}

The agent may do async tasks concurrently, e.g.

async agent(task: "What is the difference in years between the ages of Noam Chomsky and David Cameron?") {
  const [chomskyAge, cameronAge] = await Promise.all(
    google("How old is Noam Chomsky?"),
    google("How old is David Cameron?"),
  ]);
  return agent({ task, chomskyAge, cameronAge });
}

If the task requires a plan, the agent can write one, then call itself recursively:

async agent(task: "How old was QEII's father when he died?") {
  const plan = "Find QEII's father, then find his age at death";
  return agent({ task, plan });
}

Now here's an excellent example of an agent:

async agent(task: ${JSON.stringify(task)}) {`;

const llm = OpenAIChat;

let budget = 7;

const decr = () => {
  budget--;
  if (budget <= 0) {
    throw new Error("Budget exceeded");
  }
};

export const agent = async (task: unknown): Promise<unknown> => {
  decr();
  const vm = new VM({
    timeout: 5000,
    allowAsync: true,
    sandbox: {
      task,
      google: async (q: unknown) => {
        decr();
        if (typeof q !== "string") throw new Error("google() expects a string");
        console.log("google", q);
        const res = await GoogleSearchTool.use(q);
        console.log("google res", res);
        return res;
      },
      agent, // recursive call
    },
  });

  const prompt = PROMPT_TEMPLATE({ task: vm.sandbox.task });
  console.log({ prompt });
  const jsFnBody = await llm(prompt, ["}"]);
  console.log({ jsFnBody });
  const answer = await vm.run(`(async () => {
    const task = ${JSON.stringify(task)};
    ${jsFnBody}
  })()`);
  console.log({ answer });
  return answer;
};
