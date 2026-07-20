import { build } from "esbuild";
import { writeFileSync, mkdirSync } from "node:fs";

await build({
  entryPoints: ["lib/decomposers.ts"],
  bundle: true, format: "esm", platform: "node", target: "node18",
  outfile: "logs/d2.mjs", logLevel: "silent",
});
const d = await import("../logs/d2.mjs");
console.log("direct Aa Aa:", JSON.stringify(d.decomposeGenetics({parent1:"Aa", parent2:"Aa"})));
console.log("direct Aa aa:", JSON.stringify(d.decomposeGenetics({parent1:"Aa", parent2:"aa"})));
console.log("direct bb Bb:", JSON.stringify(d.decomposeGenetics({parent1:"bb", parent2:"Bb"})));
