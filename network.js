(function () {
    // ponytail: honor reduced-motion — skip the animated bg entirely.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    document.body.prepend(canvas);

    var ctx = canvas.getContext('2d');
    var GRID = 50;
    var CHARS = '01';
    var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    var COUNT = 45;

    var w, h, cols, rows, dpr;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(w / GRID) + 1;
        rows = Math.ceil(h / GRID) + 1;
    }

    resize();
    window.addEventListener('resize', resize);

    function makeParticle() {
        var d = DIRS[Math.floor(Math.random() * 4)];
        return {
            gx: Math.floor(Math.random() * (cols + 2)) - 1,
            gy: Math.floor(Math.random() * (rows + 2)) - 1,
            dx: d[0],
            dy: d[1],
            progress: Math.random(),
            speed: 0.002 + Math.random() * 0.005,
            ch: CHARS[Math.floor(Math.random() * CHARS.length)],
            base: 0.035 + Math.random() * 0.04,
            op: 0
        };
    }

    var particles = [];
    for (var i = 0; i < COUNT; i++) particles.push(makeParticle());

    function tick(p) {
        p.progress += p.speed;
        p.op += (p.base - p.op) * 0.08;

        if (p.progress >= 1) {
            p.gx += p.dx;
            p.gy += p.dy;
            p.progress -= 1;

            if (p.gx < -1) p.gx = cols;
            else if (p.gx > cols) p.gx = -1;
            if (p.gy < -1) p.gy = rows;
            else if (p.gy > rows) p.gy = -1;

            // Turn at intersection
            if (Math.random() < 0.3) {
                if (p.dx !== 0) {
                    p.dx = 0;
                    p.dy = Math.random() < 0.5 ? 1 : -1;
                } else {
                    p.dy = 0;
                    p.dx = Math.random() < 0.5 ? 1 : -1;
                }
                p.op = Math.min(p.base * 2.5, 0.12);
            }

            if (Math.random() < 0.12) {
                p.ch = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
        }
    }

    function frame() {
        ctx.clearRect(0, 0, w, h);
        ctx.font = '10px "SF Mono","Roboto Mono",Menlo,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            tick(p);
            var x = (p.gx + p.dx * p.progress) * GRID;
            var y = (p.gy + p.dy * p.progress) * GRID;
            ctx.fillStyle = 'rgba(255,255,255,' + p.op.toFixed(3) + ')';
            ctx.fillText(p.ch, x, y);
        }

        requestAnimationFrame(frame);
    }

    frame();
})();
