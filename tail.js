// Makes the footer `tail -f` actually tail: prints a dim, plausible log
// line above the prompt every few seconds. Lines are keyed off the file
// path shown in the footer. IPs are RFC 5737 documentation ranges.
(function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var prompt = document.querySelector('.footer-prompt');
    if (!prompt) return;
    var path = prompt.textContent;

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function rand(min, max) { return min + Math.floor(Math.random() * (max - min)); }
    function ip() { return pick(['198.51.100.', '203.0.113.', '192.0.2.']) + rand(1, 255); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function stamp() {
        var d = new Date();
        return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    var gen;
    if (path.indexOf('auth.log') !== -1) {
        gen = function () {
            return stamp() + ' sshd[' + rand(1000, 9999) + ']: ' + pick([
                'Failed password for root from ' + ip() + ' port ' + rand(40000, 65535) + ' ssh2',
                'Invalid user admin from ' + ip() + ' port ' + rand(40000, 65535),
                'Connection closed by authenticating user root ' + ip() + ' [preauth]',
                'error: maximum authentication attempts exceeded for root from ' + ip(),
                'Received disconnect from ' + ip() + ': 11: Bye Bye [preauth]'
            ]);
        };
    } else if (path.indexOf('agent_training') !== -1) {
        var ep = rand(4000, 4900);
        gen = function () {
            ep++;
            return '[ep ' + ep + '] ' + pick([
                'recon complete — ' + rand(2, 7) + ' services enumerated',
                'vuln candidate confirmed: ' + pick(['ssrf', 'sqli', 'idor', 'rce', 'xxe']) + ' (high confidence)',
                'exploit chain verified — reward=' + (0.6 + Math.random() * 0.39).toFixed(2),
                'privilege escalation achieved on target-' + rand(1, 12),
                'episode reset — env reseeded'
            ]);
        };
    } else {
        gen = function () {
            return stamp() + ' ' + pick([
                'no new entries — watching...',
                'draft detected: ' + rand(1, 4) + ' files uncommitted',
                'index refreshed — 1 published'
            ]);
        };
    }

    function emit() {
        var line = document.createElement('div');
        line.className = 'tail-line';
        line.textContent = gen();
        prompt.parentNode.insertBefore(line, prompt);
        var lines = prompt.parentNode.querySelectorAll('.tail-line');
        if (lines.length > 4) lines[0].remove();
        schedule();
    }

    function schedule() { setTimeout(emit, rand(4000, 10000)); }
    schedule();
})();
