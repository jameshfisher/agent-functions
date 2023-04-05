# llm-agents

TypeScript rewrite of [`llm_agents`, a Python library by Marc Päpper](https://github.com/mpaepper/llm_agents).

Caveat emptor: the JavaScript tool uses `eval`, so OpenAI has full control of your machine.

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

Example output:

```
You can use tools to get new information. Answer the question as best as you can using the following tools:

JavaScriptEvaluator: Works like eval() in JavaScript

Use the following format:

Question: the input question you must answer
Thought: comment on what you want to do next
Action: the action to take, exactly one element of [JavaScriptEvaluator]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation repeats N times, use it until you are sure of the answer)
Thought: I now know the final answer
Final Answer: your final answer to the original input question

Begin!

Question: What is the sine of 7 * 9?
Thought: I need to use the JavaScriptEvaluator to calculate the sine of 7 * 9.
Action: JavaScriptEvaluator
Action Input: Math.sin(7 * 9)
Observation: 0.16735570030280691
Thought:I need to round the result to the nearest hundredth.
Action: JavaScriptEvaluator
Action Input: Math.round(Math.sin(7 * 9) * 100) / 100
Observation: 0.17
Thought:The sine of 7 * 9 is approximately 0.17.
```