/**
 * Records real AXIOM demo + sweet natural female voiceover + merges with ffmpeg
 * Output: submission/AXIOM_DEMO_VIDEO.mp4
 */
import { chromium } from "playwright";
import { execSync, spawnSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const OUT = join(ROOT, "submission");
const TMP = join(OUT, "demo-tmp");
const URL = process.env.DEMO_URL || "https://axiom-stem.pages.dev";
const VOICE = "en-US-JennyNeural";

mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const NARRATION = `Hi there! Welcome to AXIOM — where we compute first, and explain second.
Most AI tutors guess their way through STEM math. AXIOM never does. Let me show you the real app.

Here's a genetics cross: Aa times aa. I'll load the example and tap Decompose.
Layer One builds the exact Punnett grid — fifty percent Aa, fifty percent aa. Pure TypeScript. Zero guessing.

Now watch Layer Two. The narrative adapter weaves a story — a hook, an analogy, a question for you, and a tiny experiment to try at home.
It only receives the verified JSON. It never recalculates the math.

Combinatorics next — choose three from five. C of five comma three equals ten. Every step is laid out clearly.

Chemistry — iron's electron shells, Aufbau principle, orbital diagram. All exact.

Physics harmonics — four forty hertz, frequency, wavelength, musical notes. Beautiful structure.

You earn XP as you explore — levels, badges, and streaks. Sign in with Google or link your wallet on RadhikaChain.

AXIOM. Compute first. Explain second.
Live at axiom-stem dot pages dot dev.
GitHub: radhikatmosphere slash axiom-stem.
Built for D S H Hacks. Thank you so much for watching!`;

function probeDuration(file) {
  return parseFloat(
    execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`).toString().trim()
  );
}

async function generateVoiceover() {
  const py = join(TMP, "tts.py");
  const mp3 = join(TMP, "voiceover.mp3");
  writeFileSync(join(TMP, "narration.txt"), NARRATION);
  writeFileSync(
    py,
    `import asyncio, edge_tts
TEXT = open("${join(TMP, "narration.txt")}", encoding="utf-8").read()
async def main():
    comm = edge_tts.Communicate(TEXT, "${VOICE}", rate="-8%", pitch="+1Hz")
    await comm.save("${mp3}")
asyncio.run(main())
print("saved ${mp3}")
`
  );
  const pylibs = join(TMP, "pylibs");
  if (!existsSync(join(pylibs, "edge_tts"))) {
    console.log("→ Installing edge-tts (one-time)...");
    spawnSync("pip3", ["install", "-q", "--target", pylibs, "edge-tts"], {
      stdio: "inherit",
      env: { ...process.env, PYTHONPATH: pylibs },
    });
  }
  console.log(`→ Generating voiceover (${VOICE}, warm & natural)...`);
  const r = spawnSync("python3", [py], {
    stdio: "inherit",
    env: { ...process.env, PYTHONPATH: pylibs },
  });
  if (r.status !== 0) throw new Error("TTS failed");
  const dur = probeDuration(mp3);
  console.log(`  Voiceover ready: ${Math.round(dur)}s`);
  return mp3;
}

async function waitForNarrative(page, timeout = 25000) {
  await page
    .waitForFunction(
      () => {
        const cards = document.querySelectorAll(".axiom-card");
        for (const card of cards) {
          const t = card.textContent || "";
          if (t.includes("Layer 2") && t.includes("via ") && !t.includes("Decompose a problem above")) {
            return true;
          }
        }
        return false;
      },
      { timeout }
    )
    .catch(() => console.warn("  (narrative timeout — continuing)"));
}

async function decomposeDomain(page, label, waitMs = 5000) {
  await page.getByRole("button", { name: new RegExp(label, "i") }).first().click();
  await page.waitForTimeout(700);
  if (label === "Genetics") {
    await page.getByText("Load example").click();
    await page.waitForTimeout(500);
  }
  await page.getByRole("button", { name: /Decompose/i }).click();
  await waitForNarrative(page);
  await page.waitForTimeout(waitMs);
}

async function recordScreen(targetSeconds) {
  console.log("→ Launching browser demo at", URL);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: TMP, size: { width: 1280, height: 720 } },
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2500);

  await decomposeDomain(page, "Genetics", 5500);
  await page.evaluate(() => window.scrollTo({ top: 320, behavior: "smooth" }));
  await page.waitForTimeout(1200);

  await decomposeDomain(page, "Combinatorics", 4500);
  await decomposeDomain(page, "Chemistry", 4500);
  await decomposeDomain(page, "Harmonics", 4500);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(800);
  await page.getByText("Your Progress").scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(1500);

  const elapsed = 25;
  const pad = Math.max(2, targetSeconds - elapsed);
  await page.waitForTimeout(pad * 1000);

  const video = page.video();
  await context.close();
  await browser.close();
  const webm = await video.path();
  const mp4 = join(TMP, "screen.mp4");
  console.log("→ Converting webm → mp4...");
  execSync(`ffmpeg -y -i "${webm}" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p "${mp4}"`, {
    stdio: "inherit",
  });
  console.log(`  Screen capture: ${Math.round(probeDuration(mp4))}s`);
  return mp4;
}

function merge(videoPath, audioPath) {
  const padded = join(TMP, "screen-padded.mp4");
  const audioDur = probeDuration(audioPath);
  const videoDur = probeDuration(videoPath);

  if (videoDur < audioDur - 0.5) {
    const pad = audioDur - videoDur + 0.3;
    console.log(`→ Padding video by ${pad.toFixed(1)}s to match voiceover...`);
    execSync(
      `ffmpeg -y -i "${videoPath}" -vf "tpad=stop_mode=clone:stop_duration=${pad}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p "${padded}"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(`cp "${videoPath}" "${padded}"`);
  }

  const out = join(OUT, "AXIOM_DEMO_VIDEO.mp4");
  console.log("→ Merging video + voiceover...");
  execSync(
    `ffmpeg -y -i "${padded}" -i "${audioPath}" -c:v libx264 -c:a aac -b:a 192k -shortest -map 0:v:0 -map 1:a:0 "${out}"`,
    { stdio: "inherit" }
  );
  const dur = probeDuration(out);
  console.log(`✓ Demo video: ${out} (${Math.round(dur)}s)`);
  return out;
}

async function main() {
  const audioPath = await generateVoiceover();
  const audioDur = probeDuration(audioPath);
  const videoPath = await recordScreen(audioDur);
  merge(videoPath, audioPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});