// ponytail: dev-only static server. Prod is GitHub Pages, not this.
// Resolves like Pages: /research -> research/index.html or research.html
const port = 3000;
Bun.serve({
  port,
  async fetch(req) {
    const pathname = new URL(req.url).pathname;
    const clean = pathname.replace(/\/+$/, "");
    const candidates = [
      "." + pathname,
      "." + clean + ".html",
      "." + clean + "/index.html",
    ];
    for (const p of candidates) {
      const f = Bun.file(p);
      if (await f.exists()) return new Response(f);
    }
    return new Response(Bun.file("./404.html"), { status: 404 });
  },
});
console.log(`serving on http://localhost:${port}`);
