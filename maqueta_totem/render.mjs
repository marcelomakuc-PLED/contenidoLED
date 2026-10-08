import { chromium } from 'playwright-core';
import fs from 'fs';
const [wi, nw, fps, dur] = process.argv.slice(2).map(Number);
const exe = fs.readFileSync('shots.mjs','utf8').match(/executablePath: '([^']+)'/)[1];
const b = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
const N = Math.round(dur * fps);
for (let f = wi; f < N; f += nw) {
  const out = `../frames/f_${String(f).padStart(5,'0')}.jpg`;
  if (fs.existsSync(out)) continue;
  await p.evaluate(t => window.renderAt(t), f / fps);
  await p.screenshot({ path: out + '.tmp', type: 'jpeg', quality: 92 });
  fs.renameSync(out + '.tmp', out);
  if (f % 300 < nw) console.log('worker', wi, 'frame', f, '/', N, new Date().toISOString());
}
await b.close();
