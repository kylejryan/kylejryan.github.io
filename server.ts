const port = Number(process.env.PORT ?? 3000);

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname.endsWith("/")) pathname += "index.html";
    if (!pathname.includes(".")) pathname += ".html";

    const file = Bun.file("." + pathname);
    if (await file.exists()) return new Response(file);

    const fallback = Bun.file("./index.html");
    return new Response(fallback, { status: 404 });
  },
});

console.log(`kryan.sh dev server → http://localhost:${server.port}`);
