'use strict';
const BR = ['Main', 'North', 'South'];
const KEY = 'stockwise_v1';
const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// name, supplier, unit cost, lead days, min order qty, then [on hand, sales/day, incoming] for Main, North, South
const SEED = [
  ['Rice 25kg sack', 'GrainCo', 1150, 5, 20, [60, 9, 0], [12, 5, 0], [140, 3, 0]],
  ['Cooking oil 1L case', 'Lumina Foods', 780, 7, 10, [14, 4, 0], [30, 2, 0], [6, 3, 24]],
  ['Canned sardines box', 'Lumina Foods', 520, 7, 12, [40, 5, 0], [8, 4, 0], [55, 2, 0]],
  ['Laundry detergent 1kg', 'CleanHub', 210, 4, 24, [90, 12, 0], [30, 8, 0], [18, 9, 0]],
  ['Bottled water case', 'AquaPure', 240, 3, 30, [20, 14, 0], [70, 6, 0], [25, 10, 0]],
  ['Instant noodles box', 'GrainCo', 430, 5, 15, [22, 6, 0], [4, 5, 0], [30, 3, 0]],
  ['Shampoo sachet bundle', 'CleanHub', 95, 4, 48, [200, 20, 0], [60, 15, 0], [310, 10, 0]],
  ['Coffee 3-in-1 box', 'Lumina Foods', 360, 6, 20, [18, 3, 0], [25, 2, 0], [9, 4, 0]],
];
const seed = () => ({
  safety: 5, review: 14, budget: 150000,
  items: SEED.map(([name, supplier, cost, lead, moq, ...b], i) => ({
    id: i, name, supplier, cost, lead, moq,
    br: Object.fromEntries(BR.map((n, k) => [n, { stock: b[k][0], demand: b[k][1], incoming: b[k][2] }])),
  })),
});
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { S = seed(); }

const RANK = { 'Stockout risk': 0, 'Reorder now': 1, 'Overstock': 2, 'Healthy': 3 };
const CLS = { 'Stockout risk': 'c-risk', 'Reorder now': 'c-warn', 'Overstock': 'c-idle', 'Healthy': 'c-ok' };

function plan() {
  const { safety, review } = S, rows = [], transfers = [], lines = [];
  S.items.forEach(it => {
    const bs = BR.map(b => {
      const x = it.br[b], d = x.demand;
      const rop = d * (it.lead + safety), target = d * (it.lead + safety + review), pos = x.stock + x.incoming;
      const cover = d > 0 ? x.stock / d : 999;
      const status = cover < it.lead ? 'Stockout risk' : pos <= rop ? 'Reorder now' : cover > 60 ? 'Overstock' : 'Healthy';
      const surplus = Math.max(0, pos - target * 1.5);
      return { it, b, x, rop, target, pos, cover, status, surplus, surplus0: surplus, need: pos <= rop ? Math.max(0, target - pos) : 0 };
    });
    rows.push(...bs);
    const needers = bs.filter(n => n.need > 0).sort((a, c) => a.cover - c.cover);
    needers.forEach(n => bs.filter(d => d !== n && d.surplus >= 1).sort((a, c) => c.surplus - a.surplus).forEach(d => {
      const q = Math.min(Math.floor(d.surplus), Math.ceil(n.need));
      if (q < 1) return;
      transfers.push({ it, from: d.b, to: n.b, q, saved: q * it.cost });
      d.surplus -= q; n.need -= q;
    }));
    const need = needers.reduce((s, n) => s + Math.max(0, n.need), 0);
    if (need > 0.5) {
      const qty = Math.ceil(need / it.moq) * it.moq;
      lines.push({ it, qty, cost: qty * it.cost, urgency: Math.min(...needers.map(n => n.cover)), where: needers.filter(n => n.need > 0.5).map(n => n.b).join(', ') });
    }
  });
  let run = 0;
  lines.sort((a, b) => a.urgency - b.urgency).forEach(l => { l.funded = run + l.cost <= S.budget; if (l.funded) run += l.cost; });
  return { rows, transfers, lines, spend: run };
}

function render() {
  const P = plan();
  $('safetyOut').textContent = S.safety; $('reviewOut').textContent = S.review;
  $('safety').value = S.safety; $('review').value = S.review; $('budget').value = S.budget;

  const risk = P.rows.filter(r => r.status === 'Stockout risk').length;
  const deferred = P.lines.filter(l => !l.funded);
  const idle = P.rows.reduce((s, r) => s + r.surplus0 * r.it.cost, 0);
  $('kpis').innerHTML = `
    <div class="kpi r"><b>${risk}</b><span>Item-branches that will sell out before a new order can arrive</span></div>
    <div class="kpi"><b>${peso.format(P.spend)}</b><span>Funded purchase orders (budget ${peso.format(S.budget)})</span></div>
    <div class="kpi w"><b>${deferred.length}</b><span>Order lines postponed for lack of budget</span></div>
    <div class="kpi i"><b>${peso.format(idle)}</b><span>Cash sitting in surplus stock</span></div>`;

  const only = $('onlyAction').checked;
  const search = $('stockSearch').value.trim().toLowerCase();
  const branch = $('branchFilter').value;
  const status = $('statusFilter').value;
  const rows = P.rows.filter(r =>
    (!only || RANK[r.status] < 2) &&
    (!search || r.it.name.toLowerCase().includes(search)) &&
    (!branch || r.b === branch) &&
    (!status || r.status === status)
  ).sort((a, b) => RANK[a.status] - RANK[b.status] || a.cover - b.cover);
  $('stockCount').textContent = `${rows.length} of ${P.rows.length} rows`;
  const inp = (r, f) => `<input type="number" min="0" step="${f === 'demand' ? .5 : 1}" value="${r.x[f]}" data-id="${r.it.id}" data-b="${r.b}" data-f="${f}" aria-label="${esc(r.it.name)} ${r.b} ${f}">`;
  $('stock').innerHTML = `<thead><tr><th>Item</th><th>Branch</th><th>On hand</th><th>Incoming</th><th>Sales/day</th><th>Days of cover</th><th>Reorder point</th><th>Status</th></tr></thead><tbody>` +
    rows.map(r => `<tr><td>${esc(r.it.name)}</td><td>${r.b}</td><td>${inp(r, 'stock')}</td><td>${inp(r, 'incoming')}</td><td>${inp(r, 'demand')}</td><td class="n">${r.cover > 900 ? 'No sales' : r.cover.toFixed(1)}</td><td class="n">${Math.ceil(r.rop)}</td><td><span class="chip ${CLS[r.status]}">${r.status}</span></td></tr>`).join('') +
    (rows.length ? '' : '<tr><td colspan="8">No stock rows match these filters.</td></tr>') + '</tbody>';

  $('transfers').innerHTML = P.transfers.length
    ? P.transfers.map(t => `<li><b>Move ${t.q} × ${esc(t.it.name)}</b> from ${t.from} to ${t.to}. This avoids buying ${peso.format(t.saved)} of new stock.</li>`).join('')
    : '<li class="empty">No transfers needed. No branch has surplus that another branch needs.</li>';

  const funded = P.lines.filter(l => l.funded), bySup = {};
  funded.forEach(l => (bySup[l.it.supplier] ||= []).push(l));
  $('orders').innerHTML = Object.keys(bySup).length ? Object.entries(bySup).map(([s, ls]) => `
    <div class="po"><header><span>${esc(s)}</span><span>${peso.format(ls.reduce((a, l) => a + l.cost, 0))}</span></header>
    <table><thead><tr><th>Item</th><th>For branches</th><th>Qty</th><th>Lead time</th><th>Cost</th></tr></thead><tbody>${ls.map(l => `<tr><td>${esc(l.it.name)}</td><td>${l.where}</td><td class="n">${l.qty}</td><td class="n">${l.it.lead} days</td><td class="n">${peso.format(l.cost)}</td></tr>`).join('')}</tbody></table></div>`).join('')
    : '<p class="muted">No purchases needed right now.</p>';

  $('deferred').innerHTML = deferred.length
    ? deferred.map(l => `<li><b>${esc(l.it.name)}</b> (${esc(l.it.supplier)}): ${l.qty} units, ${peso.format(l.cost)}. Most urgent branch has ${l.urgency.toFixed(1)} days of cover. Raise the budget by ${peso.format(l.cost)} to fund it.</li>`).join('')
    : '<li class="empty">Everything needed fits in the budget.</li>';
  window.__plan = P;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable: plan still works */ }
}

$('stock').addEventListener('change', e => {
  const t = e.target; if (!t.dataset.f) return;
  const v = Number(t.value);
  S.items[t.dataset.id].br[t.dataset.b][t.dataset.f] = Number.isFinite(v) && v >= 0 ? v : 0;
  render();
});
$('safety').addEventListener('input', e => { S.safety = +e.target.value; render(); });
$('review').addEventListener('input', e => { S.review = +e.target.value; render(); });
$('budget').addEventListener('change', e => { S.budget = Math.max(0, +e.target.value || 0); render(); });
$('onlyAction').addEventListener('change', render);
$('stockSearch').addEventListener('input', render);
$('branchFilter').addEventListener('change', render);
$('statusFilter').addEventListener('change', render);
$('reset').addEventListener('click', () => { S = seed(); render(); });
$('csv').addEventListener('click', () => {
  const out = [['Supplier', 'Item', 'Branches', 'Quantity', 'Unit cost', 'Total']];
  window.__plan.lines.filter(l => l.funded).forEach(l => out.push([l.it.supplier, l.it.name, l.where, l.qty, l.it.cost, l.cost]));
  const blob = new Blob([out.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'purchase-orders.csv' });
  a.click(); URL.revokeObjectURL(a.href);
});
render();
