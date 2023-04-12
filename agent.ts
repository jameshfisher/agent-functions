import { VM } from "vm2";
import { GoogleSearchTool } from "./tools/google.js";
import { LLM } from "./types.js";

const PROMPT_TEMPLATE = ({
  notes,
}: {
  notes: unknown;
}) => `You are an assistant.
Your working memory is in a JS object called 'notes'.
Your job is to answer the question in notes.question,
and put the answer in notes.answer.
You work step-by-step by choosing JS actions from the following:

  notes[<string>] = <string>;
  notes[<string>] = await google(query: string);
  delete notes[<string>];

Here are some excellent examples.

notes = { "question": "What is 94-56?" };
notes.answer = 94-56; // Use JS to calculate this

notes = { "question": "How old was QEII's father when he died?" };
notes["plan"] = "Find QEII's father, then find his age at death"; // Multi-step question. Write down steps

notes = { "question": "How old is the world's most popular programming language?", "most popular programming language": "JavaScript" };
notes["javascript invention date"] = await google("When was JavaScript invented?"); // We've found the language, but need to find its age

notes = { "question": "How old was QEII's father when he died?", "plan": "Find QEII's father, then find his age at death" };
notes["qeii's father"] = await google("What was QEII's father's name?"); // Do first step of plan

notes = { "question": "How old is the world's most popular programming language?", "most popular programming language": "JavaScript", "javascript invention year": "1995", "current year": "2023" };
notes["answer"] = (2023 - 1995) + " years"; // Calculate from numbers in notes

notes = ${JSON.stringify(notes)};
`;

const MAX_LOOPS = 5;

export const runAgent = async ({
  question,
  llm,
}: {
  question: string;
  llm: LLM;
}): Promise<string> => {
  const vm = new VM({
    timeout: 5000,
    allowAsync: true,
    sandbox: {
      notes: { question },
      google: GoogleSearchTool.use,
    },
  });

  for (let numLoops = 0; numLoops < MAX_LOOPS; numLoops += 1) {
    const prompt = PROMPT_TEMPLATE({ notes: vm.sandbox.notes });
    const jsAction = await llm(prompt, [";"]);
    console.log({ jsAction });
    await vm.run(`(async () => {
      ${jsAction};
    })()`);
    console.log("notes after", vm.sandbox.notes);
    if (vm.sandbox.notes.answer) {
      console.log({ "FINAL ANSWER": vm.sandbox.notes.answer });
      return vm.sandbox.notes.answer;
    }
  }

  throw new Error(`Max loops reached: ${MAX_LOOPS}`);
};
