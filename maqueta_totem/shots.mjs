import { chromium } from 'playwright-core';
const times = process.argv.slice(2).map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8765/index.html');
await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
for (const t of times) {
  const s = Date.now(); await p.evaluate(t => window.renderAt(t), t);
  await p.screenshot({ path: `../shots/s_${t}.jpg`, type: 'jpeg', quality: 85 });
  console.log(t, Date.now() - s, 'ms');
}
await b.close();
