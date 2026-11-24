/* tentolouris-nutrition.gr: back-to-top, services orbit, BMI & metabolic rate calculator */
(function () {
  'use strict';
  var EN = (document.documentElement.lang || 'el').indexOf('en') === 0;
  var LOC = EN ? 'en-GB' : 'el-GR';

  /* ---------- back to top + progress ring ---------- */
  var top = document.querySelector('.totop');
  var ring = top ? top.querySelectorAll('circle')[1] : null;
  function onScroll() {
    if (!top) return;
    var d = document.documentElement;
    var y = window.scrollY || d.scrollTop || 0;
    var max = Math.max(1, d.scrollHeight - window.innerHeight);
    top.classList.toggle('on', y > 500);
    if (ring) ring.setAttribute('stroke-dashoffset', (169.6 * (1 - Math.min(1, y / max))).toFixed(1));
  }
  if (top) {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    top.addEventListener('click', function (e) {
      e.preventDefault();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { window.scrollTo(0, 0); }
    });
  }

  /* ---------- services orbit: tap / click to pick ---------- */
  var orb = document.querySelector('.orb');
  if (orb) {
    var under = document.querySelector('.orb-under');
    var sel = 0;
    var pick = function (n) {
      sel = sel === n ? 0 : n;
      orb.className = sel ? 'orb has-sel sel-' + sel : 'orb';
      orb.querySelectorAll('.oi').forEach(function (b) {
        b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-i')) === sel));
      });
      if (!under) return;
      var h = under.querySelector('h3'), p = under.querySelector('p');
      if (!sel) { h.textContent = ''; p.textContent = ''; return; }
      var panel = orb.querySelector('.oc' + sel);
      h.textContent = panel.querySelector('h3').textContent;
      p.textContent = panel.querySelector('p').textContent;
      h.style.color = panel.style.getPropertyValue('--c') || '#082244';
    };
    orb.querySelectorAll('.oi').forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function (e) { e.preventDefault(); pick(Number(b.getAttribute('data-i'))); });
    });
  }

  /* ---------- calculator ---------- */
  var form = document.querySelector('form.r');
  if (!form) return;
  var T = EN ? {
    eqs: 'Equations:', eq: 'Equation:', fill: 'Enter height and weight',
    note: 'An indicative estimate for adults aged 18–100. It is not a substitute for medical advice and does not replace a personalised assessment.',
    age: 'The calculation is for adults aged 18–100.',
    hw: 'Check your height (120–230 cm) and weight (30–300 kg).',
    bf: 'Body fat must be between 3% and 60%. If you don’t know it, leave it blank or type “?”.',
    lean: 'Katch-McArdle · lean mass ',
    cats: ['Underweight', 'Healthy weight', 'Overweight', 'Obesity']
  } : {
    eqs: 'Εξισώσεις:', eq: 'Εξίσωση:', fill: 'Συμπλήρωσε ύψος και βάρος',
    note: 'Ενδεικτική εκτίμηση για ενήλικες 18–100 ετών. Δεν υποκαθιστά ιατρική συμβουλή και δεν αντικαθιστά την εξατομικευμένη αξιολόγηση.',
    age: 'Ο υπολογισμός αφορά ενήλικες 18–100 ετών.',
    hw: 'Έλεγξε το ύψος (120–230 cm) και το βάρος (30–300 kg).',
    bf: 'Το ποσοστό λίπους πρέπει να είναι από 3% έως 60%. Αν δεν το γνωρίζεις, άφησέ το κενό ή γράψε «?».',
    lean: 'Katch-McArdle · άλιπη μάζα ',
    cats: ['Λιποβαρές', 'Φυσιολογικό βάρος', 'Υπέρβαρο', 'Παχυσαρκία']
  };
  var $ = function (id) { return document.getElementById(id); };
  var out = function (k, v) { var el = form.querySelector('[data-r="' + k + '"]'); if (el) el.textContent = v; };
  var gauge = form.querySelector('[data-gauge]');
  var num = function (x) { var n = parseFloat(String(x).replace(',', '.')); return isFinite(n) ? n : NaN; };
  var fmt = function (n, d) { return n.toLocaleString(LOC, d ? { minimumFractionDigits: d, maximumFractionDigits: d } : undefined); };

  function calc() {
    var sex = $('cl-sex').value, palV = $('cl-pal').value;
    var ageS = $('cl-age').value, hS = $('cl-h').value, wS = $('cl-w').value;
    var bfRaw = String($('cl-bf').value || '').trim();
    var a = num(ageS), h = num(hS), w = num(wS), bfNum = num(bfRaw);
    var useKM = bfRaw !== '' && bfRaw !== '?' && bfRaw !== ';';
    var pal = num(palV) || 1.375;

    form.querySelectorAll('[data-pk]').forEach(function (r) {
      var vals = ['1.2', '1.375', '1.55', '1.725', '1.9'];
      r.className = vals[Number(r.getAttribute('data-pk'))] === palV ? 'pk on' : 'pk';
    });

    var reset = function (note) {
      out('bmr', '—'); out('tdee', '—'); out('bmi', '—'); out('cat', T.fill);
      out('method', 'Mifflin-St Jeor & Katch-McArdle'); out('eqk', T.eqs); out('note', note || T.note);
      if (gauge) { gauge.className = 'off'; gauge.style.left = '0%'; }
    };
    if (!ageS && !hS && !wS) return reset();
    if (!(a >= 18 && a <= 100)) return reset(T.age);
    if (!(h >= 120 && h <= 230) || !(w >= 30 && w <= 300)) return reset(T.hw);
    if (useKM && !(bfNum >= 3 && bfNum <= 60)) return reset(T.bf);

    var lbm = useKM ? w * (1 - bfNum / 100) : 0;
    var bmr = useKM ? 370 + 21.6 * lbm : 10 * w + 6.25 * h - 5 * a + (sex === 'm' ? 5 : -161);
    var bmi = w / Math.pow(h / 100, 2);
    var cat = bmi < 18.5 ? T.cats[0] : bmi < 25 ? T.cats[1] : bmi < 30 ? T.cats[2] : T.cats[3];
    out('bmr', fmt(Math.round(bmr / 10) * 10));
    out('tdee', fmt(Math.round(bmr * pal / 10) * 10));
    out('bmi', fmt(bmi, 1));
    out('cat', cat);
    out('eqk', T.eq);
    out('method', useKM ? T.lean + fmt(lbm, 1) + ' kg' : 'Mifflin-St Jeor');
    out('note', T.note);
    if (gauge) { gauge.className = 'on'; gauge.style.left = Math.max(0, Math.min(100, (bmi - 15) / 25 * 100)).toFixed(1) + '%'; }
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calc(); });
  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  calc();
})();
