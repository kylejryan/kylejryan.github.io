/* ═══════════════════════════════════════════════════════════
 * POST-TRAINING FIELD GUIDE — interactivity + animation
 *
 * ANIMATION STORYBOARD
 * ─────────────────────────────────────────────────────────
 *    0ms   page loads, KaTeX renders in place
 *    0ms   reading-progress bar hooks to scroll
 *    0ms   scroll-spy marks active chapter in TOC
 *  100ms   sliding TOC marker animates to active item
 *  any     chapter enters viewport → fade+rise
 *  any     pipeline steps stagger 150ms within a chapter
 *  any     loss-landscape RAF loop, spring on reset
 *  any     lora-grid canvas redraws on rank change
 *  any     grpo bars spring into position from μ
 * ─────────────────────────────────────────────────────────
 * ═══════════════════════════════════════════════════════════ */

(() => {
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

    // ─────────── 1. KaTeX render all math nodes ───────────
    function renderMath() {
        if (typeof katex === "undefined") {
            // katex script is `defer`ed; retry shortly
            return setTimeout(renderMath, 60);
        }
        document.querySelectorAll(".pt-math[data-tex]").forEach(el => {
            try {
                katex.render(el.dataset.tex, el, { displayMode: true, throwOnError: false, strict: "ignore" });
            } catch (e) { el.textContent = el.dataset.tex; }
        });
        document.querySelectorAll(".pt-math-inline[data-tex]").forEach(el => {
            try {
                katex.render(el.dataset.tex, el, { displayMode: false, throwOnError: false, strict: "ignore" });
            } catch (e) { el.textContent = el.dataset.tex; }
        });
    }

    // ─────────── 2. reading-progress bar ───────────
    const progressBar = document.querySelector(".pt-progress span");
    function updateProgress() {
        const doc = document.documentElement;
        const top = window.scrollY;
        const max = doc.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(100, (top / max) * 100) : 0;
        if (progressBar) progressBar.style.width = pct.toFixed(2) + "%";
    }

    // ─────────── 3. scroll-spy TOC + sliding marker ───────────
    const tocLinks = [...document.querySelectorAll(".pt-toc-list a[data-toc]")];
    const tocMarker = document.querySelector(".pt-toc-marker");
    const chapters = [...document.querySelectorAll(".pt-chapter[id]")];
    let activeId = null;

    function setActive(id) {
        if (id === activeId) return;
        activeId = id;
        tocLinks.forEach(a => a.classList.toggle("is-active", a.dataset.toc === id));
        if (tocMarker) {
            const active = tocLinks.find(a => a.dataset.toc === id);
            if (active) {
                const rect = active.getBoundingClientRect();
                const parent = active.closest(".pt-toc-list").getBoundingClientRect();
                tocMarker.style.transform = `translateY(${rect.top - parent.top}px)`;
                tocMarker.style.height = rect.height + "px";
                tocMarker.classList.add("is-visible");
            }
        }
    }

    const observer = new IntersectionObserver((entries) => {
        // pick the entry nearest the top of the viewport that is intersecting
        const visible = entries.filter(e => e.isIntersecting);
        if (!visible.length) return;
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActive(visible[0].target.id);
    }, { rootMargin: "-10% 0px -70% 0px", threshold: [0, 0.1, 0.25, 0.5] });

    chapters.forEach(ch => observer.observe(ch));

    // chapter fade-in on enter
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add("is-visible");
                revealObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.08 });
    chapters.forEach(ch => revealObserver.observe(ch));

    window.addEventListener("scroll", () => {
        updateProgress();
    }, { passive: true });
    window.addEventListener("resize", () => {
        // reposition marker on resize
        if (activeId) { const id = activeId; activeId = null; setActive(id); }
    });

    // ─────────── 4. LOSS LANDSCAPE demo ───────────
    /* ANIMATION STORYBOARD — loss landscape
     *    0ms   ball spawns at (x0, y0)
     *  every   ball reads local gradient, applies velocity with momentum
     *          pos update with easing, trail fades
     *  reset   ball springs back to initial; path clears
     */
    function initLossLandscape() {
        const demo = document.querySelector('.pt-demo[data-demo="loss-landscape"]');
        if (!demo) return;
        const canvas = demo.querySelector("canvas");
        const ctx = canvas.getContext("2d");
        const lrInput = demo.querySelector('[data-ctrl="lr"]');
        const lrVal = demo.querySelector('[data-val="lr"]');
        const resetBtn = demo.querySelector('[data-act="reset"]');
        const rndBtn = demo.querySelector('[data-act="randomize"]');

        const state = {
            lr: Number(lrInput.value),
            ballX: -1.8,
            ballY: 0,
            vx: 0,
            vy: 0,
            targetX: -1.8,
            trail: [],
            width: 0,
            height: 0,
            dpr: 1,
            running: true,
            resetAnim: 0,
        };

        function setInit(x) {
            state.ballX = x;
            state.vx = 0; state.vy = 0;
            state.trail = [];
            state.resetAnim = 1;
        }

        // Loss landscape: a nonconvex 1-D function with a smooth curve
        // f(x) = 0.5 x^2 + 0.6 sin(1.8 x) + 0.25 cos(3.2 x) — several minima
        function lossFn(x) {
            return 0.5 * x * x + 0.6 * Math.sin(1.8 * x) + 0.25 * Math.cos(3.2 * x) + 1.1;
        }
        function gradFn(x) {
            return x + 0.6 * 1.8 * Math.cos(1.8 * x) - 0.25 * 3.2 * Math.sin(3.2 * x);
        }

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            state.width = rect.width;
            state.height = rect.height;
            state.dpr = dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        const PAD = 40;
        const X_MIN = -3.2, X_MAX = 3.2;
        function xToPx(x) { return PAD + (x - X_MIN) / (X_MAX - X_MIN) * (state.width - PAD * 2); }
        function yToPx(y) {
            // loss range ~0 .. ~6
            const Y_MAX = 6.0;
            return state.height - PAD - (y / Y_MAX) * (state.height - PAD * 2);
        }

        function drawLandscape() {
            ctx.clearRect(0, 0, state.width, state.height);

            // grid
            ctx.strokeStyle = "rgba(255,255,255,0.04)";
            ctx.lineWidth = 1;
            for (let gx = -3; gx <= 3; gx++) {
                ctx.beginPath();
                ctx.moveTo(xToPx(gx), PAD);
                ctx.lineTo(xToPx(gx), state.height - PAD);
                ctx.stroke();
            }
            for (let gy = 0; gy <= 6; gy++) {
                ctx.beginPath();
                ctx.moveTo(PAD, yToPx(gy));
                ctx.lineTo(state.width - PAD, yToPx(gy));
                ctx.stroke();
            }

            // axes
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(PAD, state.height - PAD);
            ctx.lineTo(state.width - PAD, state.height - PAD);
            ctx.moveTo(PAD, PAD);
            ctx.lineTo(PAD, state.height - PAD);
            ctx.stroke();

            // axis labels
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.font = '10px "Commit Mono", "SF Mono", monospace';
            ctx.fillText("θ", state.width - PAD + 6, state.height - PAD + 4);
            ctx.fillText("L(θ)", PAD - 28, PAD - 4);

            // loss curve
            ctx.strokeStyle = "rgba(255,255,255,0.6)";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            const steps = 240;
            for (let i = 0; i <= steps; i++) {
                const x = X_MIN + (i / steps) * (X_MAX - X_MIN);
                const y = lossFn(x);
                const px = xToPx(x), py = yToPx(y);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // optional soft fill under curve
            ctx.lineTo(xToPx(X_MAX), state.height - PAD);
            ctx.lineTo(xToPx(X_MIN), state.height - PAD);
            ctx.closePath();
            ctx.fillStyle = "rgba(142, 255, 173, 0.035)";
            ctx.fill();

            // trail
            ctx.strokeStyle = "rgba(142, 255, 173, 0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < state.trail.length; i++) {
                const p = state.trail[i];
                const px = xToPx(p.x), py = yToPx(p.y);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // ball
            const bx = xToPx(state.ballX);
            const by = yToPx(lossFn(state.ballX));
            ctx.fillStyle = "rgba(142, 255, 173, 1)";
            ctx.shadowColor = "rgba(142, 255, 173, 0.8)";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // loss readout
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.font = '11px "Commit Mono", "SF Mono", monospace';
            const L = lossFn(state.ballX).toFixed(3);
            const G = gradFn(state.ballX).toFixed(3);
            ctx.fillText(`θ = ${state.ballX.toFixed(2)}   L = ${L}   ∇L = ${G}`, state.width - PAD - 260, PAD - 12);
        }

        function step() {
            // gradient descent with tiny momentum so motion looks natural
            const g = gradFn(state.ballX);
            state.vx = state.vx * 0.55 - state.lr * g;
            state.ballX += state.vx;
            // clamp
            if (state.ballX < X_MIN) { state.ballX = X_MIN; state.vx *= -0.4; }
            if (state.ballX > X_MAX) { state.ballX = X_MAX; state.vx *= -0.4; }
            state.trail.push({ x: state.ballX, y: lossFn(state.ballX) });
            if (state.trail.length > 140) state.trail.shift();
        }

        function loop() {
            if (!prefersReduce) step();
            drawLandscape();
            requestAnimationFrame(loop);
        }

        lrInput.addEventListener("input", () => {
            state.lr = Number(lrInput.value);
            lrVal.textContent = state.lr.toFixed(3);
        });
        resetBtn.addEventListener("click", () => setInit(-1.8));
        rndBtn.addEventListener("click", () => setInit(X_MIN + Math.random() * (X_MAX - X_MIN)));

        new ResizeObserver(resize).observe(canvas);
        resize();
        loop();
    }

    // ─────────── 5. LORA demo ───────────
    /* Draws three matrices: full ΔW (d×k), B (d×r), A (r×k).
     * Each cell is a small square. Total params animate.
     */
    function initLora() {
        const demo = document.querySelector('.pt-demo[data-demo="lora"]');
        if (!demo) return;
        const rankInput = demo.querySelector('[data-ctrl="rank"]');
        const rankVal = demo.querySelector('[data-val="rank"]');
        const fullVal = demo.querySelector('[data-val="lora-full"]');
        const bVal = demo.querySelector('[data-val="lora-b"]');
        const aVal = demo.querySelector('[data-val="lora-a"]');
        const ratioVal = demo.querySelector('[data-val="lora-ratio"]');
        const grids = demo.querySelectorAll(".pt-lora-grid");

        // we "pretend" this is a 4096 × 4096 layer, drawn at 64×64 for display
        const D = 64, K = 64;

        grids.forEach(g => {
            const canvas = document.createElement("canvas");
            g.appendChild(canvas);
            g._ctx = canvas.getContext("2d");
            g._canvas = canvas;
        });

        function resizeGrids() {
            grids.forEach(g => {
                const rect = g.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                g._canvas.width = rect.width * dpr;
                g._canvas.height = rect.height * dpr;
                g._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            });
            render();
        }

        function drawGrid(g, cols, rows, color, fillProb = 1) {
            const ctx = g._ctx;
            const rect = g._canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);
            const cellW = rect.width / cols;
            const cellH = rect.height / rows;
            const size = Math.max(1, Math.min(cellW, cellH) - 0.8);
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const px = x * cellW + (cellW - size) / 2;
                    const py = y * cellH + (cellH - size) / 2;
                    const a = fillProb >= 1 ? 0.32 : (Math.random() < fillProb ? 0.55 : 0.08);
                    ctx.fillStyle = color.replace(")", `,${a})`).replace("rgb", "rgba");
                    ctx.fillRect(px, py, size, size);
                }
            }
        }

        function render() {
            const r = Number(rankInput.value);
            const full = D * K;
            const lora = D * r + r * K;
            const ratio = (full / lora).toFixed(1);
            rankVal.textContent = r;
            fullVal.textContent = (4096 * 4096).toLocaleString();
            bVal.textContent = (4096 * r).toLocaleString();
            aVal.textContent = (r * 4096).toLocaleString();
            ratioVal.textContent = `${(full / lora).toFixed(1)}×`;

            // draw the three matrices
            const [gFull, gB, gA] = grids;
            drawGrid(gFull, K, D, "rgb(255,255,255)");
            // B is D × r — draw as thin tall strip; map r display cells
            const bCols = Math.max(1, Math.round((r / 128) * 32)); // 32 cols max display
            drawGrid(gB, bCols, D, "rgb(142,255,173)");
            const aRows = Math.max(1, Math.round((r / 128) * 32));
            drawGrid(gA, K, aRows, "rgb(142,255,173)");
        }

        rankInput.addEventListener("input", render);
        new ResizeObserver(resizeGrids).observe(grids[0]);
        resizeGrids();
    }

    // ─────────── 6. RLHF stepper ───────────
    function initStepper() {
        const demo = document.querySelector('.pt-stepper[data-demo="rlhf"]');
        if (!demo) return;
        const tabs = demo.querySelectorAll(".pt-stepper-tab");
        const panels = demo.querySelectorAll(".pt-stepper-panel");

        tabs.forEach(t => {
            t.addEventListener("click", () => {
                const idx = t.dataset.step;
                tabs.forEach(x => x.classList.toggle("active", x.dataset.step === idx));
                panels.forEach(p => p.classList.toggle("active", p.dataset.step === idx));
            });
        });

        // Auto-advance once on scroll-into-view
        if (!prefersReduce) {
            const auto = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (!e.isIntersecting) return;
                    auto.disconnect();
                    let i = 0;
                    const tick = () => {
                        if (i >= tabs.length) return;
                        tabs[i].click();
                        i++;
                        if (i < tabs.length) setTimeout(tick, 900);
                    };
                    setTimeout(tick, 400);
                });
            }, { threshold: 0.4 });
            auto.observe(demo);
        }
    }

    // ─────────── 7. RLHF ↔ DPO toggle ───────────
    function initDpoVsRlhf() {
        const demo = document.querySelector('.pt-demo[data-demo="dpo-vs-rlhf"]');
        if (!demo) return;
        const opts = demo.querySelectorAll(".pt-toggle-opt");
        const models = demo.querySelectorAll(".pt-model");
        const foot = demo.querySelector("[data-foot]");

        function set(opt) {
            opts.forEach(o => o.classList.toggle("active", o.dataset.opt === opt));
            models.forEach(m => {
                const role = m.dataset.role;
                const active = opt === "rlhf" ? true : (role === "policy" || role === "reference");
                m.classList.toggle("is-ghost", !active);
            });
            foot.textContent = opt === "rlhf"
                ? "four models in memory — expensive"
                : "two models in memory — the reward/critic are gone";
        }
        opts.forEach(o => o.addEventListener("click", () => set(o.dataset.opt)));
        set("rlhf");
    }

    // ─────────── 8. GRPO demo ───────────
    /* G responses with random reward scores.
     * Advantages normalized to (r - μ) / σ. Positive bars go up, negative down.
     */
    function initGrpo() {
        const demo = document.querySelector('.pt-demo[data-demo="grpo"]');
        if (!demo) return;
        const container = demo.querySelector('[data-grpo]');
        const sizeInput = demo.querySelector('[data-ctrl="grpo-size"]');
        const sizeVal = demo.querySelector('[data-val="grpo-size-val"]');
        const gVal = demo.querySelector('[data-val="grpo-g"]');
        const btn = demo.querySelector('[data-act="grpo-resample"]');

        function render() {
            const G = Number(sizeInput.value);
            sizeVal.textContent = G;
            gVal.textContent = G;
            container.style.gridTemplateColumns = `repeat(${G}, 1fr)`;

            // generate rewards; bias around 0.5 with some spread
            const r = Array.from({ length: G }, () => Math.random());
            const mean = r.reduce((a, b) => a + b, 0) / G;
            const std = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / G) || 1;
            const adv = r.map(x => (x - mean) / std);
            const maxAbs = Math.max(...adv.map(Math.abs)) || 1;

            // build bars
            const html = adv.map((a, i) => {
                const pct = Math.abs(a) / maxAbs; // 0..1
                const h = 5 + pct * 60; // 5-65px from midline
                const cls = a >= 0 ? "positive" : "negative";
                const label = a >= 0 ? `+${a.toFixed(2)}` : a.toFixed(2);
                return `<div class="pt-grpo-bar ${cls}" style="height:${h}px" data-idx="${i}">
                          <span class="pt-grpo-bar-label">${label}</span>
                        </div>`;
            }).join("");
            container.innerHTML = html;

            // animate spring from 0 -> height
            if (!prefersReduce) {
                const bars = container.querySelectorAll(".pt-grpo-bar");
                bars.forEach((bar, i) => {
                    bar.style.transform = "scaleY(0)";
                    setTimeout(() => { bar.style.transform = "scaleY(1)"; }, 40 + i * 40);
                });
            }
        }
        sizeInput.addEventListener("input", render);
        btn.addEventListener("click", render);
        render();

        // re-render once on scroll into view for a nice entrance
        if (!prefersReduce) {
            const auto = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        render();
                        auto.disconnect();
                    }
                });
            }, { threshold: 0.3 });
            auto.observe(demo);
        }
    }

    // ─────────── init ───────────
    function boot() {
        renderMath();
        updateProgress();
        initLossLandscape();
        initLora();
        initStepper();
        initDpoVsRlhf();
        initGrpo();

        // set initial active TOC item
        if (chapters.length) setActive(chapters[0].id);

        // re-measure once layout settles
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (activeId) { const id = activeId; activeId = null; setActive(id); }
        }));
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
