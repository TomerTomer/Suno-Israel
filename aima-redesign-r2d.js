/* A.I.M.A homepage redesign, 2026-11-27. Homepage only. Adds elements next to the existing page; idempotent.
   Rollback: git tag rollback-pre-redesign-20261127. */
(() => {
  'use strict';
  const home = location.pathname === '/' || /^\/index\.html$/.test(location.pathname);
  if (!home) return;
  const root = document.documentElement;
  root.classList.add('r2');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = (tag, cls, text, attrs) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };
  const safeUrl = (u) => { if (!u || !/^https?:\/\//i.test(String(u).trim())) return ''; try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } };

  /* scroll progress + reveal */
  const bar = el('div', 'r2-progress', null, { 'aria-hidden': 'true' });
  document.body.append(bar);
  let tick = false;
  const prog = () => {
    tick = false;
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 }) : null;
  const reveal = (n) => { if (!io || n.dataset.r2rv) return; n.dataset.r2rv = '1'; n.classList.add('r2-rv'); io.observe(n); };
  if (io) root.classList.add('r2-js');

  /* data */
  let artists = null, photos = new Map();
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const loadData = () => Promise.all([
    fetch('/content/artists.json', { headers: { accept: 'application/json' } }).then((r) => r.ok ? r.json() : []).catch(() => []),
    fetch('/api/public/artist-images', { headers: { accept: 'application/json' } }).then((r) => r.ok ? r.json() : null).catch(() => null)
  ]).then(([a, p]) => {
    artists = Array.isArray(a) ? a.filter((x) => x && x.name) : [];
    if (p && Array.isArray(p.items)) p.items.forEach((i) => { if (i && typeof i.artistName === 'string' && /^\/api\/public\/artist-images\/artist-[a-f0-9-]+\.webp\?v=\d+$/i.test(i.image || '')) photos.set(norm(i.artistName), i.image); });
    ensure();
  });

  const bestLink = (a) => safeUrl(a.spotify) || safeUrl(a.youtube) || safeUrl(a.soundcloud) || safeUrl(a.other) || safeUrl(a.instagram) || safeUrl(a.tiktok) || safeUrl(a.facebook) || '';
  const initials = (n) => {
    const w = n.trim().split(/\s+/).filter(Boolean);
    if (/[A-Za-z]/.test(n)) return w.slice(0, 2).map((x) => (x.match(/[A-Za-z0-9]/) || [''])[0]).join('').toUpperCase() || n[0];
    return (w[0] || n).charAt(0);
  };
  const hue = (n) => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* hero extras */
  const hero = () => {
    const h = document.querySelector('.hero.shell');
    if (!h) return;
    const h1 = h.querySelector('h1');
    h.querySelectorAll('.r2-community').forEach((x) => x.remove());
    if (h1 && !h.querySelector('.r2-sub')) {
      const w = el('p', 'r2-sub');
      w.append(el('b', null, 'קהילה'), document.createTextNode(' אחת, מאות קולות, ומוזיקה חדשה שנולדת כאן.'));
      h1.after(w);
    }
    const acts = h.querySelector('.hero-actions');
    if (acts && !acts.querySelector('.r2-radio')) {
      const a = el('a', 'button r2-radio', null, { href: 'https://zikairadio.com/', target: '_blank', rel: 'noopener noreferrer' });
      a.append(el('span', 'r2-live', null, { 'aria-hidden': 'true' }), document.createTextNode('האזנה לרדיו ZIK'));
      acts.append(a);
    }
    if (!h.querySelector('.r2-eq')) {
      const eq = el('div', 'r2-eq', null, { 'aria-hidden': 'true' });
      for (let i = 0; i < 28; i++) { const b = el('i'); b.style.setProperty('--h', (25 + Math.round(Math.abs(Math.sin(i * 1.7)) * 75)) + '%'); b.style.setProperty('--d', (i * 0.07).toFixed(2) + 's'); eq.append(b); }
      (h.querySelector('.hero-copy') || h).append(eq);
    }
    const stat = h.querySelector('.r2-stat');
    if (artists && artists.length) {
      if (!stat) { const p = el('p', 'r2-stat'); p.append(el('strong', null, String(artists.length)), document.createTextNode(' אמנים בספריית הקהילה, ורדיו, מגזין ומשאבים במקום אחד')); (h.querySelector('.hero-copy') || h).append(p); }
    }
  };

  /* five destinations */
  const dest = () => {
    if (document.querySelector('.r2-dest')) return;
    const h = document.querySelector('.hero.shell');
    if (!h) return;
    const n = artists && artists.length ? artists.length : null;
    const items = [
      ['מה חדש השבוע', 'עדכוני Suno והמוזיקה עם AI, בעברית ברורה', '#aima-pulse', '#d9ff3f', '✦'],
      ['לגלות אמנים', n ? 'ספרייה של ' + n + ' אמנים מהקהילה. תנו לנו להפתיע אתכם' : 'ספריית האמנים של הקהילה. תנו לנו להפתיע אתכם', '/artists/', '#ff3d81', '♪'],
      ['רדיו', 'ZIK, הרדיו הקהילתי, ותוכניות A.I.M.A עם גיא רפאל ב-106FM', '/radio/', '#38f2c0', '◉'],
      ['מגזין PULSE', 'המגזין המעוצב: כתבות, מספרים וציטוטים', '/magazine/', '#a678ff', '▤'],
      ['משאבים', 'מדריכים, כלים וטיפים לכל שלב ביצירה', '/resources/', '#ffb23f', '⚒']
    ];
    const s = el('section', 'r2-dest', null, { 'aria-labelledby': 'r2-dest-h' });
    const hh = el('h2', null, 'לאן מתחילים?', { id: 'r2-dest-h' });
    hh.append(el('small', null, 'חמש דרכים להיכנס לקהילה. בחרו אחת, ותמיד יהיה צעד הבא.'));
    const g = el('div', 'r2-dest-grid');
    items.forEach((it, i) => {
      const a = el('a', 'r2-tile', null, { href: it[2] });
      a.style.setProperty('--c', it[3]);
      a.append(el('span', 'ic', it[4], { 'aria-hidden': 'true' }), el('span', 'n', '0' + (i + 1)), el('h3', null, it[0]), el('p', null, it[1]), el('span', 'go', 'כניסה ←'));
      if (it[2][0] === '#') a.addEventListener('click', (e) => { const t = document.querySelector(it[2]); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } });
      g.append(a);
    });
    s.append(hh, g);
    h.after(s);
    reveal(s);
  };

  /* pulse buttons: magazine beside the news-update buttons */
  const pulse = () => {
    const p = document.querySelector('#aima-pulse');
    if (!p) return;
    const mk = (cls) => el('a', 'r2-mag-link ' + (cls || ''), 'מגזין PULSE ←', { href: '/magazine/' });
    const top = p.querySelector('.aima-all-updates-top');
    if (top && !p.querySelector('.r2-pulse-btns')) {
      const row = el('div', 'r2-pulse-btns');
      top.before(row); row.append(top, mk());
    }
    const sideHead = p.querySelector('.pulse-side-head');
    if (sideHead && !sideHead.querySelector('.r2-mag-link')) sideHead.append(mk());
    const bottom = p.querySelector('.aima-all-updates-wrap');
    if (bottom && !bottom.querySelector('.aima-magazine-link, .r2-mag-link')) bottom.append(mk());
  };

  /* artists carousel */
  const carousel = () => {
    const anchor = document.querySelector('#resources');
    if (!anchor || document.querySelector('.r2-artists')) return;
    if (!artists || !artists.length) return;
    const pool = artists.filter((a) => bestLink(a) || photos.get(norm(a.name)));
    const sec = el('section', 'r2-artists', null, { id: 'r2-artists', 'aria-labelledby': 'r2-art-h' });
    const head = el('div', 'r2-art-head');
    const t = el('div'); t.append(el('p', 'eyebrow', 'OUR ARTISTS'));
    const h2 = el('h2', null, null, { id: 'r2-art-h' }); h2.append(document.createTextNode('האמנים שלנו. '), el('em', null, 'בכל ביקור הרכב אחר.')); t.append(h2);
    const ctl = el('div', 'r2-art-ctl');
    const bPrev = el('button', 'r2-btn', '→', { type: 'button', 'aria-label': 'האמן הקודם' });
    const bNext = el('button', 'r2-btn', '←', { type: 'button', 'aria-label': 'האמן הבא' });
    const bPlay = el('button', 'r2-btn', 'השהיה', { type: 'button', 'aria-pressed': 'false' });
    const bShuf = el('button', 'r2-btn', 'ערבוב חדש', { type: 'button' });
    const all = el('a', 'r2-btn', 'לכל האמנים ←', { href: '/artists/' });
    ctl.append(bPrev, bNext, bPlay, bShuf, all);
    head.append(t, ctl);
    const track = el('div', 'r2-track', null, { role: 'region', 'aria-label': 'קרוסלת אמנים', tabindex: '0' });
    const draw = () => {
      track.textContent = '';
      shuffle(pool).slice(0, 14).forEach((a) => {
        const link = bestLink(a) || '/artists/';
        const ext = /^https?:/.test(link) && new URL(link, location.href).origin !== location.origin;
        const c = el('a', 'r2-card', null, { href: link });
        if (ext) { c.target = '_blank'; c.rel = 'noopener noreferrer'; }
        const hv = hue(a.name);
        c.style.setProperty('--h', hv); c.style.setProperty('--c', 'hsl(' + hv + ' 80% 55%)');
        const pic = el('div', 'pic');
        const ph = photos.get(norm(a.name));
        if (ph) { const im = el('img', null, null, { src: ph, alt: 'תמונת האמן ' + a.name, loading: 'lazy' }); im.onerror = () => im.remove(); pic.append(im); } else pic.append(el('b', null, initials(a.name), { 'aria-hidden': 'true' }));
        const tx = el('div', 'txt');
        const g = String(a.genres || '').split(/[,;/]+/).map((x) => x.trim()).filter(Boolean).slice(0, 3).join(' · ');
        tx.append(el('h3', null, a.name), el('span', 'g', g), el('span', 'l', ext ? 'להאזנה ↗' : 'לפרופיל ←'));
        c.append(pic, tx); track.append(c);
      });
      track.scrollLeft = 0;
    };
    draw();
    const step = () => { const c = track.querySelector('.r2-card'); return c ? c.getBoundingClientRect().width + 16 : 280; };
    const move = (dir) => {
      const rtl = getComputedStyle(track).direction === 'rtl';
      const max = track.scrollWidth - track.clientWidth;
      const pos = Math.abs(track.scrollLeft);
      if (dir > 0 && pos >= max - 4) { track.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
      if (dir < 0 && pos <= 4) { track.scrollTo({ left: rtl ? -max : max, behavior: reduce ? 'auto' : 'smooth' }); return; }
      track.scrollBy({ left: (rtl ? -1 : 1) * dir * step(), behavior: reduce ? 'auto' : 'smooth' });
    };
    bNext.onclick = () => move(1); bPrev.onclick = () => move(-1);
    bShuf.onclick = draw;
    let paused = reduce, inView = false, timer = null, hover = false;
    const label = () => { bPlay.textContent = paused ? 'ניגון אוטומטי' : 'השהיה'; bPlay.setAttribute('aria-pressed', String(paused)); };
    label();
    bPlay.onclick = () => { paused = !paused; label(); };
    track.addEventListener('mouseenter', () => { hover = true; }); track.addEventListener('mouseleave', () => { hover = false; });
    track.addEventListener('focusin', () => { hover = true; }); track.addEventListener('focusout', () => { hover = false; });
    track.addEventListener('touchstart', () => { hover = true; }, { passive: true });
    track.addEventListener('touchend', () => { setTimeout(() => { hover = false; }, 4000); }, { passive: true });
    timer = setInterval(() => { if (!paused && inView && !hover && !document.hidden) move(1); }, 4200);
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { threshold: 0.3 }).observe(sec); else inView = true;
    const next = el('div', 'r2-next');
    next.append(el('span', null, 'מצאתם משהו שמדבר אליכם? הצעד הבא:'));
    next.append(el('a', 'r2-btn', 'ללמוד עם ספריית המשאבים ←', { href: '/resources/' }));
    sec.append(head, track, next);
    anchor.before(sec);
    reveal(sec);
  };

  /* next-step band before the footer */
  const journey = () => {
    const f = document.querySelector('footer.footer');
    if (!f || document.querySelector('.r2-journey')) return;
    const s = el('section', 'r2-journey', null, { 'aria-labelledby': 'r2-j-h' });
    s.append(el('h2', null, 'עוד לא סיימתם? יש לאן להמשיך.', { id: 'r2-j-h' }), el('p', null, 'כל פינה כאן מובילה לפינה הבאה. בחרו את הקרובה אליכם.'));
    const row = el('div', 'r2-journey-row');
    [['להאזין לרדיו ZIK', 'https://zikairadio.com/', 1], ['לדפדף במגזין PULSE', '/magazine/'], ['לגלות אמן חדש', '/artists/'], ['להתחיל ללמוד', '/guides.html'], ['להצטרף לחדרי הקהילה', '/community/']].forEach((x) => {
      const a = el('a', null, x[0], { href: x[1] });
      if (x[2]) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      row.append(a);
    });
    s.append(row);
    f.before(s);
    reveal(s);
  };

  const TITLE = 'A.I.M.A | קהילת יוצרי מוזיקה עם AI בישראל: אמנים, רדיו, מגזין ומשאבים';
  const DESC = 'A.I.M.A היא קהילת יוצרי המוזיקה עם AI בישראל. גלו אמנים, האזינו לרדיו ZIK, קראו את מגזין PULSE ומצאו מדריכים, כלים וטיפים ליצירה עם Suno.';
  const meta = () => {
    if (document.title !== TITLE) document.title = TITLE;
    const m = document.querySelector('meta[name="description"]');
    if (m && m.getAttribute('content') !== DESC) m.setAttribute('content', DESC);
  };
  const credit = () => {
    const fb = document.querySelector('footer.footer .footer-bottom');
    if (!fb) return;
    [...fb.children].forEach((x) => { if (!x.classList.contains('r2-credit') && x.textContent.trim() === '© 2026 A.I.M.A') x.classList.add('r2-dup-c'); });
    if (fb.querySelector('.r2-credit')) return;
    const c = el('span', 'r2-credit', 'מייסד הקהילה: תומר יאיר (Tomer Yair) · כל הזכויות שמורות © 2026 A.I.M.A');
    fb.prepend(c);
  };
  const ensure = () => { try { meta(); credit(); hero(); dest(); pulse(); carousel(); journey(); document.querySelectorAll('.pulse-section,.spotlight-section,#resources,.manifesto').forEach(reveal); } catch (e) { /* never break the page */ } };

  const hydrated = () => { const m = document.querySelector('main'); if (!m) return false; for (const k in m) if (k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactProps$') === 0) return true; return false; };
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (hydrated() || Date.now() - t0 > 15000) {
      clearInterval(iv);
      loadData();
      ensure();
      let q = false;
      new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; ensure(); }); }).observe(document.body, { childList: true, subtree: true });
    }
  }, 60);
  prog();
})();
