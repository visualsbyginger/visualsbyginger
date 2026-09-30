/* visualsbyginger. – Frontend */
(function () {
  'use strict';
  var D = window.VBG || { items: [], cats: {}, i18n: {}, isFront: false };
  var $ = function (s) { return document.querySelector(s); };
  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var lang = store.get('lang') === 'en' ? 'en' : 'de';
  var en = function () { return lang === 'en'; };

  var ITEMS = D.items || [];
  var CATS = D.cats || {};
  var catLabel = function (c) { return c === 'all' ? (en() ? 'All' : 'Alle') : (CATS[c] ? CATS[c][en() ? 1 : 0] : c); };
  var alt = function (it) { return en() ? it.e : it.a; };

  var render = function () {};
  var pjRefresh = function () {};
  var openFromHash = function () {};
  var cfRefresh = function () {};
  var mqText = function () {};
  var lb = null, show = function () {};

  if (D.isFront) {
    /* Laufende Bildspalten im Startbild */
    var small = matchMedia('(max-width: 820px)').matches;
    var durs = small ? [150, 185] : [240, 300, 270, 330], cols = $('#cols');
    if (cols && ITEMS.length) {
      for (var c = 0; c < durs.length; c++) {
        // Handy: nur 2 Laufbänder mit je 8 Bildern, damit weniger geladen und bewegt werden muss
        var part = small
          ? ITEMS.filter(function (_, i) { return i % 6 === c * 3; }).slice(0, 8)
          : ITEMS.filter(function (_, i) { return i % 4 === c; });
        if (!part.length) part = ITEMS.slice(0);
        var s = document.createElement('div');
        s.className = 'strip' + (c % 2 ? ' dn' : '');
        s.style.setProperty('--d', durs[c] + 's');
        part.concat(part).forEach(function (it) {
          var im = document.createElement('img');
          im.src = it.s; im.alt = ''; im.width = it.sw; im.height = it.sh; im.decoding = 'async';
          s.appendChild(im);
        });
        cols.appendChild(s);
      }
    }

    /* Laufband */
    mqText = function () {
      var keys = ['autos', 'motorraeder', 'tiere', 'portraet', 'produkte'];
      var words = keys.map(catLabel);
      $('#mq').innerHTML = [0, 1].map(function () {
        return words.map(function (w) { return w + '<b>.</b>'; }).join(' ') + ' ';
      }).join(' ').repeat(2);
    };
    mqText();

    /* Projekte: Bilder mit gleichem Projektnamen bilden eine Serie */
    var PROJ = [], byKey = {};
    ITEMS.forEach(function (it, i) {
      var key = it.p ? 'p:' + it.p : 'i:' + (it.id || i);
      if (!byKey[key]) {
        byKey[key] = { de: it.p || it.a, en: it.pe || it.p || it.e, hasEn: !!it.pe, c: it.c, items: [] };
        PROJ.push(byKey[key]);
      }
      if (it.pe && !byKey[key].hasEn) { byKey[key].en = it.pe; byKey[key].hasEn = true; }
      byKey[key].items.push(it);
    });
    var slugify = function (s) {
      return String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };
    var used = {};
    PROJ.forEach(function (p) {
      var s = slugify(p.de) || 'projekt', n = 2, base = s;
      while (used[s]) { s = base + '-' + n++; }
      used[s] = 1; p.slug = s;
    });
    var T = function (k) { var v = (D.i18n || {})[k]; if (!v) return k; var d = document.createElement('div'); d.innerHTML = v[lang]; return d.textContent; };
    var ptitle = function (p) { return en() ? p.en : p.de; };
    var pcount = function (p) { return p.items.length + ' ' + T(p.items.length === 1 ? 'img_one' : 'img_many'); };

    var cur = 'all', shownP = [], wantRows = 3;
    var g = $('#gallery'), f = $('.filters'), more = $('#more');
    var pool = function () { return cur === 'all' ? PROJ : PROJ.filter(function (p) { return p.c === cur; }); };
    var colsNow = function () {
      var w = g.clientWidth || (g.parentElement && g.parentElement.clientWidth) || 1000;
      var gap = parseFloat(getComputedStyle(g).columnGap) || 18;
      if (w < 620) return 2; // Handy: immer zwei Spalten
      return Math.max(1, Math.floor((w + gap) / (290 + gap)));
    };
    var draw = function () {
      var all = pool(), cn = colsNow(), n = Math.min(wantRows * cn, all.length);
      if (n < all.length) { n = Math.floor(n / cn) * cn; if (n === 0) n = Math.min(cn, all.length); }
      var before = g.children.length;
      shownP = all.slice(0, n); g.innerHTML = '';
      shownP.forEach(function (p, i) {
        var cover = p.items[0];
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tile';
        b.setAttribute('aria-label', ptitle(p) + ', ' + pcount(p));
        b.style.animationDelay = (i >= before ? (i - before) % 8 : i % 8) * 70 + 'ms';
        var ph = document.createElement('span'); ph.className = 'ph';
        var im = document.createElement('img');
        im.src = cover.s; im.alt = ''; im.width = cover.sw; im.height = cover.sh; im.loading = 'lazy'; im.decoding = 'async';
        var cnt = document.createElement('span'); cnt.className = 'cnt'; cnt.textContent = pcount(p);
        ph.appendChild(im); ph.appendChild(cnt);
        var h = document.createElement('h3'); h.textContent = ptitle(p);
        var c = document.createElement('span'); c.className = 'cat'; c.textContent = catLabel(p.c);
        b.appendChild(ph); b.appendChild(h); b.appendChild(c);
        b.addEventListener('click', function () { openProject(PROJ.indexOf(p), true); });
        b.addEventListener('pointermove', function (e) {
          if (e.pointerType !== 'mouse') return;
          var r = ph.getBoundingClientRect();
          ph.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          ph.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        });
        b.addEventListener('pointerleave', function () { ph.style.removeProperty('--mx'); ph.style.removeProperty('--my'); });
        g.appendChild(b);
      });
      var left = all.length - shownP.length;
      more.hidden = left <= 0;
      more.textContent = (en() ? 'Show more (' : 'Mehr sehen (') + left + ')';
    };
    render = function () {
      wantRows = colsNow() <= 2 ? 4 : 3; draw();
      f.querySelectorAll('button').forEach(function (x) {
        x.setAttribute('aria-pressed', x.dataset.c === cur);
        x.textContent = catLabel(x.dataset.c);
      });
    };
    more.addEventListener('click', function () { wantRows += 3; draw(); });
    var rtick = false, lastCols = 0;
    addEventListener('resize', function () {
      if (!rtick) { rtick = true; requestAnimationFrame(function () { var c = colsNow(); if (c !== lastCols) { lastCols = c; draw(); } rtick = false; }); }
    });
    var present = {}; PROJ.forEach(function (p) { present[p.c] = 1; });
    ['all'].concat(Object.keys(CATS).filter(function (k) { return present[k]; })).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.c = c; b.textContent = catLabel(c);
      b.addEventListener('click', function () { cur = c; render(); });
      f.appendChild(b);
    });

    /* Serien-Ansicht */
    var pj = $('#pj'), pjGrid = $('#pj-grid'), pjIdx = -1, pushed = false;
    var nextOf = function (i) { var list = pool(); var k = list.indexOf(PROJ[i]); if (k < 0) list = PROJ, k = i; return PROJ.indexOf(list[(k + 1) % list.length]); };
    var fillProject = function () {
      var p = PROJ[pjIdx]; if (!p) return;
      var h = $('#pj-title'), dot = document.createElement('b'), n = 0;
      h.textContent = '';
      h.setAttribute('aria-label', ptitle(p));
      ptitle(p).replace(/\.$/, '').split(' ').forEach(function (word, wi) {
        if (wi) h.appendChild(document.createTextNode(' '));
        var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        word.split('').forEach(function (ch) {
          var l = document.createElement('span'); l.className = 'l'; l.textContent = ch;
          l.style.animationDelay = (n++ * 22) + 'ms'; w.appendChild(l);
        });
        h.appendChild(w);
      });
      dot.textContent = '.'; dot.setAttribute('aria-hidden', 'true'); dot.style.animationDelay = (n * 22 + 80) + 'ms'; h.appendChild(dot);
      $('#pj-meta').textContent = catLabel(p.c) + ', ' + pcount(p);
      $('#pj-close').setAttribute('aria-label', T('close'));
      pjGrid.innerHTML = '';
      p.items.forEach(function (it, k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', (en() ? 'Enlarge image: ' : 'Bild vergrößern: ') + alt(it));
        var im = document.createElement('img');
        im.src = it.l; im.alt = alt(it); im.width = it.w; im.height = it.h; im.decoding = 'async'; if (k > 1) im.loading = 'lazy';
        b.appendChild(im);
        b.addEventListener('click', function () { openLb(p.items, k); });
        pjGrid.appendChild(b);
      });
      var nx = PROJ[nextOf(pjIdx)];
      var nb = $('#pj-next');
      nb.hidden = PROJ.length < 2;
      $('#pj-next-t').textContent = ptitle(nx);
      var ni = $('#pj-next-img'); ni.src = nx.items[0].s; ni.alt = '';
    };
    pjRefresh = function () { if (pj.open) fillProject(); };
    var openProject = function (i, push) {
      if (!PROJ[i]) return;
      pjIdx = i; fillProject();
      if (!pj.open) { pj.showModal(); root.classList.add('pj-open'); }
      try { pj.focus({ preventScroll: true }); } catch (e) { pj.focus(); }
      pj.scrollTop = 0;
      if (push) {
        try {
          if (pushed) history.replaceState({ vbgpj: 1 }, '', '#p-' + PROJ[i].slug);
          else { history.pushState({ vbgpj: 1 }, '', '#p-' + PROJ[i].slug); pushed = true; }
        } catch (e) {}
      }
    };
    var closeProject = function () {
      if (pj.open) pj.close();
    };
    pj.addEventListener('close', function () {
      root.classList.remove('pj-open');
      if (pushed) { pushed = false; try { history.back(); } catch (e) {} }
    });
    $('#pj-close').addEventListener('click', closeProject);
    $('#pj-next').addEventListener('click', function () { openProject(nextOf(pjIdx), true); });
    var fromHash = function () {
      var m = /^#p-([a-z0-9-]+)$/.exec(location.hash || '');
      if (!m) { if (pj.open) { pushed = false; pj.close(); } return; }
      for (var k = 0; k < PROJ.length; k++) if (PROJ[k].slug === m[1]) { openProject(k, false); return; }
    };
    addEventListener('popstate', function () { pushed = false; fromHash(); });
    openFromHash = fromHash;

    /* Großansicht innerhalb einer Serie */
    lb = $('#lb');
    var li = $('#li'), lc = $('#lc'), lbList = [], idx = 0;
    var still = matchMedia('(prefers-reduced-motion: reduce)');
    show = function () {
      var it = lbList[idx]; if (!it) return;
      li.src = it.l; li.alt = alt(it); lc.textContent = alt(it);
      if (!still.matches && li.animate) {
        li.animate([{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }], { duration: 560, easing: 'cubic-bezier(.2,.7,.2,1)' });
        lc.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 200, fill: 'backwards' });
      }
    };
    var openLb = function (list, n) { lbList = list; idx = n; show(); lb.showModal(); };
    var step = function (d) { idx = (idx + d + lbList.length) % lbList.length; show(); };
    $('#cl').addEventListener('click', function () { lb.close(); });
    lb.querySelector('.pv').addEventListener('click', function () { step(-1); });
    lb.querySelector('.nx').addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb')) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    // Wischen auf dem Handy
    var tx = null, ty = 0;
    lb.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) lb.close();
    }, { passive: true });

    /* Schriftzug im Startbild einpassen, Parallax beim Scrollen */
    var wm = $('.wm'), wt = $('#wt'), hero = $('.hero');
    var fit = function () {
      wm.style.fontSize = '100px';
      var w = wt.getBoundingClientRect().width;
      wm.style.fontSize = Math.min(220, 100 * hero.clientWidth * 0.9 / w) + 'px';
    };
    fit(); addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    // Nur das Logo im Startbild bewegen (nicht die ganze Seite neu berechnen) und nur solange es sichtbar ist
    var tick = false, lastSy = -1;
    addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var sy = Math.min(Math.round(scrollY), 900);
        if (sy === lastSy) return;
        lastSy = sy; wm.style.setProperty('--sy', sy);
      });
    }, { passive: true });

    /* Ladeanimation (einmal pro Besuch) */
    var rmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var endLoad = function () {
      document.body.classList.remove('loading');
      try { sessionStorage.setItem('vbg_seen', '1'); } catch (e) {}
      var l = $('#loader'); if (!l) return;
      l.classList.add('hide'); setTimeout(function () { l.remove(); }, 650);
    };
    if ($('#loader') && /^#p-/.test(location.hash || '')) { endLoad(); }
    if ($('#loader')) {
      var loadWait = 1200;
      if (!rmo) {
        var parts = [['visuals', 0], ['by', 1], ['ginger', 0], ['.', 1]], lt = $('#ldtxt'), k = 0;
        parts.forEach(function (p) {
          var wrap = document.createElement(p[1] ? 'b' : 'span');
          p[0].split('').forEach(function (ch) {
            var sEl = document.createElement('span');
            sEl.className = 'ch'; sEl.textContent = ch; sEl.style.animationDelay = (k * 38) + 'ms'; k++;
            wrap.appendChild(sEl);
          });
          lt.appendChild(wrap);
        });
        loadWait = k * 38 + 700 + 350;
        addEventListener('load', function () { setTimeout(endLoad, loadWait); });
        setTimeout(endLoad, loadWait + 900);
      } else {
        endLoad();
      }
    }

    /* Kontaktformular */
    var cf = $('#cf'), form = $('#cf-form'), C = D.contact || {};
    if (cf && form) {
      var svcKeys = ['li1', 'li3', 'li4'], chosen = 'li1', openedAt = 0;
      var status = $('#cf-status'), send = $('#cf-send'), done = $('#cf-done');
      var txt = function (k) { var v = (D.i18n || {})[k]; if (!v) return ''; var d = document.createElement('div'); d.innerHTML = v[lang]; return d.textContent; };
      cfRefresh = function () {
        var sel = $('#cf-service'), keep = sel.value || chosen;
        sel.innerHTML = '';
        svcKeys.concat(['cf_other']).forEach(function (k) {
          var o = document.createElement('option'); o.value = k; o.textContent = txt(k); sel.appendChild(o);
        });
        sel.value = keep;
        $('#cf-mail').textContent = C.mail || '';
        var pl = $('#cf-privacy'); if (C.privacy) { pl.href = C.privacy; pl.hidden = false; } else { pl.hidden = true; }
        $('#cf-message').placeholder = txt('cf_msg_ph');
        $('#cf-close').setAttribute('aria-label', en() ? 'Close' : 'Schließen');
        form.querySelectorAll('.cf-e').forEach(function (e) { if (e.textContent) e.textContent = txt(e.dataset.k || 'cf_need'); });
      };
      var setErr = function (name, key) {
        var e = form.querySelector('.cf-e[data-for="' + name + '"]'), f = form.elements[name];
        if (e) { e.dataset.k = key || ''; e.textContent = key ? txt(key) : ''; }
        if (f && f.type !== 'checkbox') f.setAttribute('aria-invalid', key ? 'true' : 'false');
      };
      var showStatus = function (key, info) {
        status.hidden = !key; status.className = 'cf-msg' + (info ? ' info' : ''); status.textContent = key ? txt(key) : '';
      };
      var openCf = function (svc) {
        chosen = svc || 'li1'; cfRefresh(); $('#cf-service').value = chosen;
        form.hidden = false; done.hidden = true; showStatus('');
        ['name', 'email', 'message', 'consent'].forEach(function (n) { setErr(n, ''); });
        openedAt = Math.floor(Date.now() / 1000);
        if (!cf.open) { cf.showModal(); root.classList.add('cf-open'); }
        setTimeout(function () { $('#cf-name').focus(); }, 60);
      };
      cf.addEventListener('close', function () { root.classList.remove('cf-open'); });
      cf.addEventListener('click', function (e) { if (e.target === cf) cf.close(); });
      $('#cf-close').addEventListener('click', function () { cf.close(); });
      $('#cf-new').addEventListener('click', function () { form.reset(); openCf(chosen); });
      document.querySelectorAll('.list li').forEach(function (li) {
        var b = li.querySelector('.req');
        li.addEventListener('click', function () { openCf(b ? b.dataset.svc : 'li1'); });
      });
      form.addEventListener('input', function (e) { if (e.target.name) setErr(e.target.name, ''); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true, el = form.elements;
        if (!el.name.value.trim()) { setErr('name', 'cf_need'); ok = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.email.value.trim())) { setErr('email', 'cf_need_mail'); ok = false; }
        if (el.message.value.trim().length < 5) { setErr('message', 'cf_need'); ok = false; }
        if (!el.consent.checked) { setErr('consent', 'cf_need_ok'); ok = false; }
        if (!ok) { var first = form.querySelector('[aria-invalid="true"]') || el.consent; first.focus(); return; }
        if (!C.ajax) { showStatus('cf_demo', true); return; }
        var fd = new FormData(form);
        fd.set('service', txt(el.service.value));
        fd.set('action', 'vbg_contact'); fd.set('t', String(openedAt)); fd.set('lang', lang);
        send.disabled = true; send.textContent = txt('cf_sending'); showStatus('');
        fetch(C.ajax, { method: 'POST', body: fd, credentials: 'same-origin' })
          .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
          .then(function (res) {
            if (res && res.success) { form.reset(); form.hidden = true; done.hidden = false; return; }
            var code = res && res.data && res.data.code;
            if (code === 'invalid' && res.data.fields) { res.data.fields.forEach(function (n) { setErr(n, n === 'email' ? 'cf_need_mail' : n === 'consent' ? 'cf_need_ok' : 'cf_need'); }); return; }
            showStatus(code === 'wait' ? 'cf_wait' : 'cf_err');
          })
          .catch(function () { showStatus('cf_err'); })
          .then(function () { send.disabled = false; send.textContent = txt('cf_send'); });
      });
    }

    /* Cursor (nur mit Maus) */
    if (matchMedia('(pointer:fine)').matches) {
      var cu = $('#cur'), cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
      addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; cu.classList.add('on'); });
      (function loop() {
        cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
        cu.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
        requestAnimationFrame(loop);
      })();
      document.addEventListener('pointerover', function (e) { cu.classList.toggle('big', !!e.target.closest('.gallery .tile')); });
      document.addEventListener('mouseleave', function () { cu.classList.remove('on'); });
    }
  }

  /* Sprache DE / EN */
  var baseTitle = document.title;
  var applyLang = function () {
    var T = D.i18n || {};
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = T[el.dataset.i18n]; if (v) el.innerHTML = v[lang];
    });
    root.lang = en() ? 'en' : 'de-DE';
    var lg = $('#lg');
    lg.textContent = en() ? 'DE' : 'EN';
    lg.setAttribute('aria-label', en() ? 'Auf Deutsch wechseln' : 'Switch to English');
    $('.mk').setAttribute('aria-label', en() ? 'visualsbyginger, back to top' : 'visualsbyginger, nach oben');
    if (D.isFront) {
      if (T.meta_title) {
        var tmp = document.createElement('div'); tmp.innerHTML = T.meta_title[lang];
        document.title = 'visualsbyginger. – ' + tmp.textContent;
      }
      $('.filters').setAttribute('aria-label', en() ? 'Choose category' : 'Kategorie wählen');
      lb.setAttribute('aria-label', en() ? 'Image view' : 'Bildansicht');
      $('#cl').setAttribute('aria-label', en() ? 'Close' : 'Schließen');
      lb.querySelector('.pv').setAttribute('aria-label', en() ? 'Previous image' : 'Vorheriges Bild');
      lb.querySelector('.nx').setAttribute('aria-label', en() ? 'Next image' : 'Nächstes Bild');
      $('#cur .lbl').textContent = en() ? 'View' : 'Ansehen';
      mqText(); render(); pjRefresh(); cfRefresh();
      if (lb.open) show();
    } else {
      document.title = baseTitle;
    }
  };
  $('#lg').addEventListener('click', function () { lang = en() ? 'de' : 'en'; store.set('lang', lang); applyLang(); });
  applyLang();
  if (D.isFront) openFromHash();
})();
