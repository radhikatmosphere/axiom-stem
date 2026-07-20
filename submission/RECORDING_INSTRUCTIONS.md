# AXIOM — Demo recording instructions

This produces the 60–90 second Devpost demo video. Total setup time: ~20 minutes. Recording time per take: ~3 minutes.

---

## 1. Hardware

| Item | Recommended | Minimum |
|---|---|---|
| Display | 1920×1080, scaled 100% | 1280×720 |
| Microphone | USB condenser (Blue Yeti, Rode NT-USB) | Laptop built-in mic |
| Headphones | Closed-back, to avoid bleed | Any |
| Camera (optional) | 720p webcam for a picture-in-box intro | Not required |

Record in a quiet room with soft surfaces (curtains, rug) to reduce echo. Keep the mic ~15 cm from your mouth, off-axis to reduce plosives.

## 2. Software

- **macOS:** OBS Studio 30+ (free) or ScreenStudio (paid, auto-zoom).
- **Windows:** OBS Studio 30+.
- **Linux:** OBS Studio 30+ with PipeWire.
- **Audio post (optional):** Audacity or Descript — normalize to -16 LUFS, gentle noise gate, light de-esser.

### OBS scene set-up
1. Add a **Display Capture** source on the primary monitor.
2. Add an **Audio Input Capture** source for the mic. Set it to mono.
3. **Settings → Output → Recording**: Format `mkv`, Encoder `NVENC`/`Apple VT`/`x264`, Rate Control `CRF 18`, Keyframe `2 s`.
4. **Settings → Video**: Base 1920×1080, Output 1920×1080, 30 fps (24 fps is also fine for a screencast).
5. **Settings → Audio**: Sample rate 48 kHz.

### Capture format
- H.264 in `.mkv` (OBS), remux to `.mp4` with `ffmpeg -i input.mkv -c copy axiom_demo.mp4`.
- Audio: AAC 192 kbps stereo.

## 3. Environment preparation (do this before each take)

1. Close Slack, Discord, email, and any other notification sources. Enable OS "Do Not Disturb".
2. Hide desktop icons and set a neutral wallpaper.
3. Use a fresh browser profile (no extensions, no bookmarks bar). Chrome or Firefox both work.
4. Zoom to 110% so text is crisp on the video (`Cmd/Ctrl + +`).
5. Disable smooth scrolling and the URL-bar hover suggestions if they distract.
6. Run the app with **no OpenAI key** for the fallback take, and **with an OpenAI key** for the live-narrative take. You will splice them in editing or do two separate takes.

### Local run
```bash
cp .env.example .env.local      # leave OPENAI_API_KEY empty for the fallback take
npm install
npm run dev
# open http://localhost:3000
```

For the live-OpenAI take, fill `.env.local` with a real key and model ID (`gpt-4o-mini` is fine to keep cost and latency down). Do not commit `.env.local`.

## 4. Demo flow (single take, ~90 seconds)

Follow `submission/VOICEOVER_ENGLISH.md` exactly. Screen actions per block:

| Block | Seconds | Screen action |
|---|---|---|
| Promise | 0–10 | Stay on `/` landing. Pointer idle. |
| Compute | 10–30 | Click **Genetics**, type `Aa` / `aa`, click **Compute deterministically**. Highlight the 2×2 grid and the 50/50 chips. |
| Inspect | 30–45 | Open the **Evidence ledger** `<details>`. Cursor over `genetics.probability.Aa`. |
| Explain | 45–65 | Set **High school** + **English**. Click **Generate explanation**. |
| Verify | 65–75 | Highlight the green **Verified** badge and the citation chips. |
| Chat | 75–85 | In the same browser, navigate to `/chat`. Type `Aa × aa`. Send. Show the same badge appears in the chat bubble. |
| Fallback + close | 85–90 | If this is the fallback take, point to the "Deterministic fallback" footer line. Finish on the close tagline. |

### Optional second take (live OpenAI)
Same flow but with `OPENAI_API_KEY` set, so the badge says **Verified** and the footer says "OpenAI-generated narrative." Record this so judges see the AI narration is real, not stubbed.

## 5. Take list and selection

Record at least three takes. Pick the cleanest one; do not splice mid-sentence.

| Take | Mic | Notes | Use |
|---|---|---|---|
| 1 | Scratch | Walk-through only, no audio | Reference |
| 2 | Voice | Full script | Main candidate |
| 3 | Voice | Full script | Backup if #2 stumbles |
| 4 (optional) | Voice | Fallback-only take, no API key | Splice into #2 if you want both modes shown |

## 6. Audio only (voiceover track, if recording narration separately)

If you prefer to record voice over a muted screen-capture:

```bash
# Audacity CLI or ffmpeg
ffmpeg -f alsa -i default -ar 48000 -ac 1 -c:a pcm_s16le axiom_vo.wav
```
Then:
- Normalize to -16 LUFS: `ffmpeg -i axiom_vo.wav -af loudnorm=I=-16:TP=-1.5 axiom_vo_norm.wav`
- Light noise reduction in Audacity (Noise Reduction, default settings, **max 12 dB** to avoid artifacts).
- De-ess if needed.
- Export as 48 kHz 24-bit WAV.

## 7. Final export

- Container: `.mp4` (H.264 + AAC).
- Resolution: 1920×1080.
- Duration: between 60 and 90 seconds.
- Audio: 48 kHz, 192 kbps, mono.
- Loudness: -16 LUFS integrated, true peak ≤ -1.5 dB.
- File name: `AXIOM_demo_<your-name>.mp4`.

### One-line ffmpeg remux + normalize
```bash
ffmpeg -i input.mkv -i axiom_vo_norm.wav \
  -map 0:v -map 1:a \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k -ar 48000 -ac 1 \
  -af loudnorm=I=-16:TP=-1.5 \
  -movflags +faststart \
  AXIOM_demo.mp4
```

## 8. Upload checklist

- [ ] Duration 60–90 s
- [ ] 1920×1080, H.264 / AAC
- [ ] -16 LUFS
- [ ] No secrets on screen (no `.env.local` content, no terminal with keys)
- [ ] No faux loading screens; if the OpenAI call takes >3 s, show the spinner honestly
- [ ] The **Verified** badge and the **Deterministic fallback** indicator are both visible at some point
- [ ] Citations are clickable in at least one shot (cursor hovers or clicks a chip)
- [ ] File name ends in `.mp4` and is under Devpost's size limit (500 MB)
