import { build } from "esbuild";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

const txt = readFileSync("lib/decomposers.ts", "utf8");
console.log("Set body contains 'A','a'?",
  txt.match(/parseGenotype[\s\S]*?getGametes[^}]*\}/)?.[0]);

console.log("Showing line numbers:");
const lines = txt.split("\n");
for (let i = 13; i < 30; i++) {
  console.log((i+1) + ": " + JSON.stringify(lines[i]));
}

await build({
  entryPoints: ["lib/decomposers.ts"],
  bundle: true, format: "esm", platform: "node", target: "node18",
  outfile: "logs/d4.mjs", logLevel: "silent",
});
const d = await import("../logs/d4.mjs");
console.log("d4 Aa Aa:", JSON.stringify(d.decomposeGenetics({parent1:"Aa", parent2:"Aa"})));
console.log("d4 Aa aa:", JSON.stringify(d.decomposeGenetics({parent1:"Aa", parent2:"aa"})));

// Inline test using just the pure logic
const a1 = "A", a2 = "a";
const s = Array.from(new Set([a1, a2]));
console.log("inline A,a ->", s);
