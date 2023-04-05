export type LLM = (prompt: string, stop?: string[]) => Promise<string>;

export type Tool = {
  name: string;
  description: string;
  use: (inputText: string) => Promise<string>;
};

export type Tools = Tool[];
