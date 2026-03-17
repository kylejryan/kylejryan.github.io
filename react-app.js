import React, { useState, useEffect, useRef } from 'react';

const customStyles = {
  root: {
    '--bg-canvas': '#000000',
    '--bg-surface': '#0A0A0A',
    '--ink': '#FFFFFF',
    '--font-sans': '"Helvetica Neue", Helvetica, Arial, sans-serif',
    '--font-mono': '"SF Mono", "Roboto Mono", Menlo, Consolas, monospace',
    '--pad-edge': '24px',
    '--pad-inner': '4px',
  },
  body: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: '"SF Mono", "Roboto Mono", Menlo, Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.3',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    display: 'flex',
    justifyContent: 'center',
    height: '100vh',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  terminalApp: {
    backgroundColor: '#0A0A0A',
    width: '100%',
    maxWidth: '480px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  header: {
    padding: '24px 24px 16px 24px',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.1',
    letterSpacing: '-0.01em',
    flexShrink: 0,
  },
  headerBlock: {
    marginBottom: '16px',
  },
  divider: {
    width: '100%',
    height: '1px',
    backgroundImage: 'linear-gradient(to right, #FFFFFF 50%, transparent 50%)',
    backgroundSize: '6px 1px',
    backgroundRepeat: 'repeat-x',
    flexShrink: 0,
  },
  main: {
    flexGrow: 1,
    padding: '16px 24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  logLine: {
    display: 'flex',
    wordBreak: 'break-all',
  },
  prompt: {
    marginRight: '8px',
    userSelect: 'none',
  },
  output: {
    opacity: 0.8,
  },
  highlight: {
    backgroundColor: '#FFFFFF',
    color: '#0A0A0A',
    padding: '0 4px',
    display: 'inline-block',
  },
  systemMatrix: {
    display: 'grid',
    gridTemplateColumns: 'repeat(11, 1fr)',
    gap: '6px',
    width: 'fit-content',
    margin: '24px 0',
  },
  dot: {
    width: '5px',
    height: '5px',
    backgroundColor: '#FFFFFF',
    borderRadius: '50%',
  },
  dotEmpty: {
    width: '5px',
    height: '5px',
    backgroundColor: '#FFFFFF',
    borderRadius: '50%',
    opacity: 0.2,
  },
  footer: {
    flexShrink: 0,
    backgroundColor: '#0A0A0A',
    padding: '16px 24px 32px 24px',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '32px',
  },
  cmdInput: {
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontFamily: '"SF Mono", "Roboto Mono", Menlo, Consolas, monospace',
    fontSize: '13px',
    flexGrow: 1,
    outline: 'none',
    caretColor: 'transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  cursor: {
    display: 'inline-block',
    width: '8px',
    height: '15px',
    backgroundColor: '#FFFFFF',
    marginLeft: '1px',
    transform: 'translateY(2px)',
  },
  barcodeSection: {
    width: '100%',
  },
  barcodeMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '9px',
    fontWeight: '500',
    marginBottom: '4px',
    transform: 'scale(0.9)',
    transformOrigin: 'bottom left',
    width: '111%',
  },
  barcodeMetaLast: {
    transform: 'rotate(180deg)',
  },
  barcodeGraphic: {
    height: '32px',
    width: '100%',
    background: `linear-gradient(to right,
      #FFFFFF 0%, #FFFFFF 2%, transparent 2%, transparent 3.5%,
      #FFFFFF 3.5%, #FFFFFF 4.5%, transparent 4.5%, transparent 6%,
      #FFFFFF 6%, #FFFFFF 9%, transparent 9%, transparent 10%,
      #FFFFFF 10%, #FFFFFF 11%, transparent 11%, transparent 13%,
      #FFFFFF 13%, #FFFFFF 16%, transparent 16%, transparent 17%,
      #FFFFFF 17%, #FFFFFF 18%, transparent 18%, transparent 21%,
      #FFFFFF 21%, #FFFFFF 25%, transparent 25%, transparent 27%,
      #FFFFFF 27%, #FFFFFF 28%, transparent 28%, transparent 31%,
      #FFFFFF 31%, #FFFFFF 33%, transparent 33%, transparent 35%,
      #FFFFFF 35%, #FFFFFF 39%, transparent 39%, transparent 40%,
      #FFFFFF 40%, #FFFFFF 41%, transparent 41%, transparent 43%,
      #FFFFFF 43%, #FFFFFF 46%, transparent 46%, transparent 48%,
      #FFFFFF 48%, #FFFFFF 49%, transparent 49%, transparent 52%,
      #FFFFFF 52%, #FFFFFF 55%, transparent 55%, transparent 56%,
      #FFFFFF 56%, #FFFFFF 57%, transparent 57%, transparent 60%,
      #FFFFFF 60%, #FFFFFF 62%, transparent 62%, transparent 65%,
      #FFFFFF 65%, #FFFFFF 68%, transparent 68%, transparent 70%,
      #FFFFFF 70%, #FFFFFF 71%, transparent 71%, transparent 74%,
      #FFFFFF 74%, #FFFFFF 78%, transparent 78%, transparent 80%,
      #FFFFFF 80%, #FFFFFF 81%, transparent 81%, transparent 84%,
      #FFFFFF 84%, #FFFFFF 88%, transparent 88%, transparent 90%,
      #FFFFFF 90%, #FFFFFF 91%, transparent 91%, transparent 94%,
      #FFFFFF 94%, #FFFFFF 97%, transparent 97%, transparent 98%,
      #FFFFFF 98%, #FFFFFF 100%
    )`,
  },
};

const matrixPattern = [
  [true, true, false, true, true, false, true, true, true, true, false],
  [true, true, true, true, true, true, true, false, true, true, true],
  [true, false, true, true, false, true, true, true, true, false, true],
  [true, true, true, true, true, true, false, true, true, true, true],
  [false, true, true, false, true, true, true, true, false, true, true],
  [true, true, true, true, true, true, true, true, true, true, true],
  [true, false, true, true, true, false, true, true, true, false, true],
  [true, true, true, false, true, true, true, true, true, true, true],
  [false, true, true, true, false, true, true, false, true, true, false],
];

const App = () => {
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 0px; background: transparent; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={customStyles.body}>
      <div style={customStyles.terminalApp}>
        <header style={customStyles.header}>
          <div style={customStyles.headerBlock}>
            Head of R&amp;D /<br />
            Cybersecurity Research<br />
            Core Systems
          </div>
          <div>
            USER: nasrullah<br />
            ROLE: head_rd<br />
            SECTOR: cybersecurity
          </div>
        </header>

        <div style={customStyles.divider}></div>

        <main style={customStyles.main}>
          <div style={customStyles.logLine}>
            <span style={customStyles.prompt}>&gt;</span>
            <span>whoami</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>Head of Research &amp; Development at Cybersecurity. Leading innovation in threat detection, system security, and emerging risk analysis.</span>
          </div>
          <div style={customStyles.logLine}>
            <span style={customStyles.prompt}>&gt;</span>
            <span>ls -la interests/</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>drwxr-xr-x  threat_intelligence/</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>drwxr-xr-x  zero_trust_architecture/</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>drwxr-xr-x  quantum_resistant_crypto/</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>drwxr-xr-x  malware_analysis/</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>drwxr-xr-x  exploit_mitigation/</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>drwxr-xr-x  secure_systems_design/</span>
          </div>
          <div style={customStyles.logLine}>
            <span style={customStyles.prompt}>&gt;</span>
            <span>cat current_projects.txt</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>Advancing next-gen intrusion detection • AI-powered anomaly detection • Post-quantum cryptographic protocols</span>
          </div>

          <div style={customStyles.systemMatrix}>
            {matrixPattern.map((row, rowIndex) =>
              row.map((filled, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={filled ? customStyles.dot : customStyles.dotEmpty}
                ></div>
              ))
            )}
          </div>

          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span style={customStyles.highlight}>ACCESS: AUTHORIZED</span>
          </div>
          <div style={customStyles.logLine}>
            <span style={customStyles.prompt}>&gt;</span>
            <span>connect --pubkey</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>email: nasrullah@cybersec.research</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>twitter: @nasrullah_sec</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>github: github.com/nasrullah-rd</span>
          </div>
          <div style={{ ...customStyles.logLine, ...customStyles.output }}>
            <span>linkedin: linkedin.com/in/nasrullah-rd</span>
          </div>
        </main>

        <div style={customStyles.divider}></div>

        <footer style={customStyles.footer}>
          <div style={customStyles.inputGroup}>
            <span style={customStyles.prompt}>&gt;</span>
            <span style={customStyles.cmdInput}>tail -f /var/log/sys</span>
            <span
              style={{
                ...customStyles.cursor,
                opacity: cursorVisible ? 1 : 0,
              }}
            ></span>
          </div>

          <div style={customStyles.barcodeSection}>
            <div style={customStyles.barcodeMeta}>
              <span>6672 12 32199</span>
              <span style={customStyles.barcodeMetaLast}>100 9</span>
            </div>
            <div style={customStyles.barcodeGraphic}></div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;