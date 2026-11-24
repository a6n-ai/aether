# Leonardo, "A study of a woman's hands" (c.1490, Royal Collection RCIN 912558, public domain via Wikimedia Commons)
# -> stroke points for the closing section. Local darkness (blur minus pixel) picks out silverpoint lines from toned paper.
# usage: python3 leo-strokes.py <source.jpg> <out.png> [crop W:H:X:Y] [width]   (R = ink strength, G = reveal time 1..255)
# then:  cwebp -lossless -z 9 -exact <out.png> -o public/art/leo-hands.webp   (lossless: the channels are data)
import sys, subprocess, random
src, out_json = sys.argv[1:3]
# optional: crop as W:H:X:Y of the source, and output width (height follows the crop's ratio)
CROP = sys.argv[3] if len(sys.argv) > 3 else '1230:1780:115:90'
cw, ch = (int(v) for v in CROP.split(':')[:2])
W = int(sys.argv[4]) if len(sys.argv) > 4 else 1100
H = round(W * ch / cw)
HANDS = len(sys.argv) <= 3   # the default crop is the hands study, which has a collector's stamp to skip
g = subprocess.run(['ffmpeg','-loglevel','error','-i',src,'-vf',f'crop={CROP},scale={W}:{H},format=gray','-f','rawvideo','-pix_fmt','gray','-'], capture_output=True, check=True).stdout
I = [[0]*(W+1) for _ in range(H+1)]
for y in range(H):
    row = 0
    for x in range(W):
        row += g[y*W+x]; I[y+1][x+1] = I[y][x+1] + row
def mean(x, y, r):
    x0, y0, x1, y1 = max(0,x-r), max(0,y-r), min(W,x+r+1), min(H,y+r+1)
    return (I[y1][x1]-I[y0][x1]-I[y1][x0]+I[y0][x0]) / ((x1-x0)*(y1-y0))
dark = bytearray(W*H)
for y in range(H):
    for x in range(W):
        if (HANDS and x > W * .903 and y > H * .921) or y < 18 or x < 12 or x > W - 12 or y > H - 12: continue   # hands study: collector's stamp; all: mount edges
        v = mean(x, y, 1)             # 3x3 average: paper grain averages out, strokes don't
        line = mean(x, y, 6) - v      # fine silverpoint strokes
        shade = mean(x, y, 24) - mean(x, y, 3)   # Leonardo's soft modelling, kept as a light wash
        a = max((line - 6) / 20, (shade - 10) / 40 * .5)
        if a > 0: dark[y*W+x] = min(255, int(a * 255))
# drop paper-grain speckle: keep a pixel only if 2+ of its 8 neighbours are ink too
ink = bytearray(W*H)
for y in range(1, H-1):
    for x in range(1, W-1):
        if dark[y*W+x] and sum(1 for dy in (-1,0,1) for dx in (-1,0,1) if (dx or dy) and dark[(y+dy)*W+x+dx]) >= 3: ink[y*W+x] = dark[y*W+x] & 0xF0 | 0x08   # 16 ink levels compress well
# reveal time: top to bottom, bent by smooth noise so whole strokes appear together
random.seed(3); C = 52
cells = [[random.random() for _ in range(W//C+2)] for _ in range(H//C+2)]
def noise(x, y):
    cx, cy = x / C, y / C; ix, iy = int(cx), int(cy); fx, fy = cx-ix, cy-iy
    a = cells[iy][ix]*(1-fx) + cells[iy][ix+1]*fx; b = cells[iy+1][ix]*(1-fx) + cells[iy+1][ix+1]*fx
    return a*(1-fy) + b*fy
rgb = bytearray(W*H*3); n = 0
for y in range(H):
    for x in range(W):
        a = ink[y*W+x]
        if not a: continue
        n += 1; i = (y*W+x)*3
        rgb[i] = a; rgb[i+1] = max(4, min(252, int((.62 * y / H + .38 * noise(x, y)) * 63)) * 4)   # 64 reveal steps
subprocess.run(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-i','-','-compression_level','9',out_json], input=bytes(rgb), check=True)
print(n, 'ink px')
