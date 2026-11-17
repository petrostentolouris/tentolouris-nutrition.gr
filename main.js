(function () {
  'use strict';
  var d = document;
  d.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 300;
    if (reduce) { el.textContent = target + '+'; return; }
    var t0 = performance.now(), dur = 1600;
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var v = Math.max(1, Math.round((1 - Math.pow(1 - p, 3)) * target));
      el.textContent = p < 1 ? String(v) : target + '+';
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function runType(container) {
    var ps = container.querySelectorAll('p.tw');
    if (!ps.length || reduce) return;
    var items = [];
    ps.forEach(function (p) {
      var full = p.textContent;
      p.textContent = '';
      var sr = d.createElement('span'); sr.className = 'pt-sr'; sr.textContent = full; p.appendChild(sr);
      var shown = d.createElement('span'); shown.setAttribute('aria-hidden', 'true');
      var caret = d.createElement('span'); caret.className = 'pt-caret'; caret.setAttribute('aria-hidden', 'true');
      var rest = d.createElement('span'); rest.setAttribute('aria-hidden', 'true'); rest.style.color = 'transparent'; rest.textContent = full;
      p.appendChild(shown); p.appendChild(rest);
      items.push({ full: full, shown: shown, rest: rest, caret: caret, p: p });
    });
    var i = 0, k = 0;
    function tick() {
      var it = items[i];
      if (!it) return;
      k = Math.min(it.full.length, k + 2);
      it.shown.textContent = it.full.slice(0, k);
      it.rest.textContent = it.full.slice(k);
      if (k < it.full.length) { it.p.insertBefore(it.caret, it.rest); } else if (it.caret.parentNode) { it.caret.remove(); }
      var ch = it.full.charAt(k - 1);
      if (k >= it.full.length) { i++; k = 0; }
      if (i < items.length) setTimeout(tick, ch === '.' ? 260 : (ch === ',' ? 90 : 22));
    }
    setTimeout(tick, 500);
  }

  var rv = d.querySelectorAll('.rv');
  function reveal(el) {
    el.classList.add('in');
    var c = el.querySelector('[data-count]'); if (c) runCount(c);
    if (el.querySelector('p.tw')) runType(el);
  }
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); reveal(e.target); } });
    }, { threshold: 0.15 });
    rv.forEach(function (el) { io.observe(el); });
  }

  // Pause / resume reviews
  d.querySelectorAll('.pt-pause').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = d.querySelector('.pt-marq'); if (!m) return;
      var paused = m.classList.toggle('paused');
      b.setAttribute('aria-pressed', paused ? 'true' : 'false');
      b.textContent = paused ? '▶ ' + b.getAttribute('data-label-play') : '❚❚ ' + b.getAttribute('data-label-pause');
    });
  });

  // Calculator
  var form = d.getElementById('calc-form');
  if (form) {
    var L = JSON.parse(d.getElementById('calc-i18n').textContent);
    var $ = function (id) { return d.getElementById(id); };
    var num = function (x) { var n = parseFloat(String(x).replace(',', '.')); return isFinite(n) ? n : NaN; };
    var fmt = function (n, dgt) { return n.toLocaleString(L.locale, { minimumFractionDigits: dgt, maximumFractionDigits: dgt }); };
    function show(state) {
      $('calc-empty').hidden = state !== 'empty';
      $('calc-invalid').hidden = state !== 'invalid';
      $('calc-ok').hidden = state !== 'ok';
    }
    function calc() {
      var sex = $('calc-sex').value, a = num($('calc-age').value), h = num($('calc-height').value),
          w = num($('calc-weight').value), act = num($('calc-act').value), bfRaw = $('calc-bf').value.trim(), bf = num(bfRaw);
      if (!$('calc-age').value && !$('calc-height').value && !$('calc-weight').value) return show('empty');
      var msg = '';
      if (!(a >= 18 && a <= 100)) msg = L.errAge;
      else if (!(h >= 120 && h <= 230) || !(w >= 30 && w <= 300)) msg = L.errHW;
      else if (bfRaw && !(bf >= 3 && bf <= 60)) msg = L.errBf;
      if (msg) { $('calc-msg').textContent = msg; return show('invalid'); }
      var bmi = w / Math.pow(h / 100, 2);
      var cat = bmi < 18.5 ? L.under : bmi < 25 ? L.normal : bmi < 30 ? L.over : L.obese;
      var useKM = !!bfRaw, lbm = useKM ? w * (1 - bf / 100) : 0;
      var bmr = useKM ? 370 + 21.6 * lbm : 10 * w + 6.25 * h - 5 * a + (sex === 'm' ? 5 : -161);
      $('calc-bmi').textContent = fmt(bmi, 1);
      $('calc-cat').textContent = cat;
      $('calc-marker').style.left = Math.max(0, Math.min(100, (bmi - 15) / 25 * 100)) + '%';
      $('calc-bmr').textContent = fmt(Math.round(bmr / 10) * 10, 0);
      $('calc-tdee').textContent = fmt(Math.round(bmr * act / 10) * 10, 0);
      $('calc-method').textContent = useKM ? L.methodKM.replace('{lbm}', fmt(lbm, 1)) : L.methodMSJ;
      show('ok');
    }
    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    form.addEventListener('submit', function (e) { e.preventDefault(); calc(); });
  }
})();
