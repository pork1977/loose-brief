import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { DEMO_BRIEF } from "../src/data/demo-brief";
import { littoralIntelligence } from "../src/data/demo-directions";
import { everythingZip } from "../src/lib/export/bundle";

// Writes the demo brand's full export to a folder, for checking it outside the app.
// Usage: npx tsx scripts/write-demo-export.tsx <folder>
const out = process.argv[2];
if (!out) throw new Error("Give a folder to write to.");

const files = unzipSync(everythingZip({ brandName: DEMO_BRIEF.name, direction: littoralIntelligence, brief: DEMO_BRIEF }));
for (const [name, data] of Object.entries(files)) {
  if (name.endsWith("/")) continue; // folder entries
  const path = join(out, name);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, data);
}
console.log(`Wrote ${Object.keys(files).length} files to ${out}`);
