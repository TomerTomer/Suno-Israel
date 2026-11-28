(function () {
  'use strict';
  var D = window.AIMA_MAG;
  var FEED = '/api/public/content?type=news&limit=30';
  var ARCHIVE = 'archive.json';
  var root = document.getElementById('mag');
  var PAGE = 6, STEP = 5;

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }
  function safeUrl(u) { try { var x = new URL(u, location.href); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : '#'; } catch (e) { return '#'; } }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function fmt(iso) { var p = String(iso || '').slice(0, 10).split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : ''; }
  function link(href, site) { return h('a', { class: 'mag-src', href: safeUrl(href), target: '_blank', rel: 'noopener noreferrer' }, 'לכתבה ב-', h('bdi', { text: site }), ' ↗'); }
  function meta(m) { return h('div', { class: 'mag-meta' }, h('b', { text: m.tag }), h('span', { text: m.date })); }
  function fig(m) { return h('figure', null, h('img', { src: m.img, alt: m.alt, loading: 'lazy' }), h('figcaption', { text: m.credit })); }
  function rv(el) { el.classList.add('mag-rv'); return el; }

  function module_(m) {
    var body = [meta(m), h('h3', { text: m.head }), h('p', { text: m.body })];
    if (m.mean) body.push(h('p', { class: 'mag-mean' }, h('b', { text: 'מה זה אומר לנו: ' }), m.mean));
    body.push(link(m.src, m.site));
    var txt = function (kids) { var d = h('div', { class: 'mag-txt' }); kids.forEach(function (k) { d.appendChild(k); }); return d; };
    switch (m.kind) {
      case 'feature': case 'flip':
        return rv(h('article', { class: 'mag-mod mag-feature' + (m.kind === 'flip' ? ' is-flip' : '') }, fig(m), txt(body)));
      case 'overlay':
        return rv(h('article', { class: 'mag-mod mag-overlay' }, h('img', { src: m.img, alt: m.alt, loading: 'lazy' }),
          h('div', { class: 'mag-ov-in' }, meta(m), h('h3', { text: m.head }), h('p', { text: m.body }), link(m.src, m.site)),
          h('small', { class: 'mag-credit', text: m.credit })));
      case 'stat':
        return rv(h('article', { class: 'mag-mod mag-stat', style: '--h:' + (m.hue || 330) }, h('b', { class: 'mag-big', text: m.big }), txt(body)));
      case 'quote':
        return rv(h('article', { class: 'mag-mod mag-quotecard' }, meta(m), h('blockquote', { dir: 'ltr', text: m.quote }), h('h3', { text: m.head }), h('p', { text: m.body }), link(m.src, m.site)));
      case 'thumb':
        return rv(h('article', { class: 'mag-mod mag-thumb' }, fig(m), txt(body)));
      case 'pick':
        return rv(h('article', { class: 'mag-mod mag-pick', style: '--h:' + (m.hue || 285) }, h('span', { class: 'mag-kicker', text: m.tag }), h('h3', { dir: 'ltr', text: m.head }), h('p', { text: m.body }), link(m.src, m.site)));
      default:
        var p = m.date.split('.');
        return rv(h('article', { class: 'mag-mod mag-text' }, h('div', { class: 'mag-date' }, h('b', { text: p[0] }), h('span', { text: p.slice(1).join('.') })), txt(body)));
    }
  }

  /* Feed items that nobody has checked yet: headline, original headline, link, clear label. No feed summary. */
  function rawItem(it) {
    var site = host(it.url);
    var d = fmt(it.publishedAt).split('.');
    return rv(h('article', { class: 'mag-mod mag-raw' },
      h('div', { class: 'mag-date' }, h('b', { text: d[0] || '' }), h('span', { text: d.slice(1).join('.') })),
      h('div', { class: 'mag-txt' },
        h('div', { class: 'mag-meta' }, h('b', { class: 'mag-auto', text: 'עדכון אוטומטי · טרם נבדק מול המקור' })),
        h('h3', { text: it.title }),
        it.originalTitle ? h('p', { class: 'mag-orig', dir: 'ltr', text: it.originalTitle }) : null,
        link(it.url, site))));
  }

  function listen() {
    var cur = 0, on = false;
    var screen = h('div', { class: 'mag-screen' });
    var now = h('div', { class: 'mag-now' });
    var list = h('ul', { class: 'mag-songs' });
    function initials(s) { return (s.a.match(/[A-Za-z\u0590-\u05FF]/) || ['♪'])[0]; }
    function avatar(s, big) {
      return s.img ? h('img', { src: s.img, alt: '' }) : h('span', { class: 'mag-av' + (big ? ' is-big' : ''), 'aria-hidden': 'true', text: initials(s) });
    }
    function paint() {
      var s = D.songs[cur];
      screen.textContent = ''; now.textContent = '';
      if (s.audio) {
        if (on) {
          var a = h('audio', { src: s.audio, controls: '', preload: 'auto' });
          screen.appendChild(h('div', { class: 'mag-audio' }, avatar(s, true), a));
          a.play().catch(function () {});
        } else {
          var b = h('button', { type: 'button', class: 'mag-play', 'aria-label': 'נגנו את ' + s.t }, avatar(s, true), h('span', { text: '▶' }));
          b.addEventListener('click', function () { on = true; paint(); });
          screen.appendChild(b);
        }
        now.appendChild(h('b', { dir: 'auto', text: s.t })); now.appendChild(h('span', { text: s.a })); now.appendChild(h('em', { text: 'מתנגן כאן, בלי לצאת מהעמוד' }));
      } else {
        screen.appendChild(h('div', { class: 'mag-audio' }, avatar(s, true), h('a', { class: 'mag-btn', href: 'https://www.youtube.com/watch?v=' + encodeURIComponent(s.id), target: '_blank', rel: 'noopener noreferrer', text: 'להאזנה ב-YouTube ↗' })));
        now.appendChild(h('b', { dir: 'auto', text: s.t })); now.appendChild(h('span', { text: s.a })); now.appendChild(h('em', { text: 'נפתח ב-YouTube. השמעה כאן דורשת אישור מהיוצר.' }));
      }
      Array.prototype.forEach.call(list.children, function (li, i) { li.firstChild.className = i === cur ? 'is-on' : ''; });
    }
    D.songs.forEach(function (s, i) {
      var b = h('button', { type: 'button' }, avatar(s, false), h('span', null, h('b', { dir: 'auto', text: s.t }), h('i', { text: s.a })));
      b.addEventListener('click', function () { cur = i; on = !!s.audio; paint(); });
      list.appendChild(h('li', null, b));
    });
    var sec = rv(h('section', { class: 'mag-listen', 'aria-label': 'האזנה' },
      h('span', { class: 'mag-kicker', text: 'מהקהילה' }), h('h2', { text: 'פינת ההאזנה' }),
      h('p', { class: 'mag-lp', text: 'שירים של יוצרים מהקהילה, מהקישורים בספריית האמנים באתר. ההשמעה כאן מתחילה רק אחרי לחיצה.' }),
      h('div', { class: 'mag-player' }, screen, now), list));
    paint();
    return sec;
  }

  function head() {
    return h('header', { class: 'mag-mast' },
      h('div', { class: 'mag-mast-top' }, h('span', { class: 'mag-brand' }, 'A.I.M.A', h('small', { class: 'mag-brand-sub', text: 'AI Music Artists' })), h('span', { id: 'mag-issue', text: '' })),
      h('h1', null, 'PULSE', h('i', { text: '.' })),
      h('p', { class: 'mag-sub', text: 'מה קורה במוזיקת ה-AI, ומה זה משנה ליוצרים. בעברית, עם קישור למקור בכל כתבה.' }));
  }
  function cover() {
    var c = D.cover;
    return rv(h('section', { class: 'mag-cover', 'aria-label': 'הכתבה המרכזית' },
      h('figure', { class: 'mag-cover-img' }, h('img', { src: c.img, alt: c.alt }), h('figcaption', { text: c.credit })),
      h('div', { class: 'mag-cover-in' }, h('span', { class: 'mag-kicker', text: c.kicker }), h('h2', { text: c.head }), h('p', { text: c.body }),
        h('a', { class: 'mag-btn', href: safeUrl(c.src), target: '_blank', rel: 'noopener noreferrer' }, 'לכתבה ב-', h('bdi', { text: c.site }), ' ↗'))));
  }
  function numbers() {
    var n = D.numbers, g = h('div', { class: 'mag-stats' });
    n.items.forEach(function (x) { g.appendChild(h('div', null, h('b', { text: x[0] }), h('span', { text: x[1] }))); });
    return rv(h('section', { class: 'mag-numbers', 'aria-label': n.head }, h('h2', { class: 'mag-h', text: n.head }), g, h('p', { class: 'mag-note', text: n.note })));
  }

  var items = [];   // [{key, build}]
  var shown = 0, loading = false;
  var stream = h('section', { class: 'mag-stream', 'aria-label': 'כל החדשות' });
  var sentinel = h('div', { class: 'mag-sentinel' });
  var more = h('button', { type: 'button', class: 'mag-loadmore', text: 'עוד חדשות' });
  var end = h('p', { class: 'mag-end', text: 'זה סוף הארכיון. כתבות חדשות מצטרפות כאן מדי יום.' });
  var io;

  function reveal() {
    var els = stream.querySelectorAll('.mag-rv:not(.is-in)');
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(els, function (e) { e.classList.add('is-in'); }); return; }
    if (!reveal.io) reveal.io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); reveal.io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(els, function (e) { reveal.io.observe(e); });
  }
  function paintMore(n) {
    var upto = Math.min(items.length, shown + n);
    for (; shown < upto; shown++) {
      var it = items[shown];
      if (it.heading) stream.insertBefore(rv(h('h2', { class: 'mag-h mag-arch', text: it.heading })), sentinel);
      else stream.insertBefore(it.build(), sentinel);
      if (it.afterListen) { /* handled in build order */ }
    }
    more.style.display = shown < items.length ? '' : 'none';
    end.style.display = shown < items.length ? 'none' : '';
    reveal();
  }
  function loadMore() {
    if (loading || shown >= items.length) return;
    loading = true;
    setTimeout(function () { paintMore(STEP); loading = false; }, 350);
  }

  function compose(feed, stale, archiveItems) {
    var covered = {};
    D.cover.urls.forEach(function (u) { covered[u] = 1; });
    D.stories.forEach(function (s) { s.urls.forEach(function (u) { covered[u] = 1; }); });
    var list = [];
    D.stories.filter(function (s) { return !s.archive; }).forEach(function (s) { list.push({ iso: s.iso, rank: 1, build: function () { return module_(s); } }); });
    var liveUrls = {};
    (feed || []).forEach(function (f) {
      if (!f || !f.url || covered[f.url]) return;
      liveUrls[f.url] = 1;
      list.push({ iso: String(f.publishedAt || '').slice(0, 10), rank: 0, build: function () { return rawItem(f); } });
    });
    var V = list.filter(function (x) { return x.rank === 1; }), R = list.filter(function (x) { return x.rank === 0; });
    var byDate = function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0; };
    V.sort(byDate); R.sort(byDate);
    /* weave: two designed stories, then two new feed rows, so fresh items surface early without flattening the page */
    var out = [];
    while (V.length || R.length) {
      for (var i = 0; i < 2 && V.length; i++) out.push(V.shift());
      if (R.length) { var pr = R.splice(0, 2); out.push({ iso: pr[0].iso, rank: 0, build: (function (p) { return function () { var d = h('div', { class: 'mag-pair' }); p.forEach(function (x) { d.appendChild(x.build()); }); return d; }; })(pr) }); }
    }
    list = out.slice();
    var at = Math.min(3, out.length);
    out.splice(at, 0, { build: listen });
    /* Older items that already rolled out of the live feed: kept by the daily archive job, shown below as unreviewed rows */
    var old = (archiveItems || []).filter(function (a) { return a && a.url && !covered[a.url] && !liveUrls[a.url]; });
    old.sort(function (a, b) { var x = String(a.publishedAt || ''), y = String(b.publishedAt || ''); return x < y ? 1 : x > y ? -1 : 0; });
    if (old.length) {
      out.push({ heading: 'ארכיון החדשות' });
      for (var ai = 0; ai < old.length; ai += 2) {
        out.push({ build: (function (p) { return function () { var d = h('div', { class: 'mag-pair' }); p.forEach(function (x) { d.appendChild(rawItem(x)); }); return d; }; })(old.slice(ai, ai + 2)) });
      }
    }
    var arch = D.stories.filter(function (s) { return s.archive; });
    if (arch.length) { out.push({ heading: 'מהארכיון של Suno' }); arch.forEach(function (s) { out.push({ build: function () { return module_(s); } }); }); }
    items = out;
    var latest = list.reduce(function (m, x) { return x.iso > m ? x.iso : m; }, '');
    var el = document.getElementById('mag-issue');
    if (el) el.textContent = (stale ? 'גרסה שמורה · ' : 'גיליון ') + (fmt(latest) || '');
  }

  function start(feed, stale, archiveItems) {
    compose(feed, stale, archiveItems);
    stream.textContent = '';
    stream.appendChild(rv(h('h2', { class: 'mag-h', text: 'עוד מהשבוע' })));
    stream.appendChild(sentinel); stream.appendChild(more); stream.appendChild(end);
    shown = 0; paintMore(PAGE);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) loadMore(); }, { rootMargin: '0px 0px 240px 0px' });
      io.observe(sentinel);
    }
    more.addEventListener('click', loadMore);
  }

  root.appendChild(head());
  root.appendChild(cover());
  root.appendChild(numbers());
  root.appendChild(stream);
  root.appendChild(h('footer', { class: 'mag-foot' }, h('b', { text: 'A.I.M.A PULSE' }), h('span', { text: 'כתבות עם תמונה נבדקו מול המקור. תמונות לפי הקרדיט שליד כל אחת. שורות "טרם נבדק" מגיעות אוטומטית מהפיד ועדיין לא עברו בדיקה.' })));
  document.documentElement.classList.add('mag-js');

  /* Brand lockup on this standalone page (aima-static.js is not loaded here):
     subtitle under the header wordmark, community tagline in the footer. */
  (function brandLockup() {
    var name = document.querySelector('.site-header .brand > .brand-name');
    if (name && name.parentElement && !name.parentElement.classList.contains('brand-lockup')) {
      var wrap = h('span', { class: 'brand-lockup' });
      name.parentElement.insertBefore(wrap, name);
      wrap.appendChild(name);
      wrap.appendChild(h('span', { class: 'brand-sub', text: 'AI Music Artists' }));
    }
    var fp = document.querySelector('.footer-brand p');
    if (fp && fp.textContent.trim() === 'AI MUSIC ARTISTS ISRAEL') {
      fp.textContent = 'קהילת סונו ישראל | AI Music Artists';
      fp.classList.add('aima-footer-tag');
    }
  })();
  reveal.io = null;
  var cov = root.querySelectorAll('.mag-cover,.mag-numbers'); Array.prototype.forEach.call(cov, function (e) { e.classList.add('is-in'); });

  var started = false;
  var archP = fetch(ARCHIVE + '?fresh=' + Date.now(), { cache: 'no-store', headers: { accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('archive')); })
    .then(function (d) { return Array.isArray(d) ? d : (d && Array.isArray(d.items) ? d.items : []); })
    .catch(function () { return []; });
  function go(feedData, stale) {
    if (started) return;
    started = true; clearTimeout(timer);
    archP.then(function (arch) { start(feedData, stale, arch); });
  }
  var timer = setTimeout(function () { go(window.AIMA_SNAPSHOT || [], true); }, 6000);
  fetch(FEED + '&fresh=' + Date.now(), { cache: 'no-store', headers: { accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('feed')); })
    .then(function (d) { go(d && Array.isArray(d.items) ? d.items : [], false); })
    .catch(function () { go(window.AIMA_SNAPSHOT || [], true); });
})();
