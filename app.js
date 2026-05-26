// ====================================================================
// Bài Toán Vận Tải - Thuật Toán Thế Vị (MODI Method)
// ====================================================================

// ── STATE ──────────────────────────────────────────────────────────
let prob = null;   // { m, n, a, b, C }
let steps = [];
let cur = 0;
let playing = false;
let playTimer = null;
let speed = 1500;   // ms per step

// ── UTILITIES ───────────────────────────────────────────────────────
const cp = m => m.map(r => [...r]);
const nm = (r, c) => Array.from({ length: r }, () => Array(c).fill(null));
const fmt = v => v === null ? '—' : (Number.isInteger(v) ? String(v) : parseFloat(v.toFixed(4)).toString());
const ps = v => v >= 0 ? '+' + v : String(v);   // signed string

function calcObj(x, C, m, n) {
  let s = 0;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) s += x[i][j] * C[i][j];
  return s;
}

// ── ALGORITHM ───────────────────────────────────────────────────────

function northwestCorner(a0, b0, m, n) {
  const x = Array.from({ length: m }, () => Array(n).fill(0));
  const a = [...a0], b = [...b0];
  let i = 0, j = 0;
  while (i < m && j < n) {
    const v = Math.min(a[i], b[j]);
    x[i][j] = v;
    a[i] -= v; b[j] -= v;
    if (a[i] <= 1e-9 && b[j] <= 1e-9) {
      if (i < m - 1 && j < n - 1) i++;
      else if (i < m - 1) i++;
      else j++;
    } else if (a[i] <= 1e-9) i++;
    else j++;
  }
  return x;
}

function getBasis(x, m, n) {
  const b = [];
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (x[i][j] > 1e-9) b.push([i, j]);
  return b;
}

function padBasis(basis, m, n) {
  if (basis.length === m + n - 1) return basis.map(b => [...b]);
  const r = basis.map(b => [...b]);
  const s = new Set(r.map(([i, j]) => `${i},${j}`));
  for (let i = 0; i < m && r.length < m + n - 1; i++)
    for (let j = 0; j < n && r.length < m + n - 1; j++)
      if (!s.has(`${i},${j}`)) { r.push([i, j]); s.add(`${i},${j}`); }
  return r;
}

function computePotentials(basis, C, m, n) {
  const u = Array(m).fill(null), v = Array(n).fill(null);
  u[0] = 0;
  let ch = true;
  while (ch) {
    ch = false;
    for (const [i, j] of basis) {
      if (u[i] !== null && v[j] === null) { v[j] = C[i][j] - u[i]; ch = true; }
      if (v[j] !== null && u[i] === null) { u[i] = C[i][j] - v[j]; ch = true; }
    }
  }
  return { u, v };
}

function computeDeltas(u, v, C, basis, m, n) {
  const s = new Set(basis.map(([i, j]) => `${i},${j}`));
  const d = nm(m, n);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++)
    if (!s.has(`${i},${j}`) && u[i] !== null && v[j] !== null)
      d[i][j] = u[i] + v[j] - C[i][j];
  return d;
}

function findCycle(er, ec, basis) {
  function dfs(path, dir) {
    const [lr, lc] = path[path.length - 1];
    // Check close: even length >= 4
    if (path.length >= 4 && path.length % 2 === 0) {
      if (dir === 'H' && lc === ec) return [...path];
      if (dir === 'V' && lr === er) return [...path];
    }
    const nd = dir === 'H' ? 'V' : 'H';
    for (const [br, bc] of basis) {
      if (path.some(([pr, pc]) => pr === br && pc === bc)) continue;
      if (nd === 'H' && br === lr) {
        path.push([br, bc]);
        const r = dfs(path, 'H'); if (r) return r;
        path.pop();
      } else if (nd === 'V' && bc === lc) {
        path.push([br, bc]);
        const r = dfs(path, 'V'); if (r) return r;
        path.pop();
      }
    }
    return null;
  }
  // Try H-first
  for (const [br, bc] of basis) if (br === er) {
    const r = dfs([[er, ec], [br, bc]], 'H'); if (r) return r;
  }
  // Try V-first
  for (const [br, bc] of basis) if (bc === ec) {
    const r = dfs([[er, ec], [br, bc]], 'V'); if (r) return r;
  }
  return null;
}

// ── SOLVE ────────────────────────────────────────────────────────────

function solve(m, n, a, b, C) {
  const out = [];
  let x = northwestCorner(a, b, m, n);
  let basis = padBasis(getBasis(x, m, n), m, n);
  let obj = calcObj(x, C, m, n);

  // Step 0: initial
  out.push(mkStep({
    type: 'initial', iter: 0, x, basis, u: Array(m).fill(null), v: Array(n).fill(null),
    deltas: nm(m, n), enter: null, cycle: null, signs: null, theta: null, leaving: null, changed: [],
    enterDelta: null, prevObj: null, obj, m, n, a, b, C
  }));

  for (let iter = 1; iter <= 60; iter++) {
    // Potentials
    const { u, v } = computePotentials(basis, C, m, n);
    out.push(mkStep({
      type: 'potentials', iter, x, basis, u, v, deltas: nm(m, n),
      enter: null, cycle: null, signs: null, theta: null, leaving: null, changed: [],
      enterDelta: null, prevObj: null, obj, m, n, a, b, C
    }));

    // Deltas
    const deltas = computeDeltas(u, v, C, basis, m, n);
    out.push(mkStep({
      type: 'deltas', iter, x, basis, u, v, deltas,
      enter: null, cycle: null, signs: null, theta: null, leaving: null, changed: [],
      enterDelta: null, prevObj: null, obj, m, n, a, b, C
    }));

    // Find max delta
    let maxD = -Infinity, enter = null;
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++)
      if (deltas[i][j] !== null && deltas[i][j] > maxD) { maxD = deltas[i][j]; enter = [i, j]; }

    if (maxD <= 1e-9) {
      out.push(mkStep({
        type: 'optimal', iter, x, basis, u, v, deltas,
        enter: null, cycle: null, signs: null, theta: null, leaving: null, changed: [],
        enterDelta: null, prevObj: null, obj, m, n, a, b, C
      }));
      break;
    }

    const enterDelta = deltas[enter[0]][enter[1]];

    // Enter cell
    out.push(mkStep({
      type: 'enter', iter, x, basis, u, v, deltas, enter,
      cycle: null, signs: null, theta: null, leaving: null, changed: [],
      enterDelta, prevObj: null, obj, m, n, a, b, C
    }));

    // Cycle
    const cycle = findCycle(enter[0], enter[1], basis);
    if (!cycle) { console.error('Cycle not found at', enter); break; }
    const signs = cycle.map((_, k) => k % 2 === 0 ? 1 : -1);
    out.push(mkStep({
      type: 'cycle', iter, x, basis, u, v, deltas, enter,
      cycle: cycle.map(c => [...c]), signs: [...signs], theta: null, leaving: null, changed: [],
      enterDelta, prevObj: null, obj, m, n, a, b, C
    }));

    // Theta
    let theta = Infinity, leaving = null;
    for (let k = 0; k < cycle.length; k++) if (signs[k] === -1) {
      const [ci, cj] = cycle[k];
      if (x[ci][cj] < theta) { theta = x[ci][cj]; leaving = [ci, cj]; }
    }
    out.push(mkStep({
      type: 'theta', iter, x, basis, u, v, deltas, enter,
      cycle: cycle.map(c => [...c]), signs: [...signs], theta, leaving: [...leaving], changed: [],
      enterDelta, prevObj: null, obj, m, n, a, b, C
    }));

    // Update x
    const nx = cp(x);
    const changed = [];
    for (let k = 0; k < cycle.length; k++) {
      const [ci, cj] = cycle[k];
      nx[ci][cj] += signs[k] * theta;
      if (Math.abs(nx[ci][cj]) < 1e-9) nx[ci][cj] = 0;
      changed.push([ci, cj]);
    }
    // Update basis
    let newBasis = basis.filter(([bi, bj]) => !(bi === leaving[0] && bj === leaving[1]));
    if (!newBasis.some(([bi, bj]) => bi === enter[0] && bj === enter[1]))
      newBasis.push([...enter]);

    x = nx; basis = newBasis;
    const prevObj = obj;
    obj = calcObj(x, C, m, n);

    out.push(mkStep({
      type: 'update', iter, x, basis,
      u: Array(m).fill(null), v: Array(n).fill(null), deltas: nm(m, n),
      enter, cycle: cycle.map(c => [...c]), signs: [...signs], theta, leaving: [...leaving],
      changed: changed.map(c => [...c]), enterDelta, prevObj, obj, m, n, a, b, C
    }));
  }
  return out;
}

function mkStep(d) { return { ...d }; }

// ── LOG BUILDERS ─────────────────────────────────────────────────────

function buildLog(s) {
  switch (s.type) {
    case 'initial': return logInitial(s);
    case 'potentials': return logPotentials(s);
    case 'deltas': return logDeltas(s);
    case 'enter': return logEnter(s);
    case 'cycle': return logCycle(s);
    case 'theta': return logTheta(s);
    case 'update': return logUpdate(s);
    case 'optimal': return logOptimal(s);
    default: return '';
  }
}

function logInitial(s) {
  const { x, basis, obj, m, n, a, b, C } = s;
  const bStr = basis.map(([i, j]) => `(${i + 1},${j + 1})`).join(', ');
  const terms = basis.map(([i, j]) => `${C[i][j]}·${x[i][j]}`).join('+');
  return `
<div class="ls"><div class="ll">Phương pháp Góc Tây Bắc (Northwest Corner)</div>
<div class="lrow"><span class="lk">G(x⁰):</span><span class="lv">{${bStr}}</span></div>
<div class="lrow"><span class="lk">|G(x⁰)|:</span><span class="lv">${basis.length} = m+n−1 = ${m + n - 1} ✓</span></div>
<div class="lf">f(x⁰) = ${terms} = <span class="lhl">${obj}</span></div></div>`;
}

function logPotentials(s) {
  const { basis, u, v, C, m, n, iter } = s;
  const eqs = basis.map(([i, j]) => {
    const lhs = `u<sub>${i + 1}</sub>+v<sub>${j + 1}</sub>=c<sub>${i + 1}${j + 1}</sub>=${C[i][j]}`;
    const rhs = u[i] !== null && v[j] !== null ? '✓' : u[i] !== null ? `v<sub>${j + 1}</sub>=${fmt(v[j])}` : v[j] !== null ? `u<sub>${i + 1}</sub>=${fmt(u[i])}` : '';
    return `<div class="leq">${lhs} → ${rhs}</div>`;
  }).join('');
  const uStr = u.map((val, i) => `u<sub>${i + 1}</sub>=${fmt(val)}`).join(', ');
  const vStr = v.map((val, j) => `v<sub>${j + 1}</sub>=${fmt(val)}`).join(', ');
  return `
<div class="ls"><div class="ll">Đặt u<sub>1</sub>=0, giải hệ u<sub>i</sub>+v<sub>j</sub>=c<sub>ij</sub> với (i,j)∈G(x)</div>
<div class="leqs">${eqs}</div>
<div class="lf">${uStr}<br>${vStr}</div></div>`;
}

function logDeltas(s) {
  const { deltas, u, v, C, m, n } = s;
  let maxD = -Infinity;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++)
    if (deltas[i][j] !== null && deltas[i][j] > maxD) maxD = deltas[i][j];
  let rows = '';
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    if (deltas[i][j] !== null) {
      const d = deltas[i][j];
      const isMax = (d === maxD && d > 0);
      const cls = d > 0 ? 'lpos' : d < 0 ? 'lneg' : 'lzero';
      rows += `<div class="leq${isMax ? ' hl' : ''}">Δ<sub>${i + 1}${j + 1}</sub>=${fmt(u[i])}+${fmt(v[j])}−${C[i][j]}=<span class="${cls}">${ps(d)}</span>${isMax ? ' ← max' : ''}</div>`;
    }
  }
  const verdict = maxD <= 0
    ? `<div class="lverdict ok">Tất cả Δ<sub>ij</sub>≤0 → Phương án tối ưu!</div>`
    : `<div class="lverdict warn">max Δ = <b>${maxD}</b> > 0 → Chưa tối ưu</div>`;
  return `
<div class="ls"><div class="ll">Δ<sub>ij</sub>=u<sub>i</sub>+v<sub>j</sub>−c<sub>ij</sub> với (i,j)∉G(x)</div>
<div class="leqs">${rows}</div>${verdict}</div>`;
}

function logEnter(s) {
  const { enter, deltas } = s;
  const [ei, ej] = enter;
  const d = deltas[ei][ej];
  return `
<div class="ls">
<div class="lrow"><span class="lk">Ô điều chỉnh:</span><span class="lv lenter">(${ei + 1}, ${ej + 1})</span></div>
<div class="lf">Δ<sub>${ei + 1}${ej + 1}</sub> = max{Δ<sub>ij</sub>>0} = <span class="lhl">${d}</span></div>
<div class="ll" style="margin-top:5px">Đưa ô (${ei + 1},${ej + 1}) vào cơ sở qua chu trình điều chỉnh.</div></div>`;
}

function logCycle(s) {
  const { cycle, signs, enter } = s;
  const kpStr = cycle.filter((_, k) => signs[k] === 1).map(([i, j]) => `(${i + 1},${j + 1})`).join(', ');
  const knStr = cycle.filter((_, k) => signs[k] === -1).map(([i, j]) => `(${i + 1},${j + 1})`).join(', ');
  const cStr = cycle.map(([i, j], k) => `(${i + 1},${j + 1})<sup>${signs[k] > 0 ? '+' : '−'}</sup>`).join('→');
  return `
<div class="ls">
<div class="lrow"><span class="lk">Chu trình K:</span><span class="lv">${cStr}→...</span></div>
<div class="lrow"><span class="lk">K⁺:</span><span class="lv lcpos">{${kpStr}}</span></div>
<div class="lrow"><span class="lk">K⁻:</span><span class="lv lcneg">{${knStr}}</span></div></div>`;
}

function logTheta(s) {
  const { cycle, signs, theta, leaving, x } = s;
  const negItems = cycle.filter((_, k) => signs[k] === -1)
    .map(([i, j]) => `x<sub>${i + 1}${j + 1}</sub>=${x[i][j]}`).join(', ');
  return `
<div class="ls">
<div class="lf">θ = min{${negItems}} = <span class="lhl">${theta}</span></div>
<div class="lrow"><span class="lk">Ô rời cơ sở:</span><span class="lv lcneg">(${leaving[0] + 1}, ${leaving[1] + 1})</span></div></div>`;
}

function logUpdate(s) {
  const { cycle, signs, theta, enter, leaving, x, obj, prevObj, enterDelta } = s;
  const rows = cycle.map(([i, j], k) => {
    const nx = x[i][j];
    const px = signs[k] === 1 ? nx - theta : nx + theta;
    const pxFmt = Math.round(px * 1000) / 1000;
    const nxFmt = Math.round(nx * 1000) / 1000;
    const arrow = signs[k] === 1 ? `${pxFmt}+${theta}=${nxFmt}` : `${pxFmt}−${theta}=${nxFmt}`;
    const isLv = (leaving && leaving[0] === i && leaving[1] === j);
    return `<div class="leq">x<sub>${i + 1}${j + 1}</sub>: ${arrow}${isLv ? '<span class="lleave"> ← rời cơ sở</span>' : ''}</div>`;
  }).join('');
  return `
<div class="ls"><div class="leqs">${rows}</div>
<div class="lrow" style="margin-top:6px"><span class="lk">Ô vào cơ sở:</span><span class="lv lcpos">(${enter[0] + 1},${enter[1] + 1})</span></div>
<div class="lrow"><span class="lk">Ô rời cơ sở:</span><span class="lv lcneg">(${leaving[0] + 1},${leaving[1] + 1})</span></div>
<div class="lf">f = ${prevObj} − ${theta}×${enterDelta} = <span class="lhl">${obj}</span></div></div>`;
}

function logOptimal(s) {
  const { x, basis, obj, m, n, C } = s;
  const xStr = basis.filter(([i, j]) => x[i][j] > 0).map(([i, j]) => `x<sub>${i + 1}${j + 1}</sub>=${x[i][j]}`).join(', ');
  const terms = basis.filter(([i, j]) => x[i][j] > 0).map(([i, j]) => `${C[i][j]}·${x[i][j]}`).join('+');
  return `
<div class="ls">
<div class="lverdict ok" style="margin-bottom:8px">Tất cả Δ<sub>ij</sub>≤0 → x* là phương án tối ưu!</div>
<div class="lrow"><span class="lk">x*:</span><span class="lv">${xStr}</span></div>
<div class="lf">f* = ${terms} = <span class="lhl-big">${obj}</span></div></div>`;
}

// ── TABLE RENDERER ───────────────────────────────────────────────────

function renderTable(s) {
  const { x, basis, u, v, deltas, enter, cycle, signs, changed, leaving, m, n, a, b, C, type } = s;
  const bs = new Set(basis.map(([i, j]) => `${i},${j}`));
  const showDeltas = ['deltas', 'enter', 'cycle', 'theta'].includes(type);
  const cycMap = new Map();
  if (cycle && signs) cycle.forEach(([i, j], k) => cycMap.set(`${i},${j}`, signs[k]));
  const chSet = new Set((changed || []).map(([i, j]) => `${i},${j}`));
  const enterKey = enter ? `${enter[0]},${enter[1]}` : null;
  const leavKey = leaving ? `${leaving[0]},${leaving[1]}` : null;

  let h = '<div class="table-scroll-center"><table class="classic-table"><tbody>';

  // Row 0
  h += '<tr><td class="no-bdr"></td><td class="no-bdr pot-lbl">v<sub>j</sub></td>';
  for (let j = 0; j < n; j++) {
    const vj = v[j] !== null ? fmt(v[j]) : '';
    h += `<td class="no-bdr pot-val-c">${vj}</td>`;
  }
  h += '</tr>';

  // Row 1
  h += '<tr><td class="no-bdr pot-lbl">u<sub>i</sub></td>';
  h += `<td class="diag-cell"><div class="lbl-b">b<sub>j</sub></div><div class="lbl-a">a<sub>i</sub></div></td>`;
  for (let j = 0; j < n; j++) {
    h += `<td class="hdr-b">${b[j]}</td>`;
  }
  h += '</tr>';

  for (let i = 0; i < m; i++) {
    h += '<tr>';
    const ui = u[i] !== null ? fmt(u[i]) : '';
    h += `<td class="no-bdr pot-val-c">${ui}</td>`;
    h += `<td class="hdr-a">${a[i]}</td>`;

    for (let j = 0; j < n; j++) {
      const key = `${i},${j}`;
      const inB = bs.has(key);
      const isEnter = (key === enterKey);
      const cycSign = cycMap.get(key);
      const xv = x[i][j];
      const dv = deltas[i][j];

      let main = '';
      main += `<div class="c-cost">${C[i][j]}</div>`;

      if (cycSign !== undefined && type !== 'update') {
        main += `<div class="c-cyc-sign">${cycSign > 0 ? '+' : '−'}</div>`;
      }

      if (inB) {
        const showZero = xv === 0 && !(isEnter && type !== 'update');
        if (isEnter && type !== 'update') {
          // not basic yet visually
        } else {
          main += `<div class="c-x${showZero ? ' zero' : ''}">${xv}</div>`;
        }
      } else if (showDeltas && dv !== null) {
        const dv2 = Math.round(dv * 1000) / 1000;
        main += `<div class="c-delta-wrap"><div class="c-delta">${dv2}</div></div>`;
      }

      let cls = 'c-main';
      if (type === 'update' && chSet.has(key)) cls += ' highlight-change';
      else if (cycSign !== undefined && type !== 'update') cls += ' highlight-cycle';
      else if (isEnter && type !== 'cycle' && type !== 'theta' && type !== 'update') cls += ' highlight-enter';
      else if (inB && type === 'optimal') cls += ' highlight-optimal';

      h += `<td class="${cls}">${main}</td>`;
    }
    h += '</tr>';
  }
  h += '</tbody></table></div>';
  return h;
}

// ── STEP TITLES ──────────────────────────────────────────────────────

function stepTitle(s) {
  const t = {
    initial: 'Xác định phương án ban đầu',
    potentials: `Vòng ${s.iter} – Bước 1: Tính các thế vị u<sub>i</sub> và v<sub>j</sub>`,
    deltas: `Vòng ${s.iter} – Bước 2 & 3: Tính các ước lượng Δ<sub>ij</sub>, kiểm tra tối ưu`,
    enter: `Vòng ${s.iter} – Bước 4.1: Xác định ô điều chỉnh (i<sub>s</sub>, j<sub>s</sub>)`,
    cycle: `Vòng ${s.iter} – Bước 4.2 & 4.3: Tìm chu trình K, đánh dấu ±`,
    theta: `Vòng ${s.iter} – Bước 4.4: Tính θ`,
    update: `Vòng ${s.iter} – Bước 4.5: Cập nhật x⁰ := x¹, G(x⁰) := G(x¹)`,
    optimal: '✓ Phương án tối ưu!'
  };
  return t[s.type] || s.type;
}

// ── RENDER STEP ──────────────────────────────────────────────────────

function renderStep(idx) {
  cur = Math.max(0, Math.min(steps.length - 1, idx));
  const s = steps[cur];

  // Table
  document.getElementById('tableWrap').innerHTML = renderTable(s);

  // Log: update active state
  const items = document.querySelectorAll('.log-item');
  items.forEach((el, i) => {
    const wasActive = el.classList.contains('active');
    el.classList.toggle('active', i === cur);
    if (i === cur && !wasActive) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Objective
  document.getElementById('objDisplay').textContent = s.obj;

  // Iter badge
  const iText = s.iter === 0 ? 'Ban đầu' : s.type === 'optimal' ? 'Tối ưu ✓' : `Vòng ${s.iter}`;
  document.getElementById('iterBadge').textContent = iText;

  // Controls
  document.getElementById('stepLbl').textContent = `${cur + 1}/${steps.length}`;
  document.getElementById('stepSlider').value = cur;
  document.getElementById('btnFirst').disabled = cur === 0;
  document.getElementById('btnPrev').disabled = cur === 0;
  document.getElementById('btnNext').disabled = cur === steps.length - 1;
  document.getElementById('btnLast').disabled = cur === steps.length - 1;
}

function buildLogList() {
  const list = document.getElementById('logList');
  list.innerHTML = '';
  steps.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'log-item' + (s.type === 'optimal' ? ' is-optimal' : '');
    el.innerHTML = `
      <div class="log-num">Bước ${i + 1}</div>
      <div class="log-title">${stepTitle(s)}</div>
      <div class="log-body">${buildLog(s)}</div>`;
    el.addEventListener('click', () => { if (playing) pausePlay(); renderStep(i); });
    list.appendChild(el);
  });
}

// ── PLAYBACK ─────────────────────────────────────────────────────────

function togglePlay() {
  if (playing) pausePlay();
  else startPlay();
}
function startPlay() {
  if (cur >= steps.length - 1) { cur = 0; renderStep(0); }
  playing = true;
  document.getElementById('btnPlay').textContent = '⏸';
  playTimer = setInterval(() => {
    if (cur < steps.length - 1) { renderStep(cur + 1); }
    else pausePlay();
  }, speed);
}
function pausePlay() {
  playing = false;
  document.getElementById('btnPlay').textContent = '▶';
  clearInterval(playTimer);
}
function goFirst() { if (playing) pausePlay(); renderStep(0); }
function goPrev() { if (playing) pausePlay(); renderStep(cur - 1); }
function goNext() { if (playing) pausePlay(); renderStep(cur + 1); }
function goLast() { if (playing) pausePlay(); renderStep(steps.length - 1); }
function goSlider(v) { if (playing) pausePlay(); renderStep(parseInt(v)); }
function setSpeed(v) { speed = Math.max(300, 3600 - parseInt(v)); }  // invert: bigger slider = faster

// ── ENTRY POINTS ─────────────────────────────────────────────────────

function runSolver(m, n, a, b, C) {
  // Show solver UI
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('solverUI').classList.remove('hidden');
  if (playing) pausePlay();

  prob = { m, n, a, b, C };
  steps = solve(m, n, a, b, C);

  // Setup slider
  const sl = document.getElementById('stepSlider');
  sl.max = steps.length - 1;
  sl.value = 0;

  buildLogList();
  renderStep(0);
}

function runDemo() {
  const m = 3, n = 4;
  const a = [50, 70, 80];
  const b = [60, 30, 40, 70];
  const C = [[2, 4, 5, 1], [3, 6, 4, 8], [1, 2, 5, 3]];
  runSolver(m, n, a, b, C);
}

// ── MODAL ────────────────────────────────────────────────────────────

function openModal() {
  document.getElementById('inputModal').classList.remove('hidden');
  generateFields();
}
function closeModal() {
  document.getElementById('inputModal').classList.add('hidden');
}
function overlayClick(e) {
  if (e.target === e.currentTarget) closeModal();
}

function generateFields() {
  const m = parseInt(document.getElementById('mInput').value) || 3;
  const n = parseInt(document.getElementById('nInput').value) || 4;
  const div = document.getElementById('dynFields');

  let h = '';
  // Supply a[]
  h += `<div class="dyn-section"><span class="dyn-label">Lượng phát aᵢ (nguồn)</span><div class="dyn-row">`;
  for (let i = 0; i < m; i++) {
    h += `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
      <span style="font-size:10px;color:var(--muted)">a<sub>${i + 1}</sub></span>
      <input class="dyn-in" id="a${i}" type="number" value="50" min="0">
    </div>`;
  }
  h += '</div></div>';

  // Demand b[]
  h += `<div class="dyn-section"><span class="dyn-label">Lượng thu bⱼ (đích)</span><div class="dyn-row">`;
  for (let j = 0; j < n; j++) {
    h += `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
      <span style="font-size:10px;color:var(--muted)">b<sub>${j + 1}</sub></span>
      <input class="dyn-in" id="b${j}" type="number" value="50" min="0">
    </div>`;
  }
  h += '</div></div>';

  // Cost matrix C[][]
  h += `<div class="dyn-section"><span class="dyn-label">Ma trận chi phí C (cᵢⱼ)</span>`;
  h += `<div style="overflow-x:auto"><table style="border-collapse:separate;border-spacing:4px">`;
  h += `<tr><td></td>`;
  for (let j = 0; j < n; j++) h += `<td style="text-align:center;font-size:11px;color:var(--muted)">j=${j + 1}</td>`;
  h += '</tr>';
  for (let i = 0; i < m; i++) {
    h += `<tr><td style="font-size:11px;color:var(--muted);padding-right:6px">i=${i + 1}</td>`;
    for (let j = 0; j < n; j++) {
      const def = [[2, 4, 5, 1], [3, 6, 4, 8], [1, 2, 5, 3]];
      const v = (m === 3 && n === 4 && def[i]) ? def[i][j] : 1;
      h += `<td><input class="dyn-in" id="c${i}_${j}" type="number" value="${v}" min="0"></td>`;
    }
    h += '</tr>';
  }
  h += '</table></div></div>';

  div.innerHTML = h;
}

function solveFromModal() {
  const m = parseInt(document.getElementById('mInput').value) || 3;
  const n = parseInt(document.getElementById('nInput').value) || 4;

  const a = [], b = [];
  for (let i = 0; i < m; i++) a.push(parseFloat(document.getElementById(`a${i}`).value) || 0);
  for (let j = 0; j < n; j++) b.push(parseFloat(document.getElementById(`b${j}`).value) || 0);
  const C = [];
  for (let i = 0; i < m; i++) {
    C.push([]);
    for (let j = 0; j < n; j++) C[i].push(parseFloat(document.getElementById(`c${i}_${j}`).value) || 0);
  }

  // Validate balance
  const sumA = a.reduce((s, v) => s + v, 0);
  const sumB = b.reduce((s, v) => s + v, 0);
  const errDiv = document.getElementById('dynFields').querySelector('.err-msg');
  if (errDiv) errDiv.remove();

  if (Math.abs(sumA - sumB) > 1e-6) {
    const err = document.createElement('div');
    err.className = 'err-msg';
    err.innerHTML = `Bài toán chưa cân bằng! Σaᵢ=${sumA} ≠ Σbⱼ=${sumB}`;
    document.getElementById('dynFields').appendChild(err);
    return;
  }

  closeModal();
  runSolver(m, n, a, b, C);
}

// ── INIT ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (document.getElementById('solverUI').classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') goNext();
  else if (e.key === 'ArrowLeft') goPrev();
  else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  else if (e.key === 'Home') goFirst();
  else if (e.key === 'End') goLast();
});
