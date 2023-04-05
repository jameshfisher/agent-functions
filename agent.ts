import { LLM, Tool, Tools } from "./types.js";

const FINAL_ANSWER_TOKEN = "Final Answer:";
const OBSERVATION_TOKEN = "Observation:";
const THOUGHT_TOKEN = "Thought:";

// So the LLM does not hallucinate until the end
const STOP_PATTERNS: string[] = [
  `\n${OBSERVATION_TOKEN}`,
  `\n\t${OBSERVATION_TOKEN}`,
];

const PROMPT_TEMPLATE = ({
  toolDescriptions,
  toolNames,
  question,
}: {
  toolDescriptions: string;
  toolNames: string;
  question: string;
}) => `You can use tools to get new information. Answer the question as best as you can using the following tools:

${toolDescriptions}

Use the following format:

Question: the input question you must answer
Thought: comment on what you want to do next
Action: the action to take, exactly one element of [${toolNames}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation repeats N times, use it until you are sure of the answer)
Thought: I now know the final answer
Final Answer: your final answer to the original input question

Begin!

Question: ${question}
Thought: `;

const MAX_LOOPS = 5;

const ACTION_REGEX = /Action: [\[]?(.*?)[\]]?\n*Action Input:[\s]*(.*)/;

const parse = (generated: string): [string, string] => {
  if (generated.includes(FINAL_ANSWER_TOKEN)) {
    return ["Final Answer", generated.split(FINAL_ANSWER_TOKEN).pop()!.trim()];
  }

  const match = generated.match(ACTION_REGEX);

  if (!match) {
    throw new Error(
      `Output of LLM is not parsable for next tool use: '${generated}'`
    );
  }

  const tool = match[1].trim();
  const toolInput = match[2].trim().replace(/^"|"$/g, "");

  return [tool, toolInput];
};

const toolDescriptions = (tools: Tools): string =>
  tools.map((tool) => `${tool.name}: ${tool.description}`).join("\n");

const toolNames = (tools: Tools): string =>
  tools.map((tool) => tool.name).join(",");

const buildToolsByName = (tools: Tools): Record<string, Tool> =>
  tools.reduce((acc, tool) => ({ ...acc, [tool.name]: tool }), {});

export const runAgent = async ({
  question,
  llm,
  tools,
}: {
  question: string;
  llm: LLM;
  tools: Tool[];
}): Promise<string> => {
  const toolsByName = buildToolsByName(tools);

  const previousResponses: string[] = [];
  const prompt = PROMPT_TEMPLATE({
    toolDescriptions: toolDescriptions(tools),
    toolNames: toolNames(tools),
    question: question,
  });

  process.stdout.write(prompt);

  for (let numLoops = 0; numLoops < MAX_LOOPS; numLoops += 1) {
    const generated = await llm(
      prompt + previousResponses.join("\n"),
      STOP_PATTERNS
    );
    const [toolName, toolInput] = parse(generated);
    if (toolName === "Final Answer") {
      return toolInput;
    }
    const tool = toolsByName[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    const toolResult = await tool.use(toolInput);
    const generatedPlus =
      generated + `\n${OBSERVATION_TOKEN} ${toolResult}\n${THOUGHT_TOKEN}`;
    process.stdout.write(generatedPlus);
    previousResponses.push(generatedPlus);
  }

  throw new Error(`Max loops reached: ${MAX_LOOPS}`);
};
