import { getJson } from "serpapi";
import { Tool } from "../types.js";

export const GoogleSearchTool: Tool = {
  name: "GoogleSearch",
  description:
    "Get specific information from a search query. Input should be a question like 'How to add number in Clojure?'. Result will be the answer to the question.",
  use: async (query: string): Promise<string> => {
    const res = await getJson("google", {
      google_domain: "google.com",
      gl: "us",
      hl: "en",
      q: query,
      api_key: process.env.SERPAPI_API_KEY as string,
    });

    let returnVal: string;
    if (res.answer_box?.population) {
      returnVal = res.answer_box.population;
    } else if (res.answer_box?.answer) {
      returnVal = res.answer_box.answer;
    } else if (res.answer_box?.snippet) {
      returnVal = res.answer_box.snippet;
    } else if (res.answer_box?.snippet_highlighted_words) {
      returnVal = res.answer_box.snippet_highlighted_words[0];
    } else if (res.sports_results?.game_spotlight) {
      returnVal = res.sports_results.game_spotlight;
    } else if (res.knowledge_graph?.description) {
      returnVal = res.knowledge_graph.description;
    } else if (res.organic_results[0]?.snippet) {
      returnVal = res.organic_results[0].snippet;
    } else {
      returnVal = "No good search result found";
    }
    return returnVal;
  },
};
