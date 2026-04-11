/**
 * IT Quick Tools — extended utilities (loaded before app.js; uses globals from CDNs).
 */

function qttJsYaml() {
    return window.jsyaml || window.jsYAML;
}

let _qttTomlMod;
async function qttTomlMod() {
    if (_qttTomlMod) return _qttTomlMod;
    _qttTomlMod = await import('https://esm.sh/smol-toml@2.2.1');
    return _qttTomlMod;
}

function qttSqlFmt() {
    const g = typeof sqlFormatter !== 'undefined' ? sqlFormatter : window.sqlFormatter;
    if (!g) return null;
    if (typeof g.format === 'function') return g;
    const d = g.default;
    return d && typeof d.format === 'function' ? d : null;
}

const QTT_NATO = {
    A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot',
    G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima',
    M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo',
    S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray',
    Y: 'Yankee', Z: 'Zulu', '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three',
    '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
};

const QTT_OUI = {
    '00:00:0C': 'Cisco',
    '00:50:56': 'VMware',
    '52:54:00': 'QEMU/KVM',
    '08:00:27': 'VirtualBox',
    '00:15:5D': 'Microsoft Hyper-V',
    'AC:DE:48': 'Apple (local)',
    '00:1C:42': 'Parallels',
    '02:00:00': 'Locally administered'
};

function qttTplNato() {
    return `<p class="qtt-hint">Letters A–Z and digits → ICAO spelling. Spaces preserved.</p>
        <label>Text</label>
        <textarea id="qtt-nato-in" placeholder="Hello 911"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttRunNato()">Convert</button>
        <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-nato-out').value)">Copy</button></div>
        <textarea id="qtt-nato-out" class="qtt-out" readonly></textarea>`;
}
function qttRunNato() {
    const s = document.getElementById('qtt-nato-in').value;
    const out = [...s.toUpperCase()].map((ch) => {
        if (ch === ' ') return '';
        const w = QTT_NATO[ch];
        return w || ch;
    }).filter(Boolean).join(' ');
    document.getElementById('qtt-nato-out').value = out;
    showNocToast('Converted');
}

function qttTplAsciiBin() {
    return `<p class="qtt-hint">UTF-8 bytes as 8-bit binary groups (space between bytes).</p>
        <label>Text</label>
        <textarea id="qtt-ab-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttRunAsciiBin()">Convert</button>
        <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-ab-out').value)">Copy</button></div>
        <textarea id="qtt-ab-out" class="qtt-out" readonly style="word-break:break-all;"></textarea>`;
}
function qttRunAsciiBin() {
    const bytes = new TextEncoder().encode(document.getElementById('qtt-ab-in').value);
    const bits = [...bytes].map((b) => b.toString(2).padStart(8, '0')).join(' ');
    document.getElementById('qtt-ab-out').value = bits;
    showNocToast('Done');
}

function qttTplUnicode() {
    return `<p class="qtt-hint">Code points U+XXXX per character (UTF-16 code units for BMP).</p>
        <label>Text</label>
        <textarea id="qtt-uc-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttRunUnicode()">Show code points</button>
        <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-uc-out').value)">Copy</button></div>
        <textarea id="qtt-uc-out" class="qtt-out" readonly></textarea>`;
}
function qttRunUnicode() {
    const s = document.getElementById('qtt-uc-in').value;
    const lines = [];
    for (const ch of s) {
        const cp = ch.codePointAt(0);
        lines.push(`${ch}\tU+${cp.toString(16).toUpperCase().padStart(4, '0')}`);
    }
    document.getElementById('qtt-uc-out').value = lines.join('\n');
    showNocToast('Done');
}

function qttTplListConv() {
    return `<p class="qtt-hint">Transform line-based lists and simple JSON arrays.</p>
        <label>Mode</label>
        <select id="qtt-lc-mode">
            <option value="nl2comma">Newlines → comma-separated</option>
            <option value="comma2nl">Comma-separated → newlines</option>
            <option value="lines2json">Lines → JSON string array</option>
            <option value="json2lines">JSON string array → lines</option>
        </select>
        <label>Input</label>
        <textarea id="qtt-lc-in" placeholder="One item per line or JSON…"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttRunListConv()">Convert</button>
        <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-lc-out').value)">Copy</button></div>
        <textarea id="qtt-lc-out" class="qtt-out" readonly></textarea>`;
}
function qttRunListConv() {
    const mode = document.getElementById('qtt-lc-mode').value;
    const raw = document.getElementById('qtt-lc-in').value;
    let out = '';
    try {
        if (mode === 'nl2comma') {
            out = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join(', ');
        } else if (mode === 'comma2nl') {
            out = raw.split(',').map((l) => l.trim()).filter(Boolean).join('\n');
        } else if (mode === 'lines2json') {
            const arr = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            out = JSON.stringify(arr, null, 2);
        } else if (mode === 'json2lines') {
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) throw new Error('Need JSON array');
            out = arr.map((x) => String(x)).join('\n');
        }
        document.getElementById('qtt-lc-out').value = out;
        showNocToast('Converted');
    } catch {
        showNocToast('Conversion failed');
    }
}

function qttFmtYamlFail() {
    showNocToast('js-yaml not loaded (check network / CDN)');
}

function qttTplYamlJson() {
    return `<p class="qtt-hint">YAML → JSON (2-space indent).</p><label>YAML</label><textarea id="ytt-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="yttRun('yj')">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('ytt-out').value)">Copy</button></div>
        <textarea id="ytt-out" class="qtt-out" readonly></textarea>`;
}
function qttTplJsonYaml() {
    return `<p class="qtt-hint">JSON → YAML.</p><label>JSON</label><textarea id="ytt-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="yttRun('jy')">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('ytt-out').value)">Copy</button></div>
        <textarea id="ytt-out" class="qtt-out" readonly></textarea>`;
}
async function yttRun(mode) {
    const y = qttJsYaml();
    if (!y) {
        qttFmtYamlFail();
        return;
    }
    const inp = document.getElementById('ytt-in').value;
    try {
        if (mode === 'yj') {
            const obj = y.load(inp);
            document.getElementById('ytt-out').value = JSON.stringify(obj, null, 2);
        } else {
            const obj = JSON.parse(inp);
            document.getElementById('ytt-out').value = y.dump(obj, { lineWidth: 120 });
        }
        showNocToast('Converted');
    } catch {
        showNocToast('Parse error');
    }
}

async function yttTomlYaml(mode) {
    const y = qttJsYaml();
    const t = await qttTomlMod();
    if (!y || !t) {
        showNocToast('Library load failed');
        return;
    }
    const inp = document.getElementById('ytt2-in').value;
    try {
        if (mode === 'ty') {
            const obj = t.parse(inp);
            document.getElementById('ytt2-out').value = y.dump(obj, { lineWidth: 120 });
        } else {
            const obj = y.load(inp);
            document.getElementById('ytt2-out').value = t.stringify(obj);
        }
        showNocToast('Converted');
    } catch {
        showNocToast('Parse error');
    }
}
async function qttYamlTomlRun() {
    const y = qttJsYaml();
    const t = await qttTomlMod();
    if (!y || !t) {
        showNocToast('Library load failed');
        return;
    }
    const inp = document.getElementById('ytt2-in').value;
    try {
        const obj = y.load(inp);
        document.getElementById('ytt2-out').value = t.stringify(obj);
        showNocToast('Converted');
    } catch {
        showNocToast('Parse error');
    }
}
function qttTplTomlYaml() {
    return `<p class="qtt-hint">TOML → YAML.</p><label>TOML</label><textarea id="ytt2-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="yttTomlYaml('ty')">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('ytt2-out').value)">Copy</button></div>
        <textarea id="ytt2-out" class="qtt-out" readonly></textarea>`;
}

async function yttJsonTomlRun() {
    const t = await qttTomlMod();
    if (!t) {
        showNocToast('TOML lib failed');
        return;
    }
    const inp = document.getElementById('jt-in').value;
    try {
        document.getElementById('jt-out').value = t.stringify(JSON.parse(inp));
        showNocToast('Converted');
    } catch {
        showNocToast('Parse error');
    }
}
async function yttTomlJsonRun() {
    const t = await qttTomlMod();
    if (!t) {
        showNocToast('TOML lib failed');
        return;
    }
    const inp = document.getElementById('jt-in').value;
    try {
        document.getElementById('jt-out').value = JSON.stringify(t.parse(inp), null, 2);
        showNocToast('Converted');
    } catch {
        showNocToast('Parse error');
    }
}
function qttTplJsonToml() {
    return `<p class="qtt-hint">JSON → TOML.</p><label>JSON</label><textarea id="jt-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="yttJsonTomlRun()">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('jt-out').value)">Copy</button></div>
        <textarea id="jt-out" class="qtt-out" readonly></textarea>`;
}
function qttTplTomlJson() {
    return `<p class="qtt-hint">TOML → JSON.</p><label>TOML</label><textarea id="jt-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="yttTomlJsonRun()">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('jt-out').value)">Copy</button></div>
        <textarea id="jt-out" class="qtt-out" readonly></textarea>`;
}

function qttXmlElToObj(el) {
    const o = {};
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (el.children.length === 0) {
        return text || '';
    }
    for (const c of el.children) {
        const name = c.nodeName;
        const v = qttXmlElToObj(c);
        if (o[name] !== undefined) {
            if (!Array.isArray(o[name])) o[name] = [o[name]];
            o[name].push(v);
        } else {
            o[name] = v;
        }
    }
    return o;
}
function qttTplXmlJson() {
    return `<p class="qtt-hint">Simple XML → JSON (attributes ignored; text nodes merged).</p><label>XML</label><textarea id="xj-in" placeholder="<root><a>1</a></root>"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttXmlJsonRun()">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('xj-out').value)">Copy</button></div>
        <textarea id="xj-out" class="qtt-out" readonly></textarea>`;
}
function qttXmlJsonRun() {
    const xml = document.getElementById('xj-in').value.trim();
    try {
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        if (doc.querySelector('parsererror')) throw new Error('parse');
        const root = doc.documentElement;
        const obj = { [root.nodeName]: qttXmlElToObj(root) };
        document.getElementById('xj-out').value = JSON.stringify(obj, null, 2);
        showNocToast('Converted');
    } catch {
        showNocToast('Invalid XML');
    }
}

function qttJsonToXmlVal(v, tag) {
    if (v === null || v === undefined) return `<${tag}></${tag}>`;
    if (typeof v !== 'object') return `<${tag}>${String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${tag}>`;
    if (Array.isArray(v)) return v.map((item) => qttJsonToXmlVal(item, tag)).join('');
    let s = '';
    for (const [k, val] of Object.entries(v)) {
        s += qttJsonToXmlVal(val, k);
    }
    return s;
}
function qttTplJsonXml() {
    return `<p class="qtt-hint">JSON object → XML (root element name).</p>
        <label>Root tag</label><input type="text" id="jx-root" value="root" style="margin-bottom:10px;">
        <label>JSON</label><textarea id="jx-in">{"a":1,"b":{"c":"x"}}</textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttJsonXmlRun()">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('jx-out').value)">Copy</button></div>
        <textarea id="jx-out" class="qtt-out" readonly></textarea>`;
}
function qttJsonXmlRun() {
    const root = document.getElementById('jx-root').value.trim() || 'root';
    try {
        const obj = JSON.parse(document.getElementById('jx-in').value);
        const inner = typeof obj === 'object' && !Array.isArray(obj)
            ? Object.entries(obj).map(([k, v]) => qttJsonToXmlVal(v, k)).join('')
            : qttJsonToXmlVal(obj, 'item');
        document.getElementById('jx-out').value = `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>${inner}</${root}>`;
        showNocToast('Converted');
    } catch {
        showNocToast('Invalid JSON');
    }
}

function qttTplMdHtml() {
    return `<p class="qtt-hint">Uses <code>marked</code> from CDN (GitHub-flavoured subset).</p><label>Markdown</label><textarea id="md-in" placeholder="# Title"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttMdRun()">Render</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('md-out').innerHTML)">Copy HTML</button></div>
        <label>Preview</label><div id="md-out" class="qtt-out" style="min-height:120px;background:var(--bg);padding:12px;border-radius:8px;border:1px solid var(--border);"></div>`;
}
function qttMdRun() {
    if (typeof marked === 'undefined') {
        showNocToast('marked.js not loaded');
        return;
    }
    document.getElementById('md-out').innerHTML = marked.parse(document.getElementById('md-in').value, { mangle: false, headerIds: false });
    showNocToast('Rendered');
}

function qttTplUa() {
    return `<p class="qtt-hint">Lightweight heuristics (not a full UA database).</p><label>User-Agent</label><textarea id="ua-in" placeholder="Mozilla/5.0 …"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttUaRun()">Parse</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('ua-out').textContent)">Copy</button></div>
        <pre id="ua-out" class="qtt-out" style="white-space:pre-wrap;"></pre>`;
}
function qttUaRun() {
    const ua = document.getElementById('ua-in').value;
    const lines = [];
    if (/Edg\//i.test(ua)) lines.push('Browser: Microsoft Edge');
    else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) lines.push('Browser: Chrome (or Chromium-family)');
    else if (/Firefox\//i.test(ua)) lines.push('Browser: Firefox');
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) lines.push('Browser: Safari');
    else lines.push('Browser: unknown / other');
    const m = ua.match(/(Windows NT [\d.]+|Mac OS X [\d_]+|Android [\d.]+|Linux x86_64|iPhone OS [\d_]+)/i);
    lines.push(`OS hint: ${m ? m[1] : 'not detected'}`);
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) lines.push('Device class: mobile / tablet likely');
    else lines.push('Device class: desktop likely');
    document.getElementById('ua-out').textContent = lines.join('\n');
    showNocToast('Parsed');
}

function qttTplRandPort() {
    return `<p class="qtt-hint">Ephemeral-friendly range (user-space ports).</p>
        <label>Min</label><input type="number" id="rp-min" value="32768" min="1024" max="65535">
        <label>Max</label><input type="number" id="rp-max" value="65535" min="1024" max="65535">
        <label>Count</label><input type="number" id="rp-n" value="5" min="1" max="50">
        <div class="qtt-row"><button type="button" class="btn" onclick="qttRandPortRun()">Generate</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('rp-out').value)">Copy</button></div>
        <textarea id="rp-out" class="qtt-out" readonly></textarea>`;
}
function qttRandPortRun() {
    const mn = Math.min(65535, Math.max(1024, parseInt(document.getElementById('rp-min').value, 10) || 32768));
    const mx = Math.min(65535, Math.max(mn, parseInt(document.getElementById('rp-max').value, 10) || 65535));
    const n = Math.min(50, Math.max(1, parseInt(document.getElementById('rp-n').value, 10) || 1));
    const set = new Set();
    while (set.size < n) {
        set.add(mn + Math.floor(Math.random() * (mx - mn + 1)));
    }
    document.getElementById('rp-out').value = [...set].join('\n');
    showNocToast('Ports generated');
}

function qttTplJsonPretty() {
    return `<label>JSON</label><textarea id="jp-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttJsonPrettyRun()">Prettify</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('jp-out').value)">Copy</button></div>
        <textarea id="jp-out" class="qtt-out" readonly></textarea>`;
}
function qttJsonPrettyRun() {
    try {
        document.getElementById('jp-out').value = JSON.stringify(JSON.parse(document.getElementById('jp-in').value), null, 2);
        showNocToast('Formatted');
    } catch {
        showNocToast('Invalid JSON');
    }
}
function qttTplJsonMini() {
    return `<label>JSON</label><textarea id="jm-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttJsonMiniRun()">Minify</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('jm-out').value)">Copy</button></div>
        <textarea id="jm-out" class="qtt-out" readonly></textarea>`;
}
function qttJsonMiniRun() {
    try {
        document.getElementById('jm-out').value = JSON.stringify(JSON.parse(document.getElementById('jm-in').value));
        showNocToast('Minified');
    } catch {
        showNocToast('Invalid JSON');
    }
}
function qttTplJsonCsv() {
    return `<p class="qtt-hint">Array of objects → header row + CSV. Escapes quotes.</p><label>JSON array</label><textarea id="jc-in">[{"a":1,"b":2},{"a":3,"b":4}]</textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttJsonCsvRun()">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('jc-out').value)">Copy</button></div>
        <textarea id="jc-out" class="qtt-out" readonly></textarea>`;
}
function qttCsvEsc(s) {
    const t = String(s);
    if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
    return t;
}
function qttJsonCsvRun() {
    try {
        const arr = JSON.parse(document.getElementById('jc-in').value);
        if (!Array.isArray(arr) || !arr.length) throw new Error('need array');
        const keys = [...new Set(arr.flatMap((o) => (o && typeof o === 'object' ? Object.keys(o) : [])))];
        if (!keys.length) throw new Error('empty');
        const lines = [keys.map(qttCsvEsc).join(',')];
        for (const row of arr) {
            lines.push(keys.map((k) => qttCsvEsc(row && typeof row === 'object' ? row[k] ?? '' : '')).join(','));
        }
        document.getElementById('jc-out').value = lines.join('\n');
        showNocToast('CSV ready');
    } catch {
        showNocToast('Need non-empty array of objects');
    }
}

function qttTplSqlPretty() {
    return `<label>SQL</label><textarea id="sq-in" placeholder="select * from t where a=1"></textarea>
        <label>Dialect</label><select id="sq-d"><option value="sql">SQL</option><option value="postgresql">PostgreSQL</option><option value="mysql">MySQL</option><option value="sqlite">SQLite</option></select>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttSqlRun()">Format</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('sq-out').value)">Copy</button></div>
        <textarea id="sq-out" class="qtt-out" readonly></textarea>`;
}
function qttSqlRun() {
    const fmt = qttSqlFmt();
    if (!fmt || typeof fmt.format !== 'function') {
        showNocToast('sql-formatter not loaded');
        return;
    }
    try {
        const dialect = document.getElementById('sq-d').value;
        document.getElementById('sq-out').value = fmt.format(document.getElementById('sq-in').value, { language: dialect });
        showNocToast('Formatted');
    } catch {
        showNocToast('Format failed');
    }
}

function qttTplChmod() {
    return `<p class="qtt-hint">Octal (e.g. 755) → rwxrwxrwx table.</p>
        <label>Octal mode</label><input type="text" id="ch-in" placeholder="755 or 0644" maxlength="4">
        <div class="qtt-row"><button type="button" class="btn" onclick="qttChmodRun()">Analyse</button></div>
        <pre id="ch-out" class="qtt-out" style="white-space:pre-wrap;"></pre>`;
}
function qttRwx(n) {
    return `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'}`;
}
function qttChmodRun() {
    let raw = document.getElementById('ch-in').value.trim().replace(/^0+/, '') || '0';
    const o = parseInt(raw, 8);
    if (Number.isNaN(o) || o < 0 || o > 0o7777) {
        showNocToast('Invalid octal');
        return;
    }
    const u = (o >> 6) & 7;
    const g = (o >> 3) & 7;
    const w = o & 7;
    const sym = `${qttRwx(u)}${qttRwx(g)}${qttRwx(w)}`;
    document.getElementById('ch-out').textContent = `Octal: 0${o.toString(8)}\nSymbolic: ${sym}\nOwner: ${qttRwx(u)}  Group: ${qttRwx(g)}  Others: ${qttRwx(w)}`;
    showNocToast('OK');
}

function qttTplYamlPretty() {
    return `<p class="qtt-hint">Parse + dump with consistent indentation.</p><label>YAML</label><textarea id="yp-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttYamlPrettyRun()">Prettify</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('yp-out').value)">Copy</button></div>
        <textarea id="yp-out" class="qtt-out" readonly></textarea>`;
}
function qttYamlPrettyRun() {
    const y = qttJsYaml();
    if (!y) {
        qttFmtYamlFail();
        return;
    }
    try {
        const obj = y.load(document.getElementById('yp-in').value);
        document.getElementById('yp-out').value = y.dump(obj, { indent: 2, lineWidth: 120 });
        showNocToast('Formatted');
    } catch {
        showNocToast('Invalid YAML');
    }
}

function qttIpv4ToLong(ip) {
    const p = ip.trim().split('.').map((x) => parseInt(x, 10));
    if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) throw new Error('bad');
    return (p[0] * 16777216 + p[1] * 65536 + p[2] * 256 + p[3]) >>> 0;
}
function qttLongToIpv4(n) {
    n >>>= 0;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}
function qttCidrMask(prefix) {
    const p = Math.min(32, Math.max(0, prefix | 0));
    if (p === 0) return 0;
    return (-1 << (32 - p)) >>> 0;
}
function qttTplSubnet() {
    return `<p class="qtt-hint">IPv4 CIDR calculator (network, broadcast, host range).</p>
        <label>CIDR</label><input type="text" id="sn-in" placeholder="192.168.1.0/24">
        <div class="qtt-row"><button type="button" class="btn" onclick="qttSubnetRun()">Calculate</button></div>
        <pre id="sn-out" class="qtt-out" style="white-space:pre-wrap;"></pre>`;
}
function qttSubnetRun() {
    const m = document.getElementById('sn-in').value.trim().match(/^([\d.]+)\/(\d{1,2})$/);
    if (!m) {
        showNocToast('Use e.g. 10.0.0.0/24');
        return;
    }
    try {
        const base = qttIpv4ToLong(m[1]);
        const pref = parseInt(m[2], 10);
        if (pref > 32) throw new Error('bad');
        const mask = qttCidrMask(pref);
        const net = (base & mask) >>> 0;
        const bcast = (net | (~mask >>> 0)) >>> 0;
        const hosts = Math.max(0, (bcast - net + 1) >>> 0);
        const first = pref >= 31 ? net : net + 1;
        const last = pref >= 31 ? bcast : bcast - 1;
        document.getElementById('sn-out').textContent = [
            `Network:     ${qttLongToIpv4(net)} / ${pref}`,
            `Netmask:     ${qttLongToIpv4(mask)}`,
            `Broadcast:   ${qttLongToIpv4(bcast)}`,
            `Addresses:   ${hosts}`,
            `First host:  ${qttLongToIpv4(first)}`,
            `Last host:   ${qttLongToIpv4(last)}`
        ].join('\n');
        showNocToast('OK');
    } catch {
        showNocToast('Invalid CIDR');
    }
}

function qttTplIpv4Conv() {
    return `<p class="qtt-hint">Dotted IPv4 → unsigned int &amp; hex.</p><label>IPv4</label><input type="text" id="ic-in" placeholder="192.168.0.1">
        <div class="qtt-row"><button type="button" class="btn" onclick="qttIpv4ConvRun()">Convert</button></div>
        <pre id="ic-out" class="qtt-out" style="white-space:pre-wrap;"></pre>`;
}
function qttIpv4ConvRun() {
    try {
        const n = qttIpv4ToLong(document.getElementById('ic-in').value);
        document.getElementById('ic-out').textContent = `Dotted: ${qttLongToIpv4(n)}\nDecimal (unsigned): ${n}\nHex: 0x${n.toString(16).toUpperCase()}`;
        showNocToast('OK');
    } catch {
        showNocToast('Invalid IPv4');
    }
}

function qttTplIpRange() {
    return `<p class="qtt-hint">Expand start–end (inclusive). Capped at 2000 lines.</p>
        <label>Start</label><input type="text" id="ir-a" placeholder="10.0.0.1">
        <label>End</label><input type="text" id="ir-b" placeholder="10.0.0.20">
        <div class="qtt-row"><button type="button" class="btn" onclick="qttIpRangeRun()">Expand</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('ir-out').value)">Copy</button></div>
        <textarea id="ir-out" class="qtt-out" readonly></textarea>`;
}
function qttIpRangeRun() {
    try {
        const a = qttIpv4ToLong(document.getElementById('ir-a').value);
        const b = qttIpv4ToLong(document.getElementById('ir-b').value);
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const max = 2000;
        if (hi - lo > max) {
            showNocToast(`Range too large (max ${max})`);
            return;
        }
        const lines = [];
        for (let x = lo; x <= hi; x++) lines.push(qttLongToIpv4(x));
        document.getElementById('ir-out').value = lines.join('\n');
        showNocToast(`Listed ${lines.length} addresses`);
    } catch {
        showNocToast('Invalid IPv4 range');
    }
}

function qttTplMacLookup() {
    return `<p class="qtt-hint">OUI lookup (small offline vendor hints).</p><label>MAC</label><input type="text" id="ml-in" placeholder="00:50:56:ab:cd:ef">
        <div class="qtt-row"><button type="button" class="btn" onclick="qttMacLookupRun()">Lookup</button></div>
        <pre id="ml-out" class="qtt-out" style="white-space:pre-wrap;"></pre>`;
}
function qttMacNormPrefix(mac) {
    const hex = mac.replace(/[^a-fA-F0-9]/g, '').padStart(12, '0').slice(0, 6);
    return `${hex.slice(0, 2)}:${hex.slice(2, 4)}:${hex.slice(4, 6)}`.toUpperCase();
}
function qttMacLookupRun() {
    const pref = qttMacNormPrefix(document.getElementById('ml-in').value);
    const vendor = QTT_OUI[pref] || 'Unknown / not in local list';
    document.getElementById('ml-out').textContent = `OUI ${pref}: ${vendor}`;
    showNocToast('OK');
}

function qttTplMacGen() {
    return `<p class="qtt-hint">Random locally administered unicast MAC.</p>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttMacGenRun()">Generate</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('mg-out').value)">Copy</button></div>
        <input type="text" id="mg-out" readonly style="font-family:JetBrains Mono;">`;
}
function qttMacGenRun() {
    const b = new Uint8Array(6);
    crypto.getRandomValues(b);
    b[0] = (b[0] & 0xfe) | 0x02;
    const s = [...b].map((x) => x.toString(16).padStart(2, '0')).join(':');
    document.getElementById('mg-out').value = s;
    showNocToast('MAC generated');
}

function qttTplIpv6Ula() {
    return `<p class="qtt-hint">RFC 4193 ULA prefix <code>fd00::/8</code> with random /64 (local only).</p>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttIpv6UlaRun()">Generate /64</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('u6-out').value)">Copy</button></div>
        <input type="text" id="u6-out" readonly style="font-family:JetBrains Mono;font-size:0.85rem;">`;
}
function qttIpv6UlaRun() {
    const a = new Uint8Array(6);
    crypto.getRandomValues(a);
    a[0] = 0xfd;
    const p1 = ((a[0] << 8) | a[1]).toString(16);
    const p2 = ((a[2] << 8) | a[3]).toString(16);
    const p3 = ((a[4] << 8) | a[5]).toString(16);
    document.getElementById('u6-out').value = `${p1}:${p2}:${p3}::/64`;
    showNocToast('ULA generated');
}

function qttTplEta() {
    return `<p class="qtt-hint">ETA from remaining units and throughput (or duration).</p>
        <label>Remaining count</label><input type="number" id="et-n" value="100" min="1">
        <label>Done per minute (throughput)</label><input type="number" id="et-r" value="10" min="0.001" step="any">
        <div class="qtt-row"><button type="button" class="btn" onclick="qttEtaRun()">Calculate ETA</button></div>
        <pre id="et-out" class="qtt-out" style="white-space:pre-wrap;"></pre>`;
}
function qttEtaRun() {
    const n = parseFloat(document.getElementById('et-n').value);
    const r = parseFloat(document.getElementById('et-r').value);
    if (!(n > 0) || !(r > 0)) {
        showNocToast('Need positive numbers');
        return;
    }
    const minutes = n / r;
    const ms = minutes * 60 * 1000;
    const done = new Date(Date.now() + ms);
    document.getElementById('et-out').textContent = `Minutes remaining: ${minutes.toFixed(2)}\nETA (local): ${done.toLocaleString()}`;
    showNocToast('Calculated');
}

function qttTplPercent() {
    return `<p class="qtt-hint">What is X% of Y? &nbsp;|&nbsp; X is what % of Y?</p>
        <label>X</label><input type="number" id="pc-x" step="any" placeholder="25">
        <label>Y</label><input type="number" id="pc-y" step="any" placeholder="200">
        <div class="qtt-row">
            <button type="button" class="btn" onclick="qttPctRun('of')">X% of Y</button>
            <button type="button" class="btn" style="background:var(--surface);color:var(--text-main);border:1px solid var(--border);" onclick="qttPctRun('is')">X is ?% of Y</button>
        </div>
        <pre id="pc-out" class="qtt-out" style="white-space:pre-wrap;"></pre>`;
}
function qttPctRun(mode) {
    const x = parseFloat(document.getElementById('pc-x').value);
    const y = parseFloat(document.getElementById('pc-y').value);
    if (Number.isNaN(x) || Number.isNaN(y)) {
        showNocToast('Enter X and Y');
        return;
    }
    if (mode === 'of') {
        document.getElementById('pc-out').textContent = `${x}% of ${y} = ${((x / 100) * y).toFixed(6)}`;
    } else {
        if (y === 0) {
            showNocToast('Y cannot be 0');
            return;
        }
        document.getElementById('pc-out').textContent = `${x} is ${((x / y) * 100).toFixed(4)}% of ${y}`;
    }
    showNocToast('OK');
}

/* Fix YAML→TOML button wiring */
function qttTplYamlTomlFixed() {
    return `<p class="qtt-hint">YAML → TOML (smol-toml stringify).</p><label>YAML</label><textarea id="ytt2-in"></textarea>
        <div class="qtt-row"><button type="button" class="btn" onclick="qttYamlTomlRun()">Convert</button><button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('ytt2-out').value)">Copy</button></div>
        <textarea id="ytt2-out" class="qtt-out" readonly></textarea>`;
}

window.QTT_EXTRA_TITLES = {
    nato: '📝 Text to NATO alphabet',
    asciibin: '💾 Text to ASCII binary',
    unicode: '🔣 Text to Unicode',
    yamljson: '🔄 YAML → JSON',
    yamltoml: '🔄 YAML → TOML',
    jsonyaml: '🔄 JSON → YAML',
    jsontoml: '🔄 JSON → TOML',
    listconv: '📋 List converter',
    tomljson: '🔄 TOML → JSON',
    tomlyaml: '🔄 TOML → YAML',
    xmljson: '🔄 XML → JSON',
    jsonxml: '🔄 JSON → XML',
    mdhtml: '📰 Markdown → HTML',
    uaparse: '🕵️ User-agent parser',
    randport: '🔌 Random port generator',
    jsonpretty: '✨ JSON prettify',
    jsonmini: '🗜️ JSON minify',
    jsoncsv: '📊 JSON → CSV',
    sqlpretty: '🗃️ SQL prettify',
    chmod: '🔢 Chmod calculator',
    yamlpretty: '✨ YAML prettify',
    subnet: '🌐 IPv4 subnet calculator',
    ipv4conv: '🔢 IPv4 address converter',
    iprange: '📏 IPv4 range expander',
    maclookup: '🔍 MAC address lookup',
    macgen: '🎲 MAC address generator',
    ipv6ula: '🌐 IPv6 ULA generator',
    eta: '⏱️ ETA calculator',
    percent: '％ Percentage calculator'
};

window.QTT_EXTRA_BUILDERS = {
    nato: qttTplNato,
    asciibin: qttTplAsciiBin,
    unicode: qttTplUnicode,
    yamljson: qttTplYamlJson,
    yamltoml: qttTplYamlTomlFixed,
    jsonyaml: qttTplJsonYaml,
    jsontoml: qttTplJsonToml,
    listconv: qttTplListConv,
    tomljson: qttTplTomlJson,
    tomlyaml: qttTplTomlYaml,
    xmljson: qttTplXmlJson,
    jsonxml: qttTplJsonXml,
    mdhtml: qttTplMdHtml,
    uaparse: qttTplUa,
    randport: qttTplRandPort,
    jsonpretty: qttTplJsonPretty,
    jsonmini: qttTplJsonMini,
    jsoncsv: qttTplJsonCsv,
    sqlpretty: qttTplSqlPretty,
    chmod: qttTplChmod,
    yamlpretty: qttTplYamlPretty,
    subnet: qttTplSubnet,
    ipv4conv: qttTplIpv4Conv,
    iprange: qttTplIpRange,
    maclookup: qttTplMacLookup,
    macgen: qttTplMacGen,
    ipv6ula: qttTplIpv6Ula,
    eta: qttTplEta,
    percent: qttTplPercent
};
