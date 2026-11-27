/* A.I.M.A homepage polish pass — user brief 2026-11-27 (46 numbered items). Homepage only; idempotent.
   Loads after aima-redesign-r2g.js. Rollback: git tag rollback-pre-polish-20261127 (branch backup/pre-polish-2026-11-27). */
(() => {
  'use strict';
  const home = location.pathname === '/' || /^\/index\.html$/.test(location.pathname);
  if (!home) return;
  document.documentElement.classList.add('p1');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, cls, text, attrs) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  /* ISO week (same convention as the weekly-song rotation in the site bundle) */
  const isoWeek = (d) => {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const n = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - n);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 864e5 + 1) / 7);
  };
  const fmtDate = (iso) => {
    const d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
    return isNaN(d) ? String(iso || '') : new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  };

  /* consent-respecting analytics: gtag exists only after the visitor opted in */
  const track = (name, params) => { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {} };
  if (!window.__p1Tracking) {
    window.__p1Tracking = 1;
    document.addEventListener('click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a,button') : null;
      if (!a) return;
      if (a.closest('.p1-week')) return track('week_strip_click', { link: a.getAttribute('href') || '' });
      if (a.closest('.r2-radio') || (a.closest('.channel-card') && /zikairadio/.test(a.href || ''))) return track('zik_click', { location: a.closest('.channel-card') ? 'entries' : 'hero' });
      if (a.closest('.header-cta')) return track('join_click', { location: 'header' });
      if (a.closest('.channel-card') && /facebook\.com\/groups|chat\.whatsapp\.com/.test(a.href || '')) return track('join_click', { location: 'entries' });
    }, { passive: true });
  }

  /* header + footer: one name, PULSE; language toggle; support stays only here (item 30) */
  const headerFooter = () => {
    $$('.main-nav a, .mobile-nav a, .footer a').forEach((a) => {
      if (a.textContent.trim() === 'חדשות ועדכונים') a.textContent = 'PULSE';
    });
    const actions = $('.site-header .header-actions');
    if (actions && !$('.p1-lang')) {
      const t = el('span', 'p1-lang');
      const he = el('b', null, 'עב', { 'aria-current': 'true' });
      const en = el('a', null, 'EN', { href: '/en/', hreflang: 'en', lang: 'en', 'aria-label': 'Switch to English' });
      en.addEventListener('click', () => { try { localStorage.setItem('aima-lang', 'en'); } catch (e) {} });
      t.append(he, en);
      actions.prepend(t);
    }
  };

  /* hero: one aligned manifesto text, no repeated "קול"; readable paragraph; decorative initials hidden from screen readers */
  const hero = () => {
    /* legacy cached r2g may still render the old sub-line: align it, never remove (r2 re-adds) */
    $$('.hero .r2-sub').forEach((x) => { if (x.textContent.trim().indexOf('קהילה אחת') === 0) x.textContent = 'לא בוחרים בין טכנולוגיה לנשמה.'; });
    $$('.hero-copy p').forEach((p) => {
      const st = p.querySelector('strong');
      if (st && st.textContent.trim() === 'קהילה אחת, מאות סאונדים.') {
        st.textContent = 'לא בוחרים בין טכנולוגיה לנשמה.';
        const rest = Array.from(p.childNodes).filter((n) => n !== st);
        rest.forEach((n) => n.remove());
        p.append(document.createElement('br'), document.createTextNode('מאות יוצרים, קהילה אחת, מוזיקה חדשה שנולדת כאן.'));
      }
    });
    const sub = $('.hero .r2-sub');
    if (sub && !sub.parentElement.querySelector('.p1-sub2')) {
      sub.after(el('p', 'p1-sub2', 'מאות יוצרים, קהילה אחת, מוזיקה חדשה שנולדת כאן.'));
    }
    const stack = $('.hero .stack');
    if (stack && !stack.hasAttribute('aria-hidden')) stack.setAttribute('aria-hidden', 'true');
  };

  /* "השבוע באתר" strip above the fold: song of the week + latest update + next event, with real dates only */
  let weekData = { overrides: null, news: null };
  const weekStrip = () => {
    const heroSec = $('.hero.shell');
    if (!heroSec) return;
    let s = $('.p1-week');
    if (!s) {
      s = el('section', 'p1-week', null, { 'aria-label': 'השבוע באתר' });
      s.append(el('b', null, 'השבוע באתר'));
      heroSec.after(s);
    }
    s.querySelectorAll('a,span.p1-week-ev').forEach((x) => x.remove());
    if (weekData.overrides) {
      const songs = (weekData.overrides.weeklySongs || []).filter((x) => x && x.title && x.href);
      if (songs.length) {
        const song = songs[isoWeek(new Date()) % songs.length];
        const a = el('a', null, null, { href: song.href, target: '_blank', rel: 'noopener noreferrer' });
        a.append(el('small', null, 'שיר השבוע · שבוע ' + isoWeek(new Date())), document.createTextNode(' ' + song.title + (song.artist ? ' — ' + song.artist : '') + ' ↗'));
        s.append(a);
      }
    }
    if (weekData.news) {
      const a = el('a', null, null, { href: '/news/' });
      a.append(el('small', null, 'עדכון אחרון · ' + fmtDate(weekData.news.publishedAt)), document.createTextNode(' ' + weekData.news.title + ' ←'));
      s.append(a);
    }
    const evs = ((weekData.overrides && weekData.overrides.events) || []).filter((x) => x && x.title);
    const upcoming = evs.filter((x) => {
      const t = Date.parse(x.date || x.start || '');
      return isNaN(t) ? true : t >= Date.now() - 864e5;
    });
    if (upcoming.length) {
      const ev0 = upcoming[0];
      const t = Date.parse(ev0.date || ev0.start || '');
      const ev = el('a', null, null, { href: ev0.href || '/events/' });
      ev.append(el('small', null, 'אירוע קרוב' + (isNaN(t) ? '' : ' · ' + fmtDate(ev0.date || ev0.start))), document.createTextNode(' ' + ev0.title + ' ←'));
      s.append(ev);
    }
  };

  /* hreflang alternates: React head hydration drops them, keep them present */
  const ensureHreflang = () => {
    const head = document.head;
    if (!head) return;
    [['he', 'https://sunoisrael.com/'], ['en', 'https://sunoisrael.com/en/'], ['x-default', 'https://sunoisrael.com/']].forEach((pair) => {
      if (!head.querySelector('link[rel="alternate"][hreflang="' + pair[0] + '"]')) {
        const l = document.createElement('link');
        l.rel = 'alternate'; l.hreflang = pair[0]; l.href = pair[1];
        head.appendChild(l);
      }
    });
  };
  ensureHreflang();
  if (window.MutationObserver && document.head) {
    const hlObs = new MutationObserver(() => ensureHreflang());
    hlObs.observe(document.head, { childList: true });
    setTimeout(() => hlObs.disconnect(), 15000);
  }

  /* PULSE section: weekly Sunday cadence, honest fallback, one name */
  const pulse = () => {
    const p = $('#aima-pulse');
    if (!p) return;
    const eb = $('.pulse-heading .eyebrow', p);
    if (eb && eb.textContent.trim() !== 'PULSE · מתעדכן כל יום ראשון') eb.textContent = 'PULSE · מתעדכן כל יום ראשון';
    const h2 = $('.pulse-heading h2', p);
    if (h2 && h2.textContent.trim() !== 'מה חדש השבוע?') h2.textContent = 'מה חדש השבוע?';
    $$('p', p).forEach((x) => {
      if (x.textContent.indexOf('אנחנו בודקים את Suno מדי יום') === 0 || x.textContent.indexOf('העדכון הבא כבר בדרך.') === 0) {
        if (!x.dataset.p1) { x.dataset.p1 = '1'; x.textContent = 'העדכון הבא כבר בדרך. אוספים את מה שבאמת שווה להכיר, ומפרסמים כל יום ראשון.'; }
      }
    });
    const vote = $('.pulse-community-link strong', p);
    if (vote && !vote.dataset.p1) { vote.dataset.p1 = '1'; vote.textContent = 'בואו לגלות אמנים חדשים ולהצביע לאהובים עליכם ←'; }
    /* one WhatsApp anchor button right after PULSE (item 8) */
    if (!p.nextElementSibling || !p.nextElementSibling.classList || !p.nextElementSibling.classList.contains('p1-wa')) {
      if (!$('.p1-wa')) {
        const w = el('div', 'p1-wa');
        w.append(el('a', 'p1-wa-btn', 'קבלו את העדכון השבועי בוואטסאפ ←', { href: '/community/' }));
        p.after(w);
      }
    }
    /* note: the stale-fallback guard lives in aima-static.js (Pulse lead loader with retries,
       last-good localStorage copy and an honest failure line) — verified live 2026-11-27. */
  };

  /* entries: 4 main cards with unique actions; the rest under "כל החדרים"; support/106FM/tips out of the grid */
  const entries = () => {
    const grid = $('#resources .channel-grid');
    if (!grid) return;
    $$('.channel-card', grid).forEach((c) => {
      const h = c.getAttribute('href') || '';
      const link = $('.card-link', c);
      if (/facebook\.com\/groups/.test(h)) { if (link) link.innerHTML = 'להצטרף לקבוצה <b>↗</b>'; }
      else if (/chat\.whatsapp\.com/.test(h)) { if (link) link.innerHTML = 'להצטרף לשיחה <b>↗</b>'; }
      else if (/\/resources\//.test(h)) { if (link) link.innerHTML = 'לפתוח את הארגז <b>←</b>'; }
      else if (/zikairadio/.test(h)) {
        if (link) link.innerHTML = 'להאזין עכשיו <b>↗</b>';
        const p = c.querySelector('p');
        if (p && !p.dataset.p1) { p.dataset.p1 = '1'; p.textContent = 'הרדיו הדיגיטלי של הקהילה, משדר 24/7. נכנסים ומאזינים למוזיקה החדשה שלנו.'; }
        if (!c.querySelector('.p1-now')) {
          const np = el('p', 'p1-now', 'משדר 24/7', { 'aria-live': 'polite' });
          c.insertBefore(np, link);
        }
      }
      else if (/payboxapp/.test(h) || /\/tips\//.test(h) || /\/radio\//.test(h) || /\/community\//.test(h) || /open\.spotify\.com\/playlist/.test(h)) c.classList.add('p1-hidden');
    });
    if (!grid.parentElement.querySelector('.p1-rooms')) {
      const row = el('div', 'p1-rooms');
      row.append(
        el('a', null, 'כל החדרים ←', { href: '/community/' }),
        el('a', null, 'פצצת הטיפים ←', { href: '/tips/' }),
        el('a', null, 'תוכניות 106FM בעמוד הרדיו ←', { href: '/radio/' })
      );
      grid.after(row);
    }
  };

  /* spotlight: honest rotation copy; badge the artist-of-the-month in the grid when they appear there */
  let aotmName = '';
  const spotlight = () => {
    const fs = $('.week-song-footer span');
    if (fs && fs.textContent.trim() === 'מתחלף אוטומטית בכל שבוע') fs.textContent = 'מתחלף אוטומטית כל יום שני';
    const nameEl = $('[data-monthly-artist] [data-field="artist-name"]');
    if (nameEl && nameEl.textContent.trim()) aotmName = nameEl.textContent.trim();
    if (aotmName) {
      $$('.featured-artist, .r2-card').forEach((c) => {
        const h3 = c.querySelector('h3');
        const match = h3 && h3.textContent.trim().toLowerCase() === aotmName.toLowerCase();
        let b = c.querySelector('.p1-aotm');
        if (match && !b) { b = el('span', 'p1-aotm', 'אמן החודש'); c.append(b); }
        if (!match && b) b.remove();
      });
    }
  };

  /* decorative initials out of the screen-reader flow */
  const aria = () => {
    $$('.artist-portrait span, .month-initials, [data-field="song-initials"]').forEach((x) => {
      if (!x.hasAttribute('aria-hidden')) x.setAttribute('aria-hidden', 'true');
    });
  };

  /* journey band: discovery wording, not a third join prompt */
  const journey = () => {
    $$('.r2-journey a').forEach((a) => { if (a.textContent.trim() === 'להצטרף לחדרי הקהילה') a.textContent = 'לכל חדרי הקהילה'; });
  };

  /* hero ZIK button: honest static subtitle. Now-playing was dropped: zikairadio's API sends no CORS headers, so the browser cannot read it and no server route exists. */
  const zikButton = () => {
    const b = $('.hero .r2-radio');
    if (b && !b.querySelector('.p1-now')) b.append(el('span', 'p1-now', 'משדר 24/7', { 'aria-live': 'polite' }));
  };

  /* section order (item 33): Hero → השבוע באתר/PULSE → אמן ושיר החודש → כניסות → אמנים → ציטוט → הרשמה לאמנים → שיר בקליק/פוטר */
  const ORDER = [
    '.hero.shell', '.p1-week', '.ticker', '#aima-pulse', '.p1-wa', '#community-spotlight',
    '.r2-dest', '#resources', '.aima-guide-start', '.r2-artists', '.artists-section',
    '.home-feature-story', '.manifesto', '.aima-join', '.r2-journey', '.aima-sub', 'footer.footer'
  ];
  const reorder = () => {
    const main = $('main');
    if (!main) return;
    const kids = Array.from(main.children);
    const keyed = kids.map((k) => ({ k, oi: ORDER.findIndex((sel) => { try { return k.matches(sel); } catch (e) { return false; } }) }));
    if (keyed.filter((x) => x.oi >= 0).length < 6) return;
    let last = -1;
    keyed.forEach((x) => { if (x.oi >= 0) last = x.oi; else x.oi = last + 0.5; });
    keyed.sort((a, b) => a.oi - b.oi); /* stable sort */
    keyed.forEach((x) => main.appendChild(x.k));
  };

  /* meta: PULSE name in description */
  const TITLE = 'A.I.M.A | קהילת יוצרי מוזיקה עם AI בישראל: אמנים, רדיו, מגזין ומשאבים';
  const DESC = 'A.I.M.A היא קהילת יוצרי המוזיקה עם AI בישראל. גלו אמנים, האזינו לרדיו ZIK, קראו את PULSE ומצאו מדריכים, כלים וטיפים ליצירה עם Suno.';
  const meta = () => {
    if (document.title !== TITLE) document.title = TITLE;
    const m = document.querySelector('meta[name="description"]');
    if (m && m.getAttribute('content') !== DESC) m.setAttribute('content', DESC);
  };

  const loadData = () => {
    fetch('/content/community-overrides.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { weekData.overrides = d; weekStrip(); spotlight(); })
      .catch(() => {});
    fetch('/api/public/content?type=news&limit=1', { cache: 'no-store', headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const it = d && Array.isArray(d.items) && d.items[0];
        if (it && it.title) { weekData.news = it; weekStrip(); }
      })
      .catch(() => {});
  };

  const ensure = () => {
    try {
      meta(); headerFooter(); hero(); weekStrip(); pulse(); entries(); spotlight(); aria(); journey(); zikButton(); reorder();
    } catch (e) { /* never break the page */ }
  };

  const hydrated = () => { const m = document.querySelector('main'); if (!m) return false; for (const k in m) if (k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactProps$') === 0) return true; return false; };
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (hydrated() || Date.now() - t0 > 15000) {
      clearInterval(iv);
      ensure();
      loadData();
      let q = false;
      new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; ensure(); }); }).observe(document.body, { childList: true, subtree: true });
    }
  }, 80);
})();
