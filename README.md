# Agent functions

What if LLM agents were able to seamlessly interweave with hand-written code?
The key idea: `agent(...)` is a function that, when invoked, uses AI to write its own function body.
Here's an example:

```js
async agent(task: { question: "What is the UK's population plus the population of the USA?", format: "number" }) {
  // Fetch population data concurrently
  const [ukPopulation, usPopulation] = await Promise.all([
    await google("What is the population of the UK?").then(googleAnswer =>
      agent({ task: "Parse Google answer: What is the population of the UK?", "format": "number", googleAnswer })),
    await google("What is the population of the USA?").then(googleAnswer =>
      agent({ task: "Parse Google answer: What is the population of the USA?", "format": "number", googleAnswer })),
  ]);
  return ukPopulation + usPopulation;
}
```

Above, GPT-3.5 was given the task "What is the UK's population plus the population of the USA?",
asking for the answer as a JavaScript number.
To complete the task, it wrote JavaScript.
It used the ordinary `google(...)` function twice, running two Google queries concurrently.
For each, it spawned a sub-agent to parse the response as a JS number.
It collected the results with `Promise.all`, then used ordinary JavaScript to return the sum.

[The predominant "agent" architecture](https://python.langchain.com/en/latest/modules/agents.html)
says that an agent is a *chatbot*:
the system writes a chat history between the user, the agent, and some tools,
until the agent decides to emit an answer.
I instead say the agent is a *function*:
given input arguments, the system writes a function, which is executed in a context, and eventually returns a value.

Let's compare the "chatbot" and "function" architectures:

* **Forgetting.**
  In a chatbot architecture, the agent can never forget, because its memory is an ever-growing chat-log.
  This is bad: it's expensive, quickly hits the context length, and forgetting is an important cognitive function.
  By contrast, in a function architecture, the agent's memory is a data structure,
  and it can choose to forget data by manipulating it.

* **Concurrency.**
  In a chatbot architecture, actions are strictly sequential.
  In a function architecture, the agent can spawn parallel tasks, and collect them with `Promise.all`.
  To express sequencing, a function agent either uses semicolon-delimited commands,
  or `Promise`-based continuations.

* **Recursion.**
  In a chatbot architecture, there's no natural way to spawn sub-agents.
  In a function architecture, the agent can recursively call `agent(...)` with sub-tasks.
  (This is also a way to "temporarily forget", and focus on only data relevant to a sub-task.)

* **Syntax.**
  In a chatbot architecture, a new syntax is invented, like `Thought:`, `Action:`, `Observation:`.
  The syntax ends up being half-baked and prone to injection.
  In a function architecture, the syntax is standard JavaScript:
  thoughts are comments, actions are function calls, observations are return values.

* **Code by default.**
  In a chatbot architecture, the agent must use a special tool like `Python` to do calculation.
  In a function architecture, the agent writes code by default, e.g. `a+b` or `new Date()`.

## Issues

* The LLM likes to write many commands, where generally it should just write one, and pass the result on to another agent.
  For example, it might guess what `google` return values will look like, and parse it with a regex.
  We might want to enforce a rule that function bodies can only have a single command.
* The "function" model is _very_ expressive, which is the point, but this comes with risk.
  The LLM might emit code that goes into an infinite loop, or spawns infinite sub-agents.
  We can guard against it with timeouts and other budgets,
  but there may be many more creatively perverse ways for it to fail.

## To run it

Create `.env` and fill in:

```sh
# From https://platform.openai.com/account/api-keys
export OPENAI_API_KEY=

# From https://serpapi.com/
export SERPAPI_API_KEY=
```

Then run:

```sh
npm install
npm run build
source .env
npm run start
```

## Notes

* This began life as a TypeScript rewrite of [`llm_agents`, a Python library by Marc Päpper](https://github.com/mpaepper/llm_agents).
* See [_Scaffolded LLMs as natural language computers_](https://www.beren.io/2023-04-11-Scaffolded-LLMs-natural-language-computers/)
  a recent post by by Beren Millidge,
  with thoughts similar to those that influenced this experiment.
