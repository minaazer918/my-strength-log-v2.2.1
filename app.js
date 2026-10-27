'use strict';
const LB = 0.45359237;
const PERF = ['Fast', 'Good', 'Easy', 'Hard', 'Slow', 'Form issue'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATS = ['Squat', 'Hinge', 'Push', 'Pull', 'Core', 'Other'];
// exercise list (localStorage); each workout stores the exercise id
let XL = [];
try { XL = JSON.parse(ls('exercises') || '[]'); } catch (e) {}
XL = (Array.isArray(XL) ? XL : []).filter(e => e && /^[a-z0-9-]{1,40}$/.test(e.id) && typeof e.name === 'string');
const saveXL = () => ls('exercises', JSON.stringify(XL));
const NAME = new Proxy({}, {get: (_, k) => { const e = XL.find(x => x.id === k); return e && e.name; }});
// every exercise id used by a saved workout must be in the list (covers old squat/deadlift data, imports, lost list)
function ensure() {
  let ch = false;
  [...new Set(W.map(w => w.exercise))].forEach(id => {
    if (XL.some(e => e.id === id)) return;
    const p = PRESETS.find(x => x.id === id);
    XL.push(p ? {id, name: p.name, cat: p.cat} : {id, name: 'Unknown exercise', cat: 'Other'}); ch = true;
  });
  if (ch) saveXL();
}
function addNamed(raw, cat) {
  const name = String(raw).trim().replace(/\s+/g, ' ');
  if (!name) return 'Please enter an exercise name.';
  if (name.length > 40) return 'Name is too long (40 characters max).';
  const key = name.toLowerCase(), have = XL.find(e => e.name.toLowerCase() === key);
  if (have && !have.hidden) return '“' + have.name + '” is already in your list.';
  if (have) { have.hidden = false; saveXL(); return ''; }
  const p = PRESETS.find(x => x.name.toLowerCase() === key);
  if (p && XL.some(e => e.id === p.id)) return 'That exercise is already in your list.';
  XL.push(p ? {id: p.id, name: p.name, cat: p.cat} : {id: 'x-' + uid().replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 10), name, cat: CATS.includes(cat) ? cat : 'Other'});
  saveXL(); return '';
}
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} }
const S = {unit: ls('unit') || 'lb', theme: ls('theme') || 'auto'};
document.documentElement.dataset.theme = S.theme;
let db, W = [], F = null;

/* ---------- IndexedDB (workouts, each with an embedded sets array) ---------- */
const openDB = () => new Promise((res, rej) => {
  const r = indexedDB.open('strengthlog', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('workouts', {keyPath: 'id'});
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const tx = (mode, fn) => new Promise((res, rej) => {
  const t = db.transaction('workouts', mode);
  const r = fn(t.objectStore('workouts'));
  t.oncomplete = () => res(r && r.result);
  t.onerror = t.onabort = () => rej(t.error);
});
const dbAll = () => tx('readonly', s => s.getAll());
const dbPut = ws => tx('readwrite', s => { [].concat(ws).forEach(w => s.put(w)); });
const dbDel = id => tx('readwrite', s => s.delete(id));

/* ---------- helpers ---------- */
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fmtDate = d => { const [y, m, x] = d.split('-'); return MON[m - 1] + ' ' + (+x) + ', ' + y; };
const fmtShort = d => { const [y, m, x] = d.split('-'); return MON[m - 1] + ' ' + (+x) + ' ’' + y.slice(2); }; // compact date for the progression table
const num = v => { v = String(v).trim().replace(',', '.'); return /^\d+(\.\d+)?$/.test(v) ? parseFloat(v) : NaN; };
// weights are always stored in lb; kg is display-only
const fw = lb => String(Math.round((S.unit === 'kg' ? lb * LB : lb) * 100) / 100);
const fwd = lb => lb === 0 ? 'BW' : fw(lb); // 0 = bodyweight, shown as BW
const fwu = lb => lb === 0 ? 'BW' : fw(lb) + ' ' + S.unit;
const tolb = (txt, orig) => {
  const v = num(txt);
  if (orig != null && fw(orig) === String(v)) return orig; // untouched value: keep exact stored number
  return S.unit === 'kg' ? v / LB : v;
};
const byNew = (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
const hdr = (t, href, label) => `<a class="back" href="${href || '#/'}">‹ ${label || 'Home'}</a><h1>${esc(t)}</h1>`;
const app = () => $('#app');
const setLine = (s, i) => `<div class="ln">${i != null ? 'Set ' + (i + 1) + ' — ' : ''}${fwd(s.weight)} × ${s.reps} — ${esc(s.performance)}</div>`;

function prevOf(ex, date, self) {
  return W.filter(w => w.exercise === ex && (!self || w.id !== self.id) &&
    (w.date < date || (w.date === date && (!self || w.createdAt < self.createdAt)))).sort(byNew)[0] || null;
}

/* ---------- router ---------- */
async function route() {
  W = await dbAll(); ensure();
  const p = (location.hash.slice(1) || '/').split('/').filter(Boolean);
  if (p[0] === 'new' && NAME[p[1]]) form(p[1]);
  else if (p[0] === 'edit' && W.find(w => w.id === p[1])) form(null, p[1]);
  else if (p[0] === 'hist') hist(p[1] || 'all');
  else if (p[0] === 'prog' && NAME[p[1]]) prog(p[1]);
  else if (p[0] === 'add') addEx();
  else if (p[0] === 'settings') settings();
  else home();
  window.scrollTo(0, 0);
}

function home() {
  const vis = XL.filter(e => !e.hidden), quick = ['squat', 'deadlift', 'bench-press', 'overhead-press', 'barbell-row'].map(id => PRESETS.find(p => p.id === id));
  app().innerHTML = `<h1 class="brand">MY STRENGTH LOG</h1>` +
  (vis.length ? vis.map(e => `<a class="btn big pri" href="#/new/${e.id}">${esc(e.name).toUpperCase()}</a>`).join('')
   : `<section class="card"><h2>No exercises yet</h2><div class="muted">Add the exercises you want to track.</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">${quick.map(p => `<button class="btn sm" data-q="${p.id}">${esc(p.name)}</button>`).join('')}</div></section>`) +
  `<a class="btn" href="#/add">+ ADD EXERCISE</a>
  <a class="btn" href="#/hist">HISTORY</a>
  <a class="btn" href="#/settings">SETTINGS</a>`;
  document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { addNamed(PRESETS.find(p => p.id === b.dataset.q).name); home(); });
}
function addEx() {
  app().innerHTML = hdr('Add exercise') + `<label for="xn">Exercise name</label>
  <input id="xn" list="pl" maxlength="40" autocomplete="off" placeholder="Type a name or pick a suggestion">
  <datalist id="pl">${PRESETS.map(p => `<option value="${esc(p.name)}">`).join('')}</datalist>
  <label for="xt">Movement type</label>
  <select id="xt">${CATS.map(c => `<option>${c}</option>`).join('')}</select>
  <div id="err" class="err" role="alert"></div>
  <button class="btn big pri" id="xs">ADD EXERCISE</button>`;
  $('#xn').oninput = () => { const p = PRESETS.find(x => x.name.toLowerCase() === $('#xn').value.trim().toLowerCase()); if (p) $('#xt').value = p.cat; };
  $('#xs').onclick = () => { const e = addNamed($('#xn').value, $('#xt').value); if (e) $('#err').textContent = e; else location.hash = '#/'; };
}

/* ---------- workout form ---------- */
function form(ex, id) {
  const w = id ? W.find(x => x.id === id) : W.filter(x => x.exercise === ex && x.date === today() && x.sets.length < 4).sort(byNew)[0];
  if (w) F = {id: w.id, ex: w.exercise, date: w.date, comment: w.comment || '', created: w.createdAt,
    sets: w.sets.map(s => ({w: fw(s.weight), orig: s.weight, r: String(s.reps), p: s.performance}))
      .concat(id ? [] : [0, 1, 2, 3].slice(w.sets.length).map(() => ({w: '', orig: null, r: '8', p: 'Good'})))};
  else F = {id: null, ex, date: today(), comment: '', created: null,
    sets: [0, 1, 2, 3].map(() => ({w: '', orig: null, r: '8', p: 'Good'}))};
  drawForm();
}
function sync() {
  F.date = $('#dt').value; F.comment = $('#cm').value;
  document.querySelectorAll('[data-k]').forEach(el => { F.sets[el.dataset.i][el.dataset.k] = el.value; });
}
function drawForm() {
  const nm = NAME[F.ex], nmE = esc(nm), self = F.id ? W.find(x => x.id === F.id) : null;
  const prev = F.date ? prevOf(F.ex, F.date, self) : null;
  app().innerHTML = hdr(F.id ? 'Edit ' + nm : nm, F.id ? '#/hist' : '#/', F.id ? 'History' : 'Home') +
  (prev ? `<section class="card"><h2>Previous ${nmE}</h2><div class="muted">${fmtDate(prev.date)} · ${S.unit}</div>
    ${prev.sets.map((s, i) => setLine(s, i)).join("")}
    ${prev.comment ? `<div class="muted">“${esc(prev.comment)}”</div>` : ''}
    <button class="btn" id="cp">COPY PREVIOUS WORKOUT</button></section>`
   : `<section class="card muted">No previous ${nmE} workout yet.</section>`) +
  `<label for="dt">Date: <span id="dd">${F.date ? fmtDate(F.date) : ''}</span></label>
  <input type="date" id="dt" value="${esc(F.date)}">
  <div class="grid head"><span>Set</span><span>Weight (${S.unit})</span><span>Reps</span><span>Performance</span></div>` +
  F.sets.map((s, i) => `<div class="grid"><b>${i + 1}</b>
    <input data-k="w" data-i="${i}" inputmode="decimal" autocomplete="off" value="${esc(s.w)}" aria-label="Set ${i + 1} weight">
    <input data-k="r" data-i="${i}" inputmode="numeric" autocomplete="off" value="${esc(s.r)}" aria-label="Set ${i + 1} reps">
    <select data-k="p" data-i="${i}" aria-label="Set ${i + 1} performance">${PERF.map(p => `<option${p === s.p ? ' selected' : ''}>${p}</option>`).join('')}</select></div>`).join('') +
  `<div class="row"><button class="btn sm" id="add">+ Add set</button><button class="btn sm" id="rm">− Remove set</button></div>
  <label for="cm">Workout Comment</label>
  <textarea id="cm" rows="3" placeholder="Optional">${esc(F.comment)}</textarea>
  <div id="err" class="err" role="alert"></div>
  <button class="btn big pri" id="sv">${F.id ? 'SAVE CHANGES' : 'SAVE WORKOUT'}</button>
  ${F.id ? '<button class="btn danger" id="dl">DELETE WORKOUT</button>' : ''}
  <a class="btn" href="#/prog/${F.ex}">${nmE} Progression</a>
  <section class="card" id="tsec"></section>`;
  drawTimer();
  $('#dt').onchange = () => { sync(); drawForm(); };
  if (prev) $('#cp').onclick = () => { sync(); F.sets = prev.sets.map(s => ({w: fw(s.weight), orig: s.weight, r: String(s.reps), p: s.performance})); drawForm(); };
  $('#add').onclick = () => { sync(); F.sets.push({w: '', orig: null, r: '8', p: 'Good'}); drawForm(); };
  $('#rm').onclick = () => { sync(); if (F.sets.length > 1) F.sets.pop(); drawForm(); };
  $('#sv').onclick = save;
  if (F.id) $('#dl').onclick = async () => {
    if (!confirm('Delete this workout? This cannot be undone.')) return;
    await dbDel(F.id); location.hash = '#/hist'; route();
  };
}
async function save() {
  sync();
  const errs = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(F.date)) errs.push('Please choose a valid date.');
  let n = F.sets.length;
  while (n > 1 && F.sets[n - 1].orig == null && !String(F.sets[n - 1].w).trim()) n--;
  const sets = F.sets.slice(0, n).map((s, i) => {
    const wt = num(s.w), r = num(s.r);
    if (!(wt >= 0 && wt <= 5000)) errs.push(`Set ${i + 1}: enter a valid weight (0 for bodyweight).`);
    if (!(Number.isInteger(r) && r > 0 && r <= 1000)) errs.push(`Set ${i + 1}: enter valid reps (whole number).`);
    return {setNumber: i + 1, weight: wt > 0 ? tolb(s.w, s.orig) : 0, reps: r, performance: s.p};
  });
  if (errs.length) { $('#err').innerHTML = errs.map(esc).join('<br>'); $('#err').scrollIntoView({block: 'center'}); return; }
  const now = new Date().toISOString(), id = F.id || uid();
  const w = {id, exercise: F.ex, date: F.date, comment: F.comment.trim(), createdAt: F.created || now, updatedAt: now,
    sets: sets.map(s => Object.assign({workoutId: id}, s))};
  try { await dbPut(w); } catch (e) { $('#err').textContent = 'Could not save: ' + (e && e.message || 'storage error'); return; }
  W = await dbAll();
  saved(w);
}
function saved(w) {
  const nm = NAME[w.exercise], nmE = esc(nm), prev = prevOf(w.exercise, w.date, w);
  const ws = w.sets.map(s => s.weight), top = Math.max(...ws), n = ws.filter(x => x === top).length, tot = ws.length;
  const step = S.unit === 'kg' ? 5 : 10, d = parseFloat(fw(top));
  const next = S.unit === 'kg' ? Math.round((d + step) * 2) / 2 : d + step;
  let h = `<div class="ok">Workout saved ✓</div><section class="card"><h2>Progression</h2>
    <div class="ln"><b>${n} of ${tot} sets at ${fwu(top)}</b></div>
    ${prev ? `<div class="muted">Previous: ${prev.sets.map(s => fwd(s.weight) + '×' + s.reps).join(' / ')}</div>` : ''}
    <div class="muted">Today: ${w.sets.map(s => fwd(s.weight) + '×' + s.reps).join(' / ')}</div>`;
  if (n === tot) h += `<p>All ${tot} sets completed at ${fwu(top)}.</p>${top > 0 ? `<p class="muted">You may consider starting the next progression at ${next} ${S.unit}. This is only a suggestion.</p>` : ''}`;
  h += '</section>';
  app().innerHTML = `<h1>${nmE}</h1>${h}<a class="btn pri" href="#/">HOME</a><a class="btn" href="#/hist">HISTORY</a><a class="btn" href="#/prog/${w.exercise}">${nmE} Progression</a><a class="btn" href="#/edit/${w.id}">Edit this workout</a>`;
  window.scrollTo(0, 0);
}

/* ---------- history ---------- */
function hist(f) {
  if (f !== 'all' && !NAME[f]) f = 'all';
  const ids = XL.filter(e => !e.hidden || W.some(w => w.exercise === e.id)).map(e => e.id);
  const list = W.filter(w => f === 'all' || w.exercise === f).sort(byNew);
  app().innerHTML = hdr('History') +
  (ids.length > 2 ? `<select id="hf" aria-label="Filter by exercise">${['all'].concat(ids).map(k => `<option value="${k}"${k === f ? ' selected' : ''}>${k === 'all' ? 'All' : esc(NAME[k])}</option>`).join('')}</select>`
   : `<div class="tabs">${['all'].concat(ids).map(k => `<a class="btn sm ${k === f ? 'on' : ''}" href="#/hist/${k}">${k === 'all' ? 'All' : esc(NAME[k])}</a>`).join('')}</div>`) +
  (f !== 'all' ? `<a class="btn" href="#/prog/${f}">${esc(NAME[f])} Progression</a>` : '') +
  (list.length ? list.map(w => `<a class="card" href="#/edit/${w.id}"><h2>${esc(NAME[w.exercise])}</h2>
    <div class="muted">${fmtDate(w.date)} · ${S.unit}</div>
    ${w.sets.map(s => `<div class="ln">${fwd(s.weight)} × ${s.reps} — ${esc(s.performance)}</div>`).join('')}
    ${w.comment ? `<div class="muted">Comment: ${esc(w.comment)}</div>` : ''}</a>`).join('')
   : '<p class="muted">No workouts yet.</p>');
  const hf = $('#hf'); if (hf) hf.onchange = () => { location.hash = '#/hist/' + hf.value; };
}

/* ---------- progression table ---------- */
function prog(ex) {
  const list = W.filter(w => w.exercise === ex).sort(byNew).slice(0, 12).reverse();
  const cols = Math.max(4, ...list.map(w => w.sets.length));
  app().innerHTML = hdr(NAME[ex] + ' Progression', '#/hist/' + ex, 'History') +
  (list.length ? `<div class="tw card"><table><tr><th>Date</th>${Array.from({length: cols}, (_, i) => `<th>S${i + 1}</th>`).join('')}</tr>
  ${list.map(w => { const ws = w.sets.map(s => s.weight), lo = Math.min(...ws);
    return `<tr><td>${fmtShort(w.date)}</td>${Array.from({length: cols}, (_, i) => w.sets[i] ? `<td class="${w.sets[i].weight > lo ? 'hi' : ''}">${fwd(w.sets[i].weight)}×${w.sets[i].reps}</td>` : '<td></td>').join('')}</tr>`; }).join('')}
  </table></div><p class="muted">Each cell is weight×reps. Weights in ${S.unit}. Highlighted = heavier than the lightest set that day. Last 12 workouts shown, oldest first.</p>`
   : '<p class="muted">No workouts yet.</p>');
}

/* ---------- settings, export / import ---------- */
function download(name, type, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const csvCell = v => { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
function settings() {
  app().innerHTML = hdr('Settings') +
  `<section class="card"><h2>Units</h2><div class="tabs">${['lb', 'kg'].map(u => `<button class="btn sm ${S.unit === u ? 'on' : ''}" data-u="${u}">${u}</button>`).join('')}</div>
   <div class="muted">Workouts are stored in lb. Switching to kg only changes how they are displayed.</div></section>
  <section class="card"><h2>Theme</h2><div class="tabs">${['auto', 'light', 'dark'].map(t => `<button class="btn sm ${S.theme === t ? 'on' : ''}" data-t="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></section>
  <section class="card"><h2>My exercises</h2>${XL.length ? XL.map(e => `<div class="row" style="align-items:center"><span style="flex:2">${esc(e.name)}${e.hidden ? ' <span class="tag">(hidden)</span>' : ''}</span><button class="btn sm" data-h="${e.id}">${e.hidden ? 'Show' : 'Hide'}</button><button class="btn sm danger" data-d="${e.id}">Delete</button></div>`).join('') : '<div class="muted">None yet.</div>'}
   <div class="muted">Hide keeps all workout history. Delete permanently removes the exercise and its workouts.</div><a class="btn" href="#/add">+ ADD EXERCISE</a></section>
  <section class="card"><h2>Backup</h2><div class="muted">${W.length} workout${W.length === 1 ? '' : 's'} saved on this device.</div>
   <button class="btn" id="xj">EXPORT DATA (JSON)</button>
   <button class="btn" id="xc">EXPORT DATA (CSV)</button>
   <label class="btn" for="imp">IMPORT DATA (JSON)</label>
   <input type="file" id="imp" accept=".json,application/json" hidden>
   <div id="msg" class="muted" role="status"></div></section>`;
  document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { S.unit = b.dataset.u; ls('unit', S.unit); settings(); });
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { S.theme = b.dataset.t; ls('theme', S.theme); document.documentElement.dataset.theme = S.theme; settings(); });
  document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { const e = XL.find(x => x.id === b.dataset.h); e.hidden = !e.hidden; saveXL(); settings(); });
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => {
    const e = XL.find(x => x.id === b.dataset.d), ids = W.filter(w => w.exercise === e.id).map(w => w.id);
    if (!confirm(ids.length ? `Delete “${e.name}” and its ${ids.length} workout(s)? This permanently deletes all of its history and cannot be undone. (Use Hide to keep the history.)` : `Delete “${e.name}”?`)) return;
    try { await tx('readwrite', st => ids.forEach(id => st.delete(id))); } catch (err) { $('#msg').textContent = 'Could not delete: ' + (err && err.message || 'storage error'); return; }
    XL = XL.filter(x => x.id !== e.id); saveXL(); W = await dbAll(); settings();
  });
  $('#xj').onclick = () => download('my-strength-log-' + today() + '.json', 'application/json',
    JSON.stringify({app: 'My Strength Log', version: 2, weightUnit: 'lb', exportedAt: new Date().toISOString(), exercises: XL, workouts: W.slice().sort(byNew)}, null, 2));
  $('#xc').onclick = () => {
    const rows = [['id', 'exercise', 'date', 'set', 'weight_lb', 'reps', 'performance', 'comment', 'createdAt', 'updatedAt']];
    W.slice().sort(byNew).forEach(w => w.sets.forEach(s => rows.push([w.id, w.exercise, w.date, s.setNumber, s.weight, s.reps, s.performance, w.comment, w.createdAt, w.updatedAt])));
    download('my-strength-log-' + today() + '.csv', 'text/csv', rows.map(r => r.map(csvCell).join(',')).join('\r\n'));
  };
  $('#imp').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text()), arr = Array.isArray(d) ? d : d.workouts, k = d.weightUnit === 'kg' ? 1 / LB : 1;
      if (!Array.isArray(arr)) throw new Error('No workouts found in file.');
      const ok = [];
      arr.forEach(w => {
        if (!w || !(typeof w.exercise === 'string' && /^[a-z0-9-]{1,40}$/.test(w.exercise)) || !/^\d{4}-\d{2}-\d{2}$/.test(w.date) || !Array.isArray(w.sets) || !w.sets.length) return;
        const sets = w.sets.map((s, i) => ({workoutId: w.id, setNumber: i + 1, weight: Number(s.weight) * k, reps: Number(s.reps), performance: PERF.includes(s.performance) ? s.performance : 'Good'}));
        if (w.sets.some(x => x.weight == null || String(x.weight).trim() === '') || sets.some(s => !(s.weight >= 0) || !(s.reps > 0))) return;
        const now = new Date().toISOString(), id = w.id || uid();
        sets.forEach(s => s.workoutId = id);
        ok.push({id, exercise: w.exercise, date: w.date, comment: String(w.comment || ''), createdAt: w.createdAt || now, updatedAt: w.updatedAt || now, sets});
      });
      if (!ok.length) throw new Error('No valid workouts found in file.');
      if (!confirm(`Import ${ok.length} workout(s)? Workouts with the same ID will be overwritten.`)) return;
      await dbPut(ok);
      (Array.isArray(d.exercises) ? d.exercises : []).forEach(e => { if (e && typeof e.id === 'string' && /^[a-z0-9-]{1,40}$/.test(e.id) && typeof e.name === 'string' && e.name.trim() && !XL.some(x => x.id === e.id)) XL.push({id: e.id, name: e.name.trim().slice(0, 40), cat: CATS.includes(e.cat) ? e.cat : 'Other', hidden: !!e.hidden}); });
      W = await dbAll(); ensure(); saveXL(); settings();
      $('#msg').textContent = `Imported ${ok.length} workout(s)` + (ok.length < arr.length ? `; skipped ${arr.length - ok.length} invalid.` : '.');
    } catch (err) { $('#msg').textContent = 'Import failed: ' + err.message; $('#msg').className = 'err'; }
  };
}

/* ---------- rest timer ---------- */
const T = {dur: 150, left: 150, end: 0, run: false};
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function drawTimer() {
  const el = $('#tsec'); if (!el) return;
  el.innerHTML = `<h2>Rest timer</h2><div class="tm" id="tm">${fmt(T.left)}</div>
   <div class="row">${[120, 150, 180].map(d => `<button class="btn sm ${T.dur === d ? 'on' : ''}" data-d="${d}">${fmt(d)}</button>`).join('')}</div>
   <div class="row"><button class="btn sm pri" id="ts">START</button><button class="btn sm" id="tp">PAUSE</button><button class="btn sm" id="tr">RESET</button></div>`;
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { T.dur = T.left = +b.dataset.d; T.run = false; drawTimer(); });
  $('#ts').onclick = () => { if (!T.run) { if (T.left <= 0) T.left = T.dur; T.end = Date.now() + T.left * 1000; T.run = true; } };
  $('#tp').onclick = () => { if (T.run) { T.left = (T.end - Date.now()) / 1000; T.run = false; } };
  $('#tr').onclick = () => { T.run = false; T.left = T.dur; drawTimer(); };
}
setInterval(() => {
  if (T.run) {
    T.left = (T.end - Date.now()) / 1000;
    if (T.left <= 0) { T.left = 0; T.run = false; if (navigator.vibrate) navigator.vibrate([400, 150, 400]); }
  }
  const e = $('#tm'); if (e) e.textContent = (T.left <= 0 && !T.run) ? 'Go!' : fmt(T.left);
}, 250);

/* ---------- start ---------- */
(async () => {
  try { db = await openDB(); }
  catch (e) { app().innerHTML = '<h1>My Strength Log</h1><p class="err">This browser cannot store data (private mode?). Please open the site in a normal browser window.</p>'; return; }
  window.addEventListener('hashchange', route);
  await route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
