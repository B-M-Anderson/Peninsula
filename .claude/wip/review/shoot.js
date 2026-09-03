const { chromium } = require('playwright');
const fs = require('fs');
const base = process.env.BASE || 'http://localhost:3100';
const out = process.env.OUT || '/tmp/claude-0/-home-user-Peninsula/f0391d7c-7cfd-597d-8a8c-563938fbd93b/scratchpad/shots-before';
fs.mkdirSync(out, { recursive: true });
const pages = ['/', '/projects', '/ask', '/contact', '/darkroom', '/vault', '/nope-404'];
const views = [{ name: 'mobile', w: 375, h: 812, mobile: true }, { name: 'desktop', w: 1366, h: 850 }];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const report = [];
  for (const v of views) {
    for (const scheme of ['dark', 'light']) {
      const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, isMobile: !!v.mobile, deviceScaleFactor: 1, colorScheme: scheme });
      for (const p of pages) {
        const page = await ctx.newPage();
        const errors = [];
        page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
        page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 300)}`));
        const resp = await page.goto(base + p, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => { errors.push('nav: ' + e.message); return null; });
        await page.waitForTimeout(600);
        const info = await page.evaluate(() => ({
          title: document.title,
          h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
          mains: document.querySelectorAll('main').length,
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          bodyH: document.body.scrollHeight,
          desc: document.querySelector('meta[name=description]')?.content,
          og: document.querySelector('meta[property="og:title"]')?.content,
        }));
        const name = `${v.name}-${scheme}${p === '/' ? '-home' : p.replace(/\//g, '-')}`;
        await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
        report.push({ page: p, view: v.name, scheme, status: resp && resp.status(), ...info, errors });
        await page.close();
      }
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  for (const r of report) console.log(`${r.view}/${r.scheme} ${r.page} -> ${r.status} title="${r.title}" h1=${JSON.stringify(r.h1)} mains=${r.mains} hscroll=${r.scrollW > r.innerW ? 'YES ' + r.scrollW : 'no'} errs=${r.errors.length}${r.errors.length ? ' ' + JSON.stringify(r.errors.slice(0, 3)) : ''}`);
})();
