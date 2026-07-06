// ponytail: dev-only static server. Prod is GitHub Pages, not this.
const port = 3000;
Bun.serve({
  port,
  fetch(req) {
    let path = new URL(req.url).pathname;
    if (path === "/") path = "/index.html";
    return new Response(Bun.file("." + path));
  },
});
console.log(`serving on http://localhost:${port}`);
