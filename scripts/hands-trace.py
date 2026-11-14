# Traces the two reaching hands out of the hero fresco (src/assets/art/hands.jpg) into line art the hero
# draws itself: each arm's outline (potrace on a skin mask), its interior lines (edges thinned to
# centre lines), and the shadow regions that get hatched. Output: src/data/hands-trace.json, in the
# fresco's pixel space (1533 x 863). Needs opencv-python-headless, scikit-image, numpy and potrace.
#   python3 scripts/hands-trace.py [--debug out.png]
import json, subprocess, sys, tempfile, os
import cv2
import numpy as np
from skimage.morphology import skeletonize

SRC = 'src/assets/art/hands.jpg'
OUT = 'src/data/hands-trace.json'
# Where each arm lives, as a polygon that keeps out Adam's knee and the figures around God.
ARMS = {
    'adam': [(0, 400), (180, 395), (420, 345), (560, 330), (700, 360), (790, 430), (760, 490), (650, 480), (470, 470), (330, 560), (120, 560), (0, 545)],
    'god': [(760, 425), (840, 395), (960, 380), (1150, 320), (1300, 270), (1400, 230), (1440, 330), (1300, 440), (1100, 465), (940, 470), (900, 540), (820, 530), (760, 450)],
}

img = cv2.imread(SRC)
H, W = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# Skin: warm hue and clearly more saturated than the lime plaster around it.
# Skin is warmer than the lime plaster: measured, skin sits at a* 127-138 / b* 142-159 and the plaster at
# a* 123-129 / b* 139-143, so redness plus yellowness separates them, shadowed fingers included.
warm = (lab[..., 1].astype(np.int16) - 128) + (lab[..., 2].astype(np.int16) - 140)
skin = (warm > 6) & (lab[..., 0] > 55) & (lab[..., 0] < 238)
skin = skin.astype(np.uint8) * 255

def poly_mask(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    return m

def potrace_path(mask, turd=40, alpha=1.0):
    """Mask (255 = inside) to SVG path data in image pixels, via potrace's GeoJSON polygons (y flipped)."""
    with tempfile.TemporaryDirectory() as d:
        pbm = os.path.join(d, 'm.pbm')
        cv2.imwrite(pbm, 255 - mask)  # potrace traces black
        gj = subprocess.run(['potrace', pbm, '-b', 'geojson', '-o', '-', '-t', str(turd), '-a', str(alpha), '-O', '0.8'], check=True, capture_output=True, text=True).stdout
    parts = []
    for f in json.loads(gj)['features']:
        for ringpts in f['geometry']['coordinates']:
            pts = ringpts[::2] if len(ringpts) > 40 else ringpts
            parts.append('M' + ' L'.join(f'{x:.1f} {H - y:.1f}' for x, y in pts) + 'Z')
    return ' '.join(parts)

def smooth_path(mask, sigma=3.0, min_area=120):
    """Outer and inner contours of a mask, smoothed along their length and written as cubic curves."""
    big = cv2.resize(mask, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    big = cv2.GaussianBlur(big, (0, 0), 2.2)
    _, big = cv2.threshold(big, 127, 255, cv2.THRESH_BINARY)
    cs, _ = cv2.findContours(big, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in cs:
        if cv2.contourArea(c) < min_area * 4: continue
        p = c.reshape(-1, 2).astype(np.float32) / 2
        k = int(sigma * 3) * 2 + 1
        ker = cv2.getGaussianKernel(k, sigma).ravel()
        pad = np.concatenate([p[-k:], p, p[:k]])
        sm = np.stack([np.convolve(pad[:, i], ker, 'same') for i in (0, 1)], 1)[k:-k]
        sm = cv2.approxPolyDP(sm.astype(np.float32).reshape(-1, 1, 2), 0.6, True).reshape(-1, 2)
        if len(sm) < 4: continue
        # Catmull-Rom through the points, as cubic Beziers
        n = len(sm); d = f'M{sm[0][0]:.1f} {sm[0][1]:.1f}'
        for i in range(n):
            p0, p1, p2, p3 = sm[i - 1], sm[i], sm[(i + 1) % n], sm[(i + 2) % n]
            c1 = p1 + (p2 - p0) / 6; c2 = p2 - (p3 - p1) / 6
            d += f' C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}'
        out.append(d + 'Z')
    return ' '.join(out)

def polylines(edge_mask, min_len=18):
    """Thin an edge mask to centre lines and walk each stroke into an ordered point list."""
    sk = skeletonize(edge_mask > 0)
    pts = set(zip(*np.nonzero(sk)))
    nbr = lambda p: [(p[0] + dy, p[1] + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (p[0] + dy, p[1] + dx) in pts]
    ends = [p for p in pts if len(nbr(p)) == 1]
    seen, lines = set(), []
    for start in ends + list(pts):
        if start in seen: continue
        line, cur = [start], start
        seen.add(start)
        while True:
            nx = [q for q in nbr(cur) if q not in seen]
            if not nx: break
            cur = nx[0]; seen.add(cur); line.append(cur)
        if len(line) >= min_len:
            arr = np.array([[x, y] for y, x in line], np.float32)
            if len(arr) > 7:
                ker = cv2.getGaussianKernel(7, 1.6).ravel()
                arr = np.stack([np.convolve(np.pad(arr[:, i], 3, mode='edge'), ker, 'valid') for i in (0, 1)], 1).astype(np.float32)
            arr = arr.reshape(-1, 1, 2)
            simp = cv2.approxPolyDP(arr, 1.2, False).reshape(-1, 2)
            lines.append([[round(float(x), 1), round(float(y), 1)] for x, y in simp])
    return lines

out = {'width': W, 'height': H, 'arms': {}}
debug = img.copy() // 2 + 100
for name, poly in ARMS.items():
    region = poly_mask(poly)
    m = cv2.bitwise_and(skin, region)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    # keep the arm itself: the largest connected piece
    n, lab_img, stats, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        m = np.where(lab_img == keep, 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    outline = smooth_path(m)
    # interior: the painter's own lines, edges a little inside the silhouette
    inner = cv2.erode(m, np.ones((11, 11), np.uint8))
    blur = cv2.GaussianBlur(gray, (5, 5), 1.2)
    edges = cv2.Canny(blur, 40, 110)
    edges = cv2.bitwise_and(edges, inner)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8))
    lines = polylines(edges)
    # shade: the darker half of the arm's own tones
    L = lab[..., 0].astype(np.float32)
    vals = L[m > 0]
    t = np.percentile(vals, 38)
    shade = ((L < t) & (inner > 0)).astype(np.uint8) * 255
    shade = cv2.morphologyEx(shade, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    shade = cv2.morphologyEx(shade, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    shade_d = smooth_path(shade, sigma=2.5, min_area=60)
    ys, xs = np.nonzero(m)
    out['arms'][name] = {'box': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())], 'outline': outline, 'lines': lines, 'shade': shade_d}
    debug[m > 0] = (debug[m > 0] * 0.6 + np.array([60, 90, 200]) * 0.4).astype(np.uint8)
    debug[shade > 0] = (debug[shade > 0] * 0.5 + np.array([40, 40, 40]) * 0.5).astype(np.uint8)
    for ln in lines:
        cv2.polylines(debug, [np.array(ln, np.int32)], False, (20, 20, 160), 1)
    cv2.polylines(debug, [np.array(poly, np.int32)], True, (0, 160, 0), 1)
    print(name, 'lines', len(lines), 'outline chars', len(outline), 'shade chars', len(shade_d))

json.dump(out, open(OUT, 'w'))
if '--debug' in sys.argv:
    cv2.imwrite(sys.argv[sys.argv.index('--debug') + 1], debug)
print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB')
