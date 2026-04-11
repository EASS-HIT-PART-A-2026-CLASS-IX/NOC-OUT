/**
 * SOC COMMAND CENTER - v25 PRO FULL LOGIC
 */

const CLIENT_NAMES = ["Aragorn", "Batman", "Cobb", "Deadpool", "Elsa", "Frodo", "Gandalf", "Harry", "Indiana", "Joker", "Katniss", "Logan"];

/**
 * Build full URLs to try for FastAPI. Order matters.
 * - Standard web port (80/443/empty): same-origin /api/... first (nginx in Docker proxies to backend),
 *   then direct :8000 (fallback if image was built without nginx proxy).
 * - Dev server (e.g. :5500): only :8000 on same hostname.
 * - file://: only 127.0.0.1:8000
 */
function buildApiUrls(pathWithQuery) {
    const p = pathWithQuery.replace(/^\/+/, '');
    const basePath = `/api/${p}`;
    const pr = window.location.protocol;
    const host = window.location.hostname;
    if (pr === 'file:') {
        return [`http://127.0.0.1:8000${basePath}`];
    }
    const port = window.location.port || '';
    const std = port === '80' || port === '443' || port === '';
    const direct8000 = `${pr}//${host}:8000${basePath}`;
    if (std) {
        return [`${window.location.origin}${basePath}`, direct8000];
    }
    return [direct8000];
}

/**
 * @param {string} pathWithQuery e.g. "weather/dc-monitoring" or "qa/device-lookup?q=pixel"
 * @returns {Promise<any>}
 */
async function fetchApiJson(pathWithQuery) {
    const urls = buildApiUrls(pathWithQuery);
    let lastErr = new Error('API unreachable');
    for (const url of urls) {
        try {
            const r = await fetch(url);
            if (!r.ok) {
                const t = await r.text();
                lastErr = new Error(`HTTP ${r.status}: ${t.slice(0, 200)}`);
                continue;
            }
            return await r.json();
        } catch (e) {
            lastErr = e instanceof Error ? e : new Error(String(e));
        }
    }
    lastErr.attemptedUrls = urls;
    throw lastErr;
}

// State Management
let ticketCounter = 1000;
let activeIncidents = [];
let closedIncidents = [];
let shiftChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initClocks();
    initChart();
    populateClients();
    loadRoster();
    renderCannedResponses();
    scratchpadInit();
    renderLinuxSnippets();
    renderLibrary();
});

// Sidebar Navigation
function showPage(pageId, navElement) {
    if (pageId !== 'it-quick-tools') {
        qttCloseTool();
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if(navElement) navElement.classList.add('active');
}

// Roster Management
function editRoster(type) {
    const card = document.getElementById(`card-${type}`);
    card.querySelector('.roster-view').style.display = 'none';
    card.querySelector('.roster-edit').style.display = 'block';
}

function saveRoster(type) {
    const name = document.getElementById(`input-${type}-name`).value;
    const detailKey = type === 'manager' ? 'slack' : 'phone';
    const detail = document.getElementById(`input-${type}-${detailKey}`).value;
    localStorage.setItem(`roster-${type}-name`, name);
    localStorage.setItem(`roster-${type}-detail`, detail);
    updateRosterUI(type, name, detail);
}

function loadRoster() {
    ['manager', 'soc', 'tier2'].forEach(type => {
        const name = localStorage.getItem(`roster-${type}-name`) || "Not Set";
        const detail = localStorage.getItem(`roster-${type}-detail`) || "---";
        updateRosterUI(type, name, detail);
    });
}

function updateRosterUI(type, name, detail) {
    const card = document.getElementById(`card-${type}`);
    document.getElementById(`view-${type}-name`).innerText = name;
    document.getElementById(`view-${type}-${type === 'manager' ? 'slack' : 'phone'}`).innerText = detail;
    card.querySelector('.roster-view').style.display = 'block';
    card.querySelector('.roster-edit').style.display = 'none';
}

// Global Clocks
function initClocks() {
    const zones = [
        {id: 'Israel', tz: 'Asia/Jerusalem'}, {id: 'UTC', tz: 'UTC'}, 
        {id: 'London', tz: 'Europe/London'}, {id: 'New York', tz: 'America/New_York'},
        {id: 'LA', tz: 'America/Los_Angeles'}, {id: 'China', tz: 'Asia/Shanghai'},
        {id: 'Japan', tz: 'Asia/Tokyo'}, {id: 'Australia', tz: 'Australia/Sydney'}
    ];
    setInterval(() => {
        const now = new Date();
        document.getElementById('world-clocks').innerHTML = zones.map(z => `
            <div class="clock-item">
                <div style="font-size:0.6rem; color:var(--accent);">${z.id}</div>
                <div style="font-family:'JetBrains Mono'; font-weight:700;">${now.toLocaleTimeString('en-GB', {timeZone: z.tz, hour12: false})}</div>
            </div>
        `).join('');
    }, 1000);
}

// --- INCIDENT MANAGEMENT SYSTEM ---

function populateClients() {
    const sel = document.getElementById('inc-client');
    CLIENT_NAMES.forEach(c => sel.add(new Option(c, c)));
}

function createIncident() {
    const analyst = document.getElementById('inc-analyst').value;
    const sev = parseInt(document.getElementById('inc-sev').value);
    const client = document.getElementById('inc-client').value;
    const desc = document.getElementById('inc-desc').value;

    if(!analyst) return alert("Please enter Analyst Name");

    ticketCounter++;
    const inc = { 
        id: ticketCounter, 
        analyst, 
        sev, 
        client, 
        desc, 
        startTime: new Date().toLocaleTimeString('en-GB'),
        endTime: null
    };
    
    activeIncidents.unshift(inc);
    document.getElementById('inc-desc').value = ""; // clear input
    updateAllViews();
}

// Change Severity (Escalate / De-escalate)
function changeSeverity(id, delta) {
    const inc = activeIncidents.find(i => i.id === id);
    if(inc) {
        inc.sev = Math.max(1, Math.min(5, inc.sev + delta)); // restrict between 1 and 5
        updateAllViews();
    }
}

// Resolve (END) Incident
function resolveIncident(id) {
    const index = activeIncidents.findIndex(i => i.id === id);
    if(index > -1) {
        const inc = activeIncidents.splice(index, 1)[0];
        inc.endTime = new Date().toLocaleTimeString('en-GB');
        closedIncidents.unshift(inc); // Add to top of closed logs
        updateAllViews();
    }
}

// Master Update Function
function updateAllViews() {
    renderActiveIncidents();
    renderTopBanner();
    renderClosedLogs();
    updateChartData();
}

function getSevColor(sev) {
    return sev === 5 ? 'var(--red)' : sev === 4 ? 'var(--orange)' : sev === 3 ? 'var(--yellow)' : sev === 2 ? '#3b82f6' : 'var(--green)';
}

function renderActiveIncidents() {
    const list = document.getElementById('incident-list');
    if(activeIncidents.length === 0) {
        list.innerHTML = `<p style="color:var(--text-dim); text-align:center;">No active incidents. Good job!</p>`;
        return;
    }

    list.innerHTML = activeIncidents.map(i => `
        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; margin-bottom:5px; border-left:4px solid ${getSevColor(i.sev)}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:0.75rem;"><b>#INC-${i.id}</b> | ${i.client} (Sev ${i.sev})</div>
                <div style="display:flex; gap:5px;">
                    <button class="btn-icon" onclick="changeSeverity(${i.id}, 1)" title="Escalate">⬆️</button>
                    <button class="btn-icon" onclick="changeSeverity(${i.id}, -1)" title="De-escalate">⬇️</button>
                    <button class="btn-icon btn-resolve" onclick="resolveIncident(${i.id})">✅ END</button>
                </div>
            </div>
            <div style="font-size:0.7rem; color:var(--text-dim); margin-top:5px;">${i.desc || 'No description'}</div>
            <div style="font-size:0.6rem; margin-top:5px; color:var(--accent)">Analyst: ${i.analyst} | Started: ${i.startTime}</div>
        </div>
    `).join('');
}

function renderTopBanner() {
    const container = document.getElementById('critical-banner-container');
    const criticals = activeIncidents.filter(i => i.sev >= 4);
    
    if(criticals.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = criticals.map(i => `
        <div class="critical-banner">
            <div>🚨 CRITICAL ALERT (#INC-${i.id}) | ${i.client} | SEV ${i.sev}</div>
            <div style="font-size:0.8rem; font-weight:400;">Analyst: ${i.analyst} | Desc: ${i.desc.substring(0,50)}...</div>
        </div>
    `).join('');
}

function renderClosedLogs() {
    const list = document.getElementById('closed-incident-list');
    if(closedIncidents.length === 0) {
        list.innerHTML = `<p style="color:var(--text-dim); text-align:center; padding:10px;">No resolved incidents yet.</p>`;
        return;
    }

    list.innerHTML = closedIncidents.map(i => `
        <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding:5px 0; display:flex; justify-content:space-between;">
            <div><span style="color:${getSevColor(i.sev)}">●</span> <b>#INC-${i.id}</b> ${i.client}</div>
            <div style="color:var(--text-dim);">${i.startTime} - ${i.endTime}</div>
        </div>
    `).join('');
}

// Chart Logic (Dynamic based on Closed Incidents)
function initChart() {
    const ctx = document.getElementById('shiftChart').getContext('2d');
    shiftChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sev 1', 'Sev 2', 'Sev 3', 'Sev 4', 'Sev 5'],
            datasets: [{ 
                label: 'Resolved Incidents', 
                data: [0, 0, 0, 0, 0], 
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'] 
            }]
        },
        options: { 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } }
        }
    });
}

function updateChartData() {
    if(!shiftChartInstance) return;
    const counts = [0, 0, 0, 0, 0];
    closedIncidents.forEach(inc => {
        if(inc.sev >= 1 && inc.sev <= 5) {
            counts[inc.sev - 1]++;
        }
    });
    shiftChartInstance.data.datasets[0].data = counts;
    shiftChartInstance.update();
}

// --- QA LAB ---

function generateBugReportMarkdown() {
    const summaryEl = document.getElementById('bug-summary');
    const envEl = document.getElementById('bug-environment');
    const stepsEl = document.getElementById('bug-steps');
    const expectedEl = document.getElementById('bug-expected');
    const actualEl = document.getElementById('bug-actual');
    const logsEl = document.getElementById('bug-logs');
    const outEl = document.getElementById('bug-md-output');
    if (!outEl) return;

    const summary = (summaryEl?.value || '').trim() || 'Bug report';
    const env = (envEl?.value || '').trim();
    const steps = (stepsEl?.value || '').trim();
    const expected = (expectedEl?.value || '').trim();
    const actual = (actualEl?.value || '').trim();
    const logs = (logsEl?.value || '').trim();

    const md = `# ${summary}

## Environment
${env || '_Not specified_'}

## Steps to reproduce
${steps || '_Not provided_'}

## Expected result
${expected || '_Not provided_'}

## Actual result
${actual || '_Not provided_'}

## Logs / evidence
\`\`\`text
${logs || '(none)'}
\`\`\`

---
_Generated from SOC Command Center — QA Lab_
`;
    outEl.value = md;
    showNocToast('Bug report generated');
}

function copyBugReportOutput() {
    const outEl = document.getElementById('bug-md-output');
    if (!outEl || !outEl.value.trim()) {
        showNocToast('Generate output first');
        return;
    }
    copyTextToClipboard(outEl.value);
}

function qaKvRow(label, value) {
    const v = value == null || value === '' ? '—' : String(value);
    return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(v)}</dd>`;
}

function renderAdvancedRandomHtml(d) {
    const p = d.person || {};
    const a = d.addresses || {};
    const ph = d.phones || {};
    const dev = d.device || {};
    const models = Array.isArray(dev.model_codes) ? dev.model_codes.join(', ') : '';

    return `
        <div class="qa-advanced-block"><h4>Person</h4><dl class="qa-kv">
            ${qaKvRow('Full name', p.full_name)}
            ${qaKvRow('Email', p.email)}
            ${qaKvRow('Job title', p.job_title)}
        </dl></div>
        <div class="qa-advanced-block"><h4>Addresses</h4><dl class="qa-kv">
            ${qaKvRow('Israel', a.israel)}
            ${qaKvRow('International', a.international)}
        </dl></div>
        <div class="qa-advanced-block"><h4>Phones</h4><dl class="qa-kv">
            ${qaKvRow('Israel (local)', ph.israel_mobile_local)}
            ${qaKvRow('Israel (E.164)', ph.israel_mobile_e164)}
            ${qaKvRow('International sample', ph.international_sample)}
        </dl></div>
        <div class="qa-advanced-block"><h4>Device (synthetic QA profile)</h4><dl class="qa-kv">
            ${qaKvRow('Market name', dev.market_name)}
            ${qaKvRow('Model codes', models)}
            ${qaKvRow('Codename', dev.codename)}
            ${qaKvRow('Android', dev.android_version)}
            ${qaKvRow('API level', dev.api_level)}
            ${qaKvRow('OS / skin', dev.os_skin)}
            ${qaKvRow('Chipset', dev.chipset)}
            ${qaKvRow('Display', dev.display)}
            ${qaKvRow('RAM', dev.ram)}
            ${qaKvRow('Fake IMEI (15 digits)', dev.fake_imei)}
            ${qaKvRow('android_id', dev.android_id)}
        </dl></div>
    `;
}

async function fetchAdvancedRandomData() {
    const out = document.getElementById('qa-advanced-output');
    if (!out) return;
    out.innerHTML = '<p style="color:var(--text-dim)">Loading…</p>';
    try {
        const data = await fetchApiJson('qa/advanced-random');
        out.innerHTML = renderAdvancedRandomHtml(data);
    } catch (e) {
        const msg = escapeHtml(String(e.message || e));
        const urls = e.attemptedUrls || buildApiUrls('qa/advanced-random');
        const tried = urls.map((u) => `<code style="word-break:break-all;display:block;margin:4px 0;">${escapeHtml(u)}</code>`).join('');
        out.innerHTML = `<p style="color:var(--red)">Request failed: ${msg}</p>
            <p style="font-size:0.72rem;color:var(--text-dim);margin-top:10px;line-height:1.5;">Tried (in order):${tried}</p>
            <p style="font-size:0.72rem;color:var(--text-dim);margin-top:8px;">If you use Docker: run <code>docker compose up -d</code> and rebuild the frontend once so nginx proxies <code>/api</code> to the backend: <code>docker compose build frontend && docker compose up -d</code></p>`;
    }
}

function renderDeviceMatchCard(m) {
    const codes = Array.isArray(m.model_codes) ? m.model_codes.join(', ') : '';
    return `
        <div class="qa-device-card">
            <h4>${escapeHtml(m.market_name || 'Device')}</h4>
            <dl class="qa-kv">
                ${qaKvRow('Codename', m.codename)}
                ${qaKvRow('Android version', m.android_version)}
                ${qaKvRow('API level', m.api_level)}
                ${qaKvRow('OS / skin', m.os_skin)}
                ${qaKvRow('Chipset', m.chipset)}
                ${qaKvRow('Display', m.display)}
                ${qaKvRow('RAM', m.ram)}
                ${qaKvRow('Model codes', codes)}
            </dl>
        </div>
    `;
}

async function lookupDeviceInfo() {
    const input = document.getElementById('device-search-q');
    const out = document.getElementById('qa-device-results');
    if (!input || !out) return;

    const q = input.value.trim();
    if (!q) {
        showNocToast('Enter a device query');
        return;
    }

    out.innerHTML = '<p style="color:var(--text-dim)">Searching…</p>';
    try {
        const data = await fetchApiJson(`qa/device-lookup?q=${encodeURIComponent(q)}`);
        const matches = data.matches || [];
        if (matches.length === 0) {
            out.innerHTML = '<p style="color:var(--text-dim)">No matches. Try e.g. <b>Pixel 7</b>, <b>Galaxy S23</b>, or <b>SM-S911B</b>.</p>';
            return;
        }
        out.innerHTML = matches.map(renderDeviceMatchCard).join('');
    } catch (e) {
        const msg = escapeHtml(String(e.message || e));
        const urls = e.attemptedUrls || buildApiUrls(`qa/device-lookup?q=${encodeURIComponent(q)}`);
        const tried = urls.map((u) => `<code style="word-break:break-all;display:block;margin:4px 0;">${escapeHtml(u)}</code>`).join('');
        out.innerHTML = `<p style="color:var(--red)">Request failed: ${msg}</p>
            <p style="font-size:0.72rem;color:var(--text-dim);margin-top:10px;">Tried (in order):${tried}</p>`;
    }
}

function toggleTheme() {
    const b = document.body;
    b.setAttribute('data-theme', b.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

const SCRATCHPAD_BODY_KEY = 'soc-scratchpad-body';
const SCRATCHPAD_EXPAND_KEY = 'soc-scratchpad-expanded';
const SCRATCHPAD_HIDDEN_KEY = 'soc-scratchpad-hidden';

function scratchpadInit() {
    const ta = document.getElementById('scratchpad-ta');
    const root = document.getElementById('scratchpad-root');
    const fab = document.getElementById('scratchpad-fab');
    if (!ta || !root || !fab) return;

    ta.value = localStorage.getItem(SCRATCHPAD_BODY_KEY) || '';

    if (localStorage.getItem(SCRATCHPAD_HIDDEN_KEY) === '1') {
        root.style.display = 'none';
        fab.style.display = 'flex';
    }

    if (localStorage.getItem(SCRATCHPAD_EXPAND_KEY) === '1') {
        root.classList.add('scratchpad--expanded');
        const btn = document.getElementById('scratchpad-expand-btn');
        if (btn) {
            btn.textContent = '⤡';
            btn.setAttribute('aria-expanded', 'true');
        }
    }

    let saveTimer;
    const persist = () => localStorage.setItem(SCRATCHPAD_BODY_KEY, ta.value);
    ta.addEventListener('input', () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(persist, 400);
    });
    ta.addEventListener('blur', persist);
}

function scratchpadToggleExpand() {
    const root = document.getElementById('scratchpad-root');
    const btn = document.getElementById('scratchpad-expand-btn');
    if (!root) return;
    const exp = root.classList.toggle('scratchpad--expanded');
    localStorage.setItem(SCRATCHPAD_EXPAND_KEY, exp ? '1' : '0');
    if (btn) {
        btn.textContent = exp ? '⤡' : '⤢';
        btn.setAttribute('aria-expanded', exp ? 'true' : 'false');
    }
}

function scratchpadMinimize() {
    const root = document.getElementById('scratchpad-root');
    const fab = document.getElementById('scratchpad-fab');
    if (root) root.style.display = 'none';
    if (fab) fab.style.display = 'flex';
    localStorage.setItem(SCRATCHPAD_HIDDEN_KEY, '1');
}

function scratchpadRestore() {
    const root = document.getElementById('scratchpad-root');
    const fab = document.getElementById('scratchpad-fab');
    if (fab) fab.style.display = 'none';
    if (root) root.style.display = '';
    localStorage.setItem(SCRATCHPAD_HIDDEN_KEY, '0');
}

// --- NOC TOOLS: canned responses, log formatter, diff ---

const CANNED_RESPONSES = [
    { category: 'Escalation', title: 'Investigation in progress', body: 'Hi team — we are actively investigating elevated error rates on the affected service and will post updates every 30 minutes.' },
    { category: 'Escalation', title: 'Tier 2 handoff', body: 'Escalating to Tier 2: we need assistance with database connectivity / timeouts observed since the incident start. Latest logs attached.' },
    { category: 'Escalation', title: 'Customer comms hold', body: 'We are holding external communications until we confirm blast radius and have a clear mitigation path. Internal updates continue in this thread.' },
    { category: 'Waiting for customer', title: 'Awaiting confirmation', body: 'Waiting on customer confirmation for maintenance window / credentials / repro steps. We will proceed as soon as we hear back.' },
    { category: 'Waiting for customer', title: 'Logs provided', body: 'We have provided the requested logs and tracer IDs; pending customer response to continue troubleshooting.' },
    { category: 'Waiting for customer', title: 'Need access', body: 'Blocked on VPN / admin access to the target environment. Please grant access or designate a contact who can run the commands on our behalf.' },
    { category: 'Resolved', title: 'Resolved — RCA', body: 'Incident resolved — root cause was identified and remediated. Monitoring is stable; we are closing the ticket. Summary will follow in the postmortem doc.' },
    { category: 'Resolved', title: 'Resolved — false positive', body: 'False positive after rule tuning / data correction; no customer impact. Alert thresholds updated to prevent recurrence.' },
    { category: 'Resolved', title: 'Workaround in place', body: 'Service restored via workaround; permanent fix tracked under CHG-____. Thank you for your patience.' }
];

const DIFF_SAMPLE_LEFT = `2026-04-11T10:00:01Z INFO worker-1 job=start id=42
2026-04-11T10:00:02Z DEBUG db pool acquired
2026-04-11T10:00:03Z WARN retry attempt=1 upstream=payments
2026-04-11T10:00:05Z ERROR upstream timeout partner=ACME code=504
{"status":"degraded","region":"eu-west"}`;

const DIFF_SAMPLE_RIGHT = `2026-04-11T10:00:01Z INFO worker-1 job=start id=42
2026-04-11T10:00:02Z DEBUG db pool acquired
2026-04-11T10:00:03Z FAIL health check connector=payments
2026-04-11T10:00:05Z ERROR upstream TIMEOUT partner=ACME code=504
{"status":"down","region":"eu-west","failures":3}`;

let lastFormattedLogPlain = '';

function showNocToast(message) {
    const el = document.getElementById('noc-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(showNocToast._t);
    showNocToast._t = setTimeout(() => el.classList.remove('visible'), 2000);
}

function copyTextToClipboard(text) {
    const done = () => showNocToast('Copied to clipboard');
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopyText(text, done));
    } else {
        fallbackCopyText(text, done);
    }
}

function fallbackCopyText(text, onDone) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
    } catch (_) { /* ignore */ }
    document.body.removeChild(ta);
    if (onDone) onDone();
}

const LINUX_SNIPPETS = [
    {
        title: 'Navigation & Directory Management',
        items: [
            { desc: 'Print current directory', cmd: 'pwd' },
            { desc: 'List all files with details (including hidden)', cmd: 'ls -la' },
            { desc: 'Go back to the previous directory', cmd: 'cd -' },
            { desc: 'Create a directory path (including parents)', cmd: 'mkdir -p /path/to/folder' }
        ]
    },
    {
        title: 'File Operations',
        items: [
            { desc: 'Create an empty file', cmd: 'touch filename.ext' },
            { desc: 'View file content', cmd: 'cat filename.txt' },
            { desc: 'Find a file by name in current directory', cmd: 'find . -name "filename"' },
            { desc: 'Remove a directory and its contents', cmd: 'rm -rf /path/to/folder', danger: true }
        ]
    },
    {
        title: 'Logs & Troubleshooting',
        items: [
            { desc: 'Watch a log file in real-time', cmd: 'tail -f /var/log/syslog' },
            { desc: 'Search for a specific word ("error") in a file', cmd: 'grep -i "error" filename.log' },
            { desc: 'Search recursively for a word in all files', cmd: 'grep -ir "error" /path/to/search/' },
            { desc: 'View system logs with errors (systemd)', cmd: 'journalctl -xe' },
            { desc: 'Check disk space (human-readable)', cmd: 'df -h' },
            { desc: 'Check RAM usage (megabytes)', cmd: 'free -m' }
        ]
    },
    {
        title: 'SSH & Network',
        items: [
            { desc: 'Connect to a remote server', cmd: 'ssh user@hostname_or_ip' },
            { desc: 'Copy a file to a remote server', cmd: 'scp file.txt user@hostname:/path/to/destination' },
            { desc: 'Check open ports and listening services (modern ss; legacy: netstat -tulnp)', cmd: 'ss -tulnp' },
            { desc: 'Test network connectivity', cmd: 'ping google.com' }
        ]
    },
    {
        title: 'Permissions & Ownership',
        items: [
            { desc: 'Make a script executable', cmd: 'chmod +x script.sh' },
            { desc: 'Set directory permissions to 755', cmd: 'chmod 755 directory_name' },
            { desc: 'Change file owner and group', cmd: 'chown user:group filename' }
        ]
    }
];

function renderLinuxSnippets() {
    const mount = document.getElementById('linux-snippets-mount');
    if (!mount) return;
    mount.innerHTML = LINUX_SNIPPETS.map((cat) => `
        <details class="snip-cat" open>
            <summary>${escapeHtml(cat.title)}</summary>
            <div class="snip-list">
                ${cat.items.map((it) => {
        const danger = it.danger ? ' snip-row--danger' : '';
        const badge = it.danger ? '<span class="snip-warn-badge">Destructive</span>' : '';
        const safeCmd = escapeHtml(it.cmd);
        return `
                <div class="snip-row${danger}">
                    <div class="snip-row-main">
                        <p class="snip-desc">${escapeHtml(it.desc)}${badge}</p>
                        <code class="snip-code">${safeCmd}</code>
                    </div>
                    <button type="button" class="snip-copy-btn" data-cmd="${safeCmd}" onclick="copyLinuxSnippet(this)" title="Copy command" aria-label="Copy command to clipboard">
                        <span class="snip-copy-ic" aria-hidden="true">📋</span>
                    </button>
                </div>`;
    }).join('')}
            </div>
        </details>`).join('');
}

function copyLinuxSnippet(btn) {
    const cmd = btn.dataset.cmd;
    if (!cmd) return;
    copyTextToClipboard(cmd);
    const ic = btn.querySelector('.snip-copy-ic');
    if (!ic) return;
    const prev = ic.textContent;
    ic.textContent = '✓';
    btn.classList.add('snip-copy-btn--done');
    btn.setAttribute('aria-label', 'Copied');
    btn.disabled = true;
    clearTimeout(btn._snipFlash);
    btn._snipFlash = setTimeout(() => {
        ic.textContent = prev;
        btn.classList.remove('snip-copy-btn--done');
        btn.setAttribute('aria-label', 'Copy command to clipboard');
        btn.disabled = false;
    }, 2000);
}

/** IT Library — A–Z (strict order); external doc links */
const LIBRARY_GUIDES = [
    { letter: 'A', title: 'AWS EC2 Troubleshooting Guide', icon: '☁️', href: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/TroubleshootingInstances.html' },
    { letter: 'B', title: 'Bash Scripting Basics', icon: '💻', href: 'https://linuxhandbook.com/bash-basics/' },
    { letter: 'C', title: 'Cisco CCNA Routing Protocols Cheat Sheet', icon: '🔀', href: 'https://www.geeksforgeeks.org/routing-protocols-in-computer-networks/' },
    { letter: 'D', title: 'Docker Networking Explained', icon: '🐳', href: 'https://docs.docker.com/network/' },
    { letter: 'E', title: 'Elasticsearch Query Guide', icon: '🔍', href: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html' },
    { letter: 'F', title: 'Firewall (pfSense) Configuration Setup', icon: '🛡️', href: 'https://docs.netgate.com/pfsense/en/latest/firewall/index.html' },
    { letter: 'G', title: 'Git Best Practices & Reset Guide', icon: '🌿', href: 'https://www.atlassian.com/git/tutorials/comparing-workflows' },
    { letter: 'H', title: 'HAProxy Load Balancing Tutorial', icon: '⚖️', href: 'https://www.haproxy.com/blog/the-four-essential-sections-of-an-haproxy-configuration' },
    { letter: 'I', title: 'IPv4 Subnetting Made Easy', icon: '🌐', href: 'https://networklessons.com/ipv4/subnetting-in-binary' },
    { letter: 'J', title: 'Jenkins CI/CD Pipeline Setup', icon: '🏗️', href: 'https://www.jenkins.io/doc/book/pipeline/' },
    { letter: 'K', title: 'Kubernetes Crash Course for Beginners', icon: '☸️', href: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/' },
    { letter: 'L', title: 'Linux File Permissions (chmod/chown)', icon: '📁', href: 'https://www.redhat.com/sysadmin/linux-file-permissions-explained' },
    { letter: 'M', title: 'Microsoft Active Directory Best Practices', icon: '🪟', href: 'https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory' },
    { letter: 'N', title: 'Nginx Reverse Proxy Configuration', icon: '🔧', href: 'https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/' },
    { letter: 'O', title: 'OpenVPN Server Installation Guide', icon: '🔐', href: 'https://www.digitalocean.com/community/tutorials/how-to-set-up-and-configure-an-openvpn-server-on-ubuntu-22-04' },
    { letter: 'P', title: 'PowerShell Scripting for Sysadmins', icon: '⚡', href: 'https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/01-getting-started' },
    { letter: 'Q', title: 'QEMU/KVM Virtualization Guide', icon: '🖥️', href: 'https://ubuntu.com/server/docs/virtualization-qemu' },
    { letter: 'R', title: 'RAID Configurations Explained (0, 1, 5, 10)', icon: '💽', href: 'https://www.prepressure.com/library/technology/raid' },
    { letter: 'S', title: "SSL/TLS Certificate Installation (Let's Encrypt)", icon: '🔒', href: 'https://certbot.eff.org/' },
    { letter: 'T', title: 'Terraform State Management', icon: '🏔️', href: 'https://developer.hashicorp.com/terraform/language/state' },
    { letter: 'U', title: 'Ubuntu Server Hardening Guide', icon: '🐧', href: 'https://ubuntu.com/security/certifications/docs/2004/stig' },
    { letter: 'V', title: 'VMware vSphere Performance Troubleshooting', icon: '📊', href: 'https://docs.vmware.com/en/VMware-vSphere/7.0/com.vmware.vsphere.monitoring.doc/GUID-D4BA80A8-9BB6-4A00-BA25-DC9B95CF087A.html' },
    { letter: 'W', title: 'Windows Server 2022 Group Policy Basics', icon: '🪟', href: 'https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/group-policy-overview' },
    { letter: 'X', title: 'XSS & CSRF Vulnerabilities Explained', icon: '🔓', href: 'https://owasp.org/www-community/attacks/xss/' },
    { letter: 'Y', title: 'YAML Syntax Cheat Sheet', icon: '📄', href: 'https://learnxinyminutes.com/docs/yaml/' },
    { letter: 'Z', title: 'Zabbix Monitoring Setup Guide', icon: '📡', href: 'https://www.zabbix.com/documentation/current/en/manual/quickstart/login' }
];

function renderLibrary() {
    const grid = document.getElementById('library-grid');
    if (!grid) return;
    grid.innerHTML = LIBRARY_GUIDES.map((g, i) => {
        const hue = (i * 14) % 360;
        const searchBlob = `${g.letter} ${g.title}`.toLowerCase();
        return `
        <article class="lib-book" style="--lib-h: ${hue}" role="listitem" data-search="${escapeHtml(searchBlob).replace(/"/g, '&quot;')}">
            <span class="lib-watermark" aria-hidden="true">${escapeHtml(g.letter)}</span>
            <div class="lib-book-inner">
                <div class="lib-top">
                    <span class="lib-letter">${escapeHtml(g.letter)}</span>
                    <span class="lib-icon" aria-hidden="true">${g.icon}</span>
                </div>
                <h3 class="lib-book-title">${escapeHtml(g.title)}</h3>
                <div class="lib-book-footer">
                    <a class="lib-read" href="${escapeHtml(g.href)}" target="_blank" rel="noopener noreferrer">Read Guide</a>
                </div>
            </div>
        </article>`;
    }).join('');
    libraryFilter(document.getElementById('lib-search')?.value || '');
}

function libraryFilter(query) {
    const q = (query || '').trim().toLowerCase();
    const books = document.querySelectorAll('#library-grid .lib-book');
    let visible = 0;
    books.forEach((el) => {
        const hay = (el.getAttribute('data-search') || '').toLowerCase();
        const show = !q || hay.includes(q);
        el.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    const empty = document.getElementById('lib-empty');
    if (empty) empty.classList.toggle('lib-empty--visible', books.length > 0 && visible === 0);
}

function renderCannedResponses() {
    const mount = document.getElementById('canned-responses-mount');
    if (!mount) return;

    const byCat = {};
    CANNED_RESPONSES.forEach((t, idx) => {
        if (!byCat[t.category]) byCat[t.category] = [];
        byCat[t.category].push({ ...t, idx });
    });

    const order = ['Escalation', 'Waiting for customer', 'Resolved'];
    const html = order.filter(c => byCat[c]).map(cat => {
        const items = byCat[cat].map(t => `
            <div class="noc-template">
                <div>
                    <div class="noc-template-title">${escapeHtml(t.title)}</div>
                    <div class="noc-template-body">${escapeHtml(t.body)}</div>
                </div>
                <button type="button" class="btn btn-copy" onclick="copyCannedTemplate(${t.idx})">Copy</button>
            </div>
        `).join('');
        return `<div class="noc-cat"><div class="noc-cat-title">${escapeHtml(cat)}</div>${items}</div>`;
    }).join('');

    mount.innerHTML = html || '<p style="color:var(--text-dim);">No templates.</p>';
}

function copyCannedTemplate(index) {
    const t = CANNED_RESPONSES[index];
    if (t) copyTextToClipboard(t.body);
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function cleanLogText(raw) {
    let s = raw.replace(/\x1b\[[0-9;]*m/g, '');
    const lines = s.split(/\r?\n/).map(line => line.replace(/\s+$/g, ''));
    s = lines.join('\n').replace(/\n{3,}/g, '\n\n');
    return s.trim();
}

/** ISO / common log times — run on escaped text only */
function highlightLogTimestamps(escapedLine) {
    const ts = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?|\d{2}\/\d{2}\/\d{4}[,\s]\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2} \d{4} \d{1,2}:\d{2}:\d{2}\b|\[\d{2}:\d{2}:\d{2}(?:\.\d+)?\]|\d{2}:\d{2}:\d{2}\.\d{3,6}(?=\s|$|,|;|\]|")/gi;
    return escapedLine.replace(ts, (m) => `<span class="log-time">${m}</span>`);
}

/** user=, login:, uid=… — class names avoid "user" so later regexes do not match HTML we add */
function highlightLogAccounts(escapedLine) {
    let s = escapedLine;
    s = s.replace(/\b(uid=\d+\([^)]{0,48}\))/gi, '<span class="log-acct-line">$1</span>');
    s = s.replace(/\b(?:user|username|login|account|actor)(?:\s*[=:]\s*|\s+is\s+)([^\s<&]{1,56})/gi, (full, val) => {
        const pre = full.slice(0, full.length - val.length);
        return `${pre}<span class="log-acct">${val}</span>`;
    });
    s = s.replace(/\b(?:connected|authenticated)(?:\s+as)?\s*:?\s*([A-Za-z0-9_.@\\/-]{1,40})/gi, (full, val) => {
        const pre = full.slice(0, full.length - val.length);
        return `${pre}<span class="log-acct">${val}</span>`;
    });
    return s;
}

/**
 * One pass for severity words — avoids re-matching inside class names (old log-kw-info matched "INFO").
 */
function highlightLogSeverityWords(escapedLine) {
    const crit = new Set(['TIMEOUT', 'TIME_OUT', 'EXCEPTION', 'CRITICAL', 'FAILED', 'FAILURE', 'UNAVAILABLE', 'REFUSED', 'DENIED', 'FORBIDDEN', 'ABORTED', 'PANIC', 'STACKTRACE', 'FATAL', 'ERROR', 'FAIL', 'INTERNAL', 'INTERNAL_ERROR', 'NOT_FOUND', 'DEADLINE_EXCEEDED', 'CONNECTION_REFUSED', 'ACCESS_DENIED']);
    const warn = new Set(['WARN', 'WARNING', 'RETRY', 'RETRIES', 'DEGRADED', 'SLOW', 'TIMEOUTS']);
    const ok = new Set(['SUCCESS', 'OK', 'COMPLETED', 'PASSED', 'HEALTHY', 'READY']);
    const dbg = new Set(['DEBUG', 'TRACE', 'VERBOSE', 'INFO', 'STARTED', 'SKIPPED']);

    const re = /(?<![A-Za-z0-9_])(CONNECTION_REFUSED|ACCESS_DENIED|INTERNAL_ERROR|DEADLINE_EXCEEDED|TIME_OUT|TIMEOUT|EXCEPTION|CRITICAL|FAILED|FAILURE|UNAVAILABLE|REFUSED|DENIED|FORBIDDEN|NOT_FOUND|INTERNAL|ABORTED|PANIC|STACKTRACE|FATAL|ERROR|FAIL|WARN|WARNING|RETRY|RETRIES|DEGRADED|SLOW|SUCCESS|OK|COMPLETED|PASSED|HEALTHY|READY|DEBUG|TRACE|VERBOSE|INFO|STARTED|SKIPPED|503|502|500|404|408|429)(?![A-Za-z0-9_])/gi;

    return escapedLine.replace(re, (m) => {
        const u = m.toUpperCase();
        if (/^\d{3}$/.test(u)) {
            if (u === '500' || u === '502' || u === '503' || u === '408') return `<span class="log-sev-crit">${m}</span>`;
            return `<span class="log-sev-warn">${m}</span>`;
        }
        if (crit.has(u)) return `<span class="log-sev-crit">${m}</span>`;
        if (warn.has(u)) return `<span class="log-sev-warn">${m}</span>`;
        if (ok.has(u)) return `<span class="log-sev-ok">${m}</span>`;
        return `<span class="log-sev-dbg">${m}</span>`;
    });
}

function formatLogLineHtml(rawLine) {
    let e = escapeHtml(rawLine);
    e = highlightLogTimestamps(e);
    e = highlightLogAccounts(e);
    e = highlightLogSeverityWords(e);

    const hot = /\b(FATAL|CRITICAL|ERROR|FAIL|FAILED|TIMEOUT|TIME_OUT|EXCEPTION|PANIC|ABORTED|UNAVAILABLE|REFUSED|DENIED|50[023]|503)\b/i.test(rawLine);
    const warm = /\b(WARN|WARNING|RETRY|DEGRADED|404|429|408)\b/i.test(rawLine);
    let rowClass = 'log-line';
    if (hot) rowClass += ' log-line-hot';
    else if (warm) rowClass += ' log-line-warn';

    return `<div class="${rowClass}">${e || '\u00a0'}</div>`;
}

function formatLogOutput() {
    const input = document.getElementById('log-raw-input');
    const out = document.getElementById('log-formatted-output');
    if (!input || !out) return;

    const plain = cleanLogText(input.value);
    lastFormattedLogPlain = plain;
    if (!plain) {
        out.style.display = 'none';
        out.innerHTML = '';
        showNocToast('Nothing to format');
        return;
    }

    const lines = plain.split(/\r?\n/);
    out.className = 'log-formatted-pre log-viewport';
    out.innerHTML = lines.map(formatLogLineHtml).join('');
    out.style.display = 'block';
}

function clearLogFormatter() {
    const input = document.getElementById('log-raw-input');
    const out = document.getElementById('log-formatted-output');
    if (input) input.value = '';
    if (out) {
        out.innerHTML = '';
        out.style.display = 'none';
    }
    lastFormattedLogPlain = '';
}

function copyLastFormattedLog() {
    if (!lastFormattedLogPlain) {
        showNocToast('Format logs first');
        return;
    }
    copyTextToClipboard(lastFormattedLogPlain);
}

function diffLinesLcs(leftLines, rightLines) {
    const m = leftLines.length;
    const n = rightLines.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (leftLines[i - 1] === rightLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    const ops = [];
    let i = m;
    let j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
            ops.unshift({ type: 'same', text: leftLines[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            ops.unshift({ type: 'add', text: rightLines[j - 1] });
            j--;
        } else {
            ops.unshift({ type: 'del', text: leftLines[i - 1] });
            i--;
        }
    }
    return ops;
}

function runDiffChecker() {
    const leftEl = document.getElementById('diff-left');
    const rightEl = document.getElementById('diff-right');
    const out = document.getElementById('diff-output');
    if (!leftEl || !rightEl || !out) return;

    const leftLines = leftEl.value.split(/\r?\n/);
    const rightLines = rightEl.value.split(/\r?\n/);
    const ops = diffLinesLcs(leftLines, rightLines);

    const rows = ops.map(op => {
        const cls = op.type === 'del' ? 'diff-line-del' : op.type === 'add' ? 'diff-line-add' : 'diff-line-same';
        return `<div class="diff-line ${cls}">${escapeHtml(op.text)}</div>`;
    }).join('');

    out.innerHTML = rows || '<div class="diff-line diff-line-same" style="padding:12px;">Both sides are empty.</div>';
    out.style.display = 'block';
}

function loadDiffSample(which) {
    const left = document.getElementById('diff-left');
    const right = document.getElementById('diff-right');
    if (!left || !right) return;

    if (which === 'a') {
        left.value = DIFF_SAMPLE_LEFT;
        showNocToast('Sample loaded (left)');
    } else if (which === 'b') {
        right.value = DIFF_SAMPLE_RIGHT;
        showNocToast('Sample loaded (right)');
    } else if (which === 'pair') {
        left.value = DIFF_SAMPLE_LEFT;
        right.value = DIFF_SAMPLE_RIGHT;
        showNocToast('Demo pair loaded');
        runDiffChecker();
    }
}

function prettifyDiffJson() {
    const left = document.getElementById('diff-left');
    const right = document.getElementById('diff-right');
    if (!left || !right) return;

    const fmt = (raw) => {
        const t = raw.trim();
        if (!t) return { ok: true, out: raw };
        try {
            return { ok: true, out: JSON.stringify(JSON.parse(t), null, 2) };
        } catch {
            return { ok: false, out: raw };
        }
    };

    const l = fmt(left.value);
    const r = fmt(right.value);
    const bad = [];
    if (l.ok) left.value = l.out;
    else bad.push('left');
    if (r.ok) right.value = r.out;
    else bad.push('right');

    if (bad.length === 0) showNocToast('JSON prettified');
    else if (bad.length === 2) showNocToast('Both sides invalid JSON');
    else showNocToast(`Invalid JSON (${bad[0]})`);
}

// --- IT QUICK TOOLS (client-side; Web Crypto) ---

function qttFilterTools(query) {
    const q = (query || '').trim().toLowerCase();
    document.querySelectorAll('#qtt-catalog .qtt-section').forEach((section) => {
        let visible = 0;
        section.querySelectorAll('.qtt-card').forEach((card) => {
            const blob = ((card.getAttribute('data-qtt-search') || '') + ' ' + (card.querySelector('.qtt-name')?.textContent || '')).toLowerCase();
            const show = !q || blob.includes(q);
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        section.style.display = visible ? '' : 'none';
    });
}

function qttCloseTool() {
    const panel = document.getElementById('qtt-panel');
    const body = document.getElementById('qtt-panel-body');
    if (panel) panel.classList.remove('active');
    if (body) body.innerHTML = '';
    const cat = document.getElementById('qtt-catalog');
    if (cat) cat.style.display = '';
}

function qttOpenTool(toolId) {
    const panel = document.getElementById('qtt-panel');
    const title = document.getElementById('qtt-panel-title');
    const body = document.getElementById('qtt-panel-body');
    const cat = document.getElementById('qtt-catalog');
    if (!panel || !title || !body) return;

    cat.style.display = 'none';
    panel.classList.add('active');
    const qttTitles = {
        token: '🔑 Token generator',
        hash: '#️⃣ Hash text',
        crypto: '🔐 Encrypt / decrypt text',
        password: '🛡️ Password strength analyser',
        datetime: '🕐 Date-time converter',
        b64str: '📄 Base64 string encoder/decoder',
        b64file: '📎 Base64 file converter',
        ...(window.QTT_EXTRA_TITLES || {})
    };
    title.textContent = qttTitles[toolId] || 'Tool';

    const builders = {
        token: qttTplToken,
        hash: qttTplHash,
        crypto: qttTplCrypto,
        password: qttTplPassword,
        datetime: qttTplDatetime,
        b64str: qttTplB64Str,
        b64file: qttTplB64File,
        ...(window.QTT_EXTRA_BUILDERS || {})
    };
    body.innerHTML = (builders[toolId] || (() => '<p>Unknown tool</p>'))();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function qttBytesToB64(bytes) {
    let bin = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
}

function qttB64ToBytes(b64) {
    const clean = b64.replace(/\s/g, '');
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function qttUtf8ToB64(str) {
    const bytes = new TextEncoder().encode(str);
    return qttBytesToB64(bytes);
}

function qttB64ToUtf8(b64) {
    const bytes = qttB64ToBytes(b64);
    return new TextDecoder().decode(bytes);
}

function qttTplToken() {
    return `<p class="qtt-hint">Uses <code>crypto.getRandomValues</code>. Choose length and encoding.</p>
        <label>Length (bytes)</label>
        <input type="number" id="qtt-tok-len" value="32" min="8" max="512" step="1">
        <label>Encoding</label>
        <select id="qtt-tok-enc"><option value="hex">Hex</option><option value="b64url">Base64URL (no padding)</option></select>
        <div class="qtt-row">
            <button type="button" class="btn" onclick="qttGenToken()">Generate</button>
            <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-tok-out').value)">Copy</button>
        </div>
        <textarea id="qtt-tok-out" class="qtt-out" readonly placeholder="Output…"></textarea>`;
}

function qttGenToken() {
    const len = Math.min(512, Math.max(8, parseInt(document.getElementById('qtt-tok-len').value, 10) || 32));
    const enc = document.getElementById('qtt-tok-enc').value;
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    let out;
    if (enc === 'hex') {
        out = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    } else {
        const b64 = qttBytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        out = b64;
    }
    document.getElementById('qtt-tok-out').value = out;
    showNocToast('Token generated');
}

function qttTplHash() {
    return `<p class="qtt-hint">Hashing runs in your browser (SubtleCrypto). Large pastes may take a moment.</p>
        <label>Algorithm</label>
        <select id="qtt-hash-alg"><option value="SHA-256">SHA-256</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option><option value="SHA-1">SHA-1</option></select>
        <label>Input text</label>
        <textarea id="qtt-hash-in" placeholder="Text to hash…"></textarea>
        <div class="qtt-row">
            <button type="button" class="btn" onclick="qttHashRun()">Compute hash</button>
            <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-hash-out').value)">Copy hex</button>
        </div>
        <label>Hex digest</label>
        <textarea id="qtt-hash-out" class="qtt-out" readonly></textarea>`;
}

async function qttHashRun() {
    if (!window.crypto?.subtle) {
        showNocToast('Web Crypto not available');
        return;
    }
    const alg = document.getElementById('qtt-hash-alg').value;
    const text = document.getElementById('qtt-hash-in').value;
    const buf = await crypto.subtle.digest(alg, new TextEncoder().encode(text));
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    document.getElementById('qtt-hash-out').value = hex;
    showNocToast('Hash computed');
}

function qttTplCrypto() {
    return `<p class="qtt-hint">AES-256-GCM, key derived with PBKDF2-SHA-256 (150k iterations). Package prefix <code>QTT1</code> + Base64 payload (IV + salt + ciphertext).</p>
        <label>Plaintext</label>
        <textarea id="qtt-cry-plain" placeholder="Text to encrypt…"></textarea>
        <label>Password</label>
        <input type="password" id="qtt-cry-pass-e" autocomplete="new-password" placeholder="Passphrase">
        <div class="qtt-row">
            <button type="button" class="btn" onclick="qttCryptoEncrypt()">Encrypt</button>
        </div>
        <label>Encrypted package (copy this)</label>
        <textarea id="qtt-cry-out" class="qtt-out" placeholder="QTT1…"></textarea>
        <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">
        <label>Paste package to decrypt</label>
        <textarea id="qtt-cry-in" class="qtt-out" placeholder="QTT1…"></textarea>
        <label>Password</label>
        <input type="password" id="qtt-cry-pass-d" autocomplete="new-password" placeholder="Passphrase">
        <div class="qtt-row">
            <button type="button" class="btn" onclick="qttCryptoDecrypt()">Decrypt</button>
        </div>
        <label>Decrypted text</label>
        <textarea id="qtt-cry-dec-out" class="qtt-out" readonly></textarea>`;
}

async function qttDeriveKey(password, salt) {
    const enc = new TextEncoder();
    const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function qttCryptoEncrypt() {
    if (!window.crypto?.subtle) {
        showNocToast('Web Crypto not available');
        return;
    }
    const plain = document.getElementById('qtt-cry-plain').value;
    const password = document.getElementById('qtt-cry-pass-e').value;
    if (!password) {
        showNocToast('Enter a password');
        return;
    }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await qttDeriveKey(password, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
    const ctArr = new Uint8Array(ct);
    const pack = new Uint8Array(12 + 16 + ctArr.length);
    pack.set(iv, 0);
    pack.set(salt, 12);
    pack.set(ctArr, 28);
    document.getElementById('qtt-cry-out').value = `QTT1${qttBytesToB64(pack)}`;
    showNocToast('Encrypted');
}

async function qttCryptoDecrypt() {
    if (!window.crypto?.subtle) {
        showNocToast('Web Crypto not available');
        return;
    }
    const raw = document.getElementById('qtt-cry-in').value.trim();
    const password = document.getElementById('qtt-cry-pass-d').value;
    if (!raw.startsWith('QTT1')) {
        showNocToast('Package must start with QTT1');
        return;
    }
    if (!password) {
        showNocToast('Enter password');
        return;
    }
    try {
        const pack = qttB64ToBytes(raw.slice(4));
        if (pack.length < 28) throw new Error('Truncated');
        const iv = pack.slice(0, 12);
        const salt = pack.slice(12, 28);
        const ct = pack.slice(28);
        const key = await qttDeriveKey(password, salt);
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
        document.getElementById('qtt-cry-dec-out').value = new TextDecoder().decode(plainBuf);
        showNocToast('Decrypted');
    } catch {
        showNocToast('Decrypt failed (wrong password or corrupt data)');
        document.getElementById('qtt-cry-dec-out').value = '';
    }
}

const QTT_WEAK_PW = ['password', '123456', '12345678', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'iloveyou', 'sunshine', 'princess', 'football', 'master'];

function qttTplPassword() {
    return `<p class="qtt-hint">Heuristic score only — not a substitute for a breach database check.</p>
        <label>Password</label>
        <input type="password" id="qtt-pw-in" autocomplete="new-password" placeholder="Type a password…" oninput="qttPasswordAnalyze()">
        <div class="qtt-meter"><div id="qtt-pw-bar" style="width:0%;background:var(--red);"></div></div>
        <p id="qtt-pw-score" style="font-weight:800;font-size:0.9rem;">Score: —</p>
        <ul class="qtt-pw-list" id="qtt-pw-hints"></ul>`;
}

function qttPasswordAnalyze() {
    const pw = document.getElementById('qtt-pw-in').value;
    const bar = document.getElementById('qtt-pw-bar');
    const scoreEl = document.getElementById('qtt-pw-score');
    const hintsEl = document.getElementById('qtt-pw-hints');
    if (!pw) {
        bar.style.width = '0%';
        scoreEl.textContent = 'Score: —';
        hintsEl.innerHTML = '';
        return;
    }
    let score = 0;
    const hints = [];
    const len = pw.length;
    if (len >= 8) score += 15;
    if (len >= 12) score += 15;
    if (len >= 16) score += 10;
    if (/[a-z]/.test(pw)) score += 10;
    if (/[A-Z]/.test(pw)) score += 10;
    if (/\d/.test(pw)) score += 10;
    if (/[^A-Za-z0-9]/.test(pw)) score += 15;
    if (len < 8) hints.push('Use at least 8 characters (12+ recommended).');
    if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) hints.push('Mix upper and lower case.');
    if (!/\d/.test(pw)) hints.push('Add digits.');
    if (!/[^A-Za-z0-9]/.test(pw)) hints.push('Add symbols.');
    const lower = pw.toLowerCase();
    if (QTT_WEAK_PW.some((w) => lower.includes(w))) {
        score = Math.min(score, 35);
        hints.push('Avoid common words like "password" or "123456".');
    }
    if (/(.)\1{3,}/.test(pw)) hints.push('Avoid long repeated characters.');
    score = Math.min(100, score);
    bar.style.width = `${score}%`;
    bar.style.background = score < 40 ? 'var(--red)' : score < 70 ? 'var(--yellow)' : 'var(--green)';
    scoreEl.textContent = `Score: ${score} / 100`;
    hintsEl.innerHTML = hints.length ? hints.map((h) => `<li>${escapeHtml(h)}</li>`).join('') : '<li style="color:var(--green);">Looks reasonable for a basic check.</li>';
}

function qttTplDatetime() {
    return `<p class="qtt-hint">Paste ISO-8601, Unix seconds, or milliseconds. Also accepts numeric-only strings.</p>
        <label>Input</label>
        <textarea id="qtt-dt-in" placeholder="e.g. 2026-04-11T15:30:00Z  or  1712849400  or  1712849400000"></textarea>
        <div class="qtt-row">
            <button type="button" class="btn" onclick="qttDatetimeConvert()">Convert</button>
            <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-dt-out').textContent)">Copy all</button>
        </div>
        <pre id="qtt-dt-out" class="qtt-out" style="white-space:pre-wrap;min-height:120px;background:var(--bg);padding:12px;border-radius:8px;border:1px solid var(--border);"></pre>`;
}

function qttDatetimeConvert() {
    const raw = document.getElementById('qtt-dt-in').value.trim();
    const out = document.getElementById('qtt-dt-out');
    if (!raw) {
        out.textContent = '';
        showNocToast('Enter a value');
        return;
    }
    let d = null;
    if (/^\d{10,13}$/.test(raw)) {
        const n = parseInt(raw, 10);
        d = new Date(raw.length >= 13 ? n : n * 1000);
    } else {
        const parsed = Date.parse(raw);
        if (!Number.isNaN(parsed)) d = new Date(parsed);
    }
    if (!d || Number.isNaN(d.getTime())) {
        out.textContent = 'Could not parse. Try ISO-8601 or Unix epoch.';
        showNocToast('Parse failed');
        return;
    }
    const ms = d.getTime();
    const lines = [
        `ISO (UTC):     ${d.toISOString()}`,
        `Unix (ms):     ${ms}`,
        `Unix (s):      ${Math.floor(ms / 1000)}`,
        `Locale string: ${d.toString()}`,
        `UTC string:    ${d.toUTCString()}`
    ];
    out.textContent = lines.join('\n');
    showNocToast('Converted');
}

function qttTplB64Str() {
    return `<p class="qtt-hint">UTF-8 ↔ Base64. Whitespace in decoder input is ignored.</p>
        <label>Text</label>
        <textarea id="qtt-b64-in" placeholder="Plain text…"></textarea>
        <div class="qtt-row">
            <button type="button" class="btn" onclick="qttB64EncodeStr()">Encode → Base64</button>
            <button type="button" class="btn" style="background:var(--surface);color:var(--text-main);border:1px solid var(--border);" onclick="qttB64DecodeStr()">Decode ← Base64</button>
            <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-b64-out').value)">Copy output</button>
        </div>
        <label>Output</label>
        <textarea id="qtt-b64-out" class="qtt-out" placeholder="Result…"></textarea>`;
}

function qttB64EncodeStr() {
    const t = document.getElementById('qtt-b64-in').value;
    try {
        document.getElementById('qtt-b64-out').value = qttUtf8ToB64(t);
        showNocToast('Encoded');
    } catch {
        showNocToast('Encode failed');
    }
}

function qttB64DecodeStr() {
    const t = document.getElementById('qtt-b64-in').value;
    try {
        document.getElementById('qtt-b64-out').value = qttB64ToUtf8(t);
        showNocToast('Decoded');
    } catch {
        showNocToast('Invalid Base64 or not valid UTF-8');
    }
}

function qttTplB64File() {
    return `<p class="qtt-hint"><b>Encode:</b> pick a file → Base64 appears below. <b>Decode:</b> paste Base64, set filename, download.</p>
        <label>File → Base64</label>
        <input type="file" id="qtt-b64f-in" onchange="qttB64FileEncode(event)">
        <textarea id="qtt-b64f-out" class="qtt-out" style="min-height:100px;" readonly placeholder="Base64 of last file…"></textarea>
        <div class="qtt-row">
            <button type="button" class="btn btn-save" onclick="copyTextToClipboard(document.getElementById('qtt-b64f-out').value)">Copy Base64</button>
        </div>
        <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">
        <label>Base64 → file</label>
        <textarea id="qtt-b64f-dec" class="qtt-out" placeholder="Paste Base64…"></textarea>
        <label>Download filename</label>
        <input type="text" id="qtt-b64f-name" value="decoded.bin" placeholder="decoded.bin">
        <div class="qtt-row">
            <button type="button" class="btn" onclick="qttB64FileDecode()">Download file</button>
        </div>`;
}

function qttB64FileEncode(ev) {
    const f = ev.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
        const bytes = new Uint8Array(reader.result);
        document.getElementById('qtt-b64f-out').value = qttBytesToB64(bytes);
        showNocToast(`Encoded (${f.name})`);
    };
    reader.readAsArrayBuffer(f);
}

function qttB64FileDecode() {
    const b64 = document.getElementById('qtt-b64f-dec').value;
    const name = document.getElementById('qtt-b64f-name').value.trim() || 'decoded.bin';
    try {
        const bytes = qttB64ToBytes(b64);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
        showNocToast('Download started');
    } catch {
        showNocToast('Invalid Base64');
    }
}

// Excel Export (Now exports properly segregated data)
async function exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Active Incidents
    const sheetActive = workbook.addWorksheet('Active Incidents');
    sheetActive.addRow(['Ticket ID', 'Status', 'Analyst', 'Client', 'Severity', 'Start Time', 'Description']);
    activeIncidents.forEach(i => sheetActive.addRow([`INC-${i.id}`, 'OPEN', i.analyst, i.client, i.sev, i.startTime, i.desc]));
    
    // Sheet 2: Closed (Resolved) Incidents
    const sheetClosed = workbook.addWorksheet('Resolved Log');
    sheetClosed.addRow(['Ticket ID', 'Status', 'Analyst', 'Client', 'Severity', 'Start Time', 'End Time', 'Description']);
    closedIncidents.forEach(i => sheetClosed.addRow([`INC-${i.id}`, 'RESOLVED', i.analyst, i.client, i.sev, i.startTime, i.endTime, i.desc]));
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOC_Shift_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
    a.click();
}