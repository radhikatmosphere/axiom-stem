import { build } from "esbuild";
import { writeFileSync, mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";

const txt = readFileSync("lib/decomposers.ts", "utf8");
console.log("Has .sort():", txt.includes("Array.from(new Set([a1, a2])).sort()"));
console.log("GetGametes body:");
const m = txt.match(/function getGametes[\s\S]*?\n}/);
console.log(m?.[0]);

await build({
  entryPoints: ["lib/decomposers.ts"],
  bundle: true, format: "esm", platform: "node", target: "node18",
  outfile: "logs/d3.mjs", logLevel: "silent",
});
const d = await import("../logs/d3.mjs");
console.log("d3 result:", JSON.stringify(d.decomposeGenetics({parent1:"Aa", parent2:"Aa"})));
