import { GoogleSearchTool } from "../tools/google.js";
const res = await GoogleSearchTool.use("How to add number in Clojure?");
console.log(res);
