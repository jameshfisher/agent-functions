import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const llm = async (
  prompt: string,
  stop: string[] | undefined = undefined
): Promise<string> => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    messages: [{ role: "user", content: prompt }],
    stop: stop,
  });
  return response.data.choices[0].message!.content;
};
