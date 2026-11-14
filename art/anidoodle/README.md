# Plate films (anidoodle)

Each drawn plate is an anidoodle film: a sheet that draws itself, stroke by stroke, then holds on the finished drawing.
The workspace lives outside this repo at `../aether-art` (scaffolded with the anidoodle plugin's `engine/tools/scaffold.mjs`); the piece sources are kept here.

To render a plate (Plate II shown):

```bash
cp art/anidoodle/plateSystem.ts ../aether-art/src/canvas-core/
cd ../aether-art
node tools/gate.mjs plateSystem      # must PASS
node tools/render.mjs plateSystem    # out/plateSystem.mp4
node tools/still.mjs plateSystem --frame 539 --out out/final.png
ffmpeg -i out/plateSystem.mp4 -an -vf scale=1120:-2 -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart ../aether/public/plates/films/system.mp4
```

Then save `out/final.png` as `src/assets/art/sheet-<name>.jpg` (1400 wide) and measure its spots in `src/data/drawings.ts` as u = x / W, v = y / H.
Blueprint for how the system is built (II, VIII, client plates); chalkboard for story and process plates (III, IV, V-VII, IX).
