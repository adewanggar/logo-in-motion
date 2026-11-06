#!/usr/bin/env node
/**
 * Bumper QA — bundles the project ONCE and renders evidence frames.
 *
 *   node scripts/qa.mjs frames   --comp PopLockup-16x9 [--frames markers|0,12,40] [--props '{"outro":"fade"}'] [--scale 0.5]
 *   node scripts/qa.mjs contract --comp PopLockup-16x9            # Final Frame Contract: last frame ≡ LogoStill
 *   node scripts/qa.mjs all      [--aspect 16x9]                    # frames(markers) + contract for every bumper
 *
 * Output: out/qa/<comp>/fNNNN_<label>.png + frames.json. Tile them into a
 * labelled contact sheet with:  python <skill>/scripts/contact_sheet.py out/qa/<comp>
 */
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, getCompositions} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
if (!['frames', 'contract', 'all'].includes(cmd)) {
  console.log('usage: node scripts/qa.mjs frames|contract|all --comp <id> [--frames markers|a,b,c] [--props JSON] [--scale 0.5]');
  process.exit(1);
}

const root = process.cwd();
const entry = path.join(root, 'src', 'index.ts');
const extraProps = JSON.parse(opt('props', '{}'));
const scale = Number(opt('scale', '1'));

console.log('bundling…');
const serveUrl = await bundle({entryPoint: entry});

const outDir = (comp) => {
  const d = path.join(root, 'out', 'qa', comp);
  fs.mkdirSync(d, {recursive: true});
  return d;
};

const still = async (id, frame, props, file, s = scale) => {
  const composition = await selectComposition({serveUrl, id, inputProps: props});
  await renderStill({composition, serveUrl, frame, output: file, inputProps: props, imageFormat: 'png', scale: s, overwrite: true});
  return composition;
};

async function frames(comp) {
  const composition = await selectComposition({serveUrl, id: comp, inputProps: extraProps});
  const markers = composition.props._markers ?? {};
  const last = composition.durationInFrames - 1;
  const spec = opt('frames', 'markers');
  /** @type {Map<number,string>} */
  const list = new Map();
  if (spec === 'markers') {
    list.set(0, 'start');
    for (const [name, f] of Object.entries(markers)) {
      const fr = Math.min(last, Math.max(0, Math.round(f)));
      list.set(fr, name);
      // bracket every moment that is not a still frame: handoffs hide between beats
      if (!['holdStart', 'end'].includes(name)) {
        for (const d of [-2, 2]) {
          const g = fr + d;
          if (g >= 0 && g <= last && !list.has(g)) list.set(g, `${name}${d > 0 ? '+' : ''}${d}`);
        }
      }
    }
    list.set(last, 'end');
  } else {
    for (const f of spec.split(',').map(Number)) list.set(f, `f${f}`);
  }
  const dir = outDir(comp);
  const rows = [];
  for (const [f, label] of [...list.entries()].sort((a, b) => a[0] - b[0])) {
    const file = path.join(dir, `f${String(f).padStart(4, '0')}_${label.replace(/[^\w+-]/g, '')}.png`);
    await still(comp, f, extraProps, file);
    rows.push({frame: f, label, file: path.relative(root, file)});
    process.stdout.write(`  ${comp} f${f} ${label}\n`);
  }
  fs.writeFileSync(path.join(dir, 'frames.json'), JSON.stringify({comp, durationInFrames: composition.durationInFrames, fps: composition.fps, markers, frames: rows}, null, 2));
  return rows;
}

// --- minimal PNG decoder (8-bit RGB/RGBA, non-interlaced: what Chrome writes)
function decodePng(buf) {
  let pos = 8;
  let width = 0, height = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error('unsupported PNG (need 8-bit, non-interlaced)');
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : (() => { throw new Error(`PNG color type ${colorType} unsupported`); })();
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = v & 255;
    }
    for (let x = 0; x < width; x++) {
      out[(y * width + x) * 4] = line[x * bpp];
      out[(y * width + x) * 4 + 1] = line[x * bpp + 1];
      out[(y * width + x) * 4 + 2] = line[x * bpp + 2];
      out[(y * width + x) * 4 + 3] = bpp === 4 ? line[x * bpp + 3] : 255;
    }
    prev = line;
  }
  return {width, height, data: out};
}

async function contract(comp) {
  // Grain is per-frame noise, exclude it; everything else must match exactly.
  const props = {...extraProps, grain: false, outro: 'hold'};
  const aspect = comp.split('-').pop();
  const dir = outDir(comp);
  const composition = await selectComposition({serveUrl, id: comp, inputProps: props});
  const last = composition.durationInFrames - 1;
  const a = path.join(dir, 'contract_final.png');
  const b = path.join(dir, 'contract_still.png');
  await still(comp, last, props, a, 1);
  await still(`LogoStill-${aspect}`, 0, props, b, 1);
  const A = decodePng(fs.readFileSync(a));
  const B = decodePng(fs.readFileSync(b));
  let diffPx = 0, maxD = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
    if (d > 0) diffPx++;
    if (d > maxD) maxD = d;
  }
  const ok = diffPx === 0;
  console.log(`  contract ${comp}: last frame f${last} vs LogoStill-${aspect} → ${ok ? 'PASS (0 px differ)' : `FAIL (${diffPx} px differ, max Δ ${maxD})`}`);
  return ok;
}

if (cmd === 'frames') await frames(opt('comp'));
if (cmd === 'contract') {
  const ok = await contract(opt('comp'));
  process.exit(ok ? 0 : 2);
}
if (cmd === 'all') {
  const aspect = opt('aspect', '16x9');
  const comps = (await getCompositions(serveUrl, {inputProps: extraProps}))
    .map((c) => c.id)
    .filter((id) => id.endsWith(`-${aspect}`) && !id.startsWith('LogoStill'));
  let fails = 0;
  for (const c of comps) {
    await frames(c);
    if (!(await contract(c))) fails++;
  }
  console.log(fails ? `${fails} bumper(s) FAIL the Final Frame Contract` : 'all bumpers PASS the Final Frame Contract');
  process.exit(fails ? 2 : 0);
}
