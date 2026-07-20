import { build } from "esbuild";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const tmp = "logs/decomposers.bundled.mjs";
mkdirSync("logs", { recursive: true });
await build({
  entryPoints: ["lib/decomposers.ts"],
  bundle: true, format: "esm", platform: "node", target: "node18",
  outfile: tmp, logLevel: "silent",
});
const d = await import("../" + tmp);

console.log("=== Aa x aa ===");
console.log(JSON.stringify(d.decomposeGenetics({ parent1: "Aa", parent2: "aa" })));
console.log("=== Aa x Aa ===");
console.log(JSON.stringify(d.decomposeGenetics({ parent1: "Aa", parent2: "Aa" })));
console.log("=== bb x Bb ===");
console.log(JSON.stringify(d.decomposeGenetics({ parent1: "bb", parent2: "Bb" })));
console.log("=== Fe ===");
console.log(JSON.stringify(d.decomposeChemistry({ element: "Fe" })));
console.log("=== Na ===");
console.log(JSON.stringify(d.decomposeChemistry({ element: "Na" })));
console.log("=== Math 5c3 ===");
console.log(JSON.stringify(d.decomposeMath({ type: "combination", n: 5, r: 3, repetition: false })));
console.log("=== Physics 440 ===");
console.log(JSON.stringify(d.decomposePhysics({ fundamentalFrequency: 440, harmonics: 4 })));
