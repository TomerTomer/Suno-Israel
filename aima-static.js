(() => {
  const packageRoot = document.currentScript?.src ? new URL("./", document.currentScript.src) : new URL("./", location.href);
  const editable = (target) => target instanceof Element && target.closest("input, textarea, select, [contenteditable='true'], .allow-copy");
  document.addEventListener("copy", (event) => { if (!editable(event.target)) event.preventDefault(); });
  document.addEventListener("contextmenu", (event) => { if (!editable(event.target)) event.preventDefault(); });
  document.addEventListener("dragstart", (event) => { if (event.target instanceof Element && event.target.closest("img, svg, video, audio, main")) event.preventDefault(); });
  document.addEventListener("keydown", (event) => {
    if (!editable(event.target) && (event.ctrlKey || event.metaKey) && ["c", "s", "u"].includes(event.key.toLowerCase())) event.preventDefault();
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || link.target || link.origin !== location.origin || link.hash) return;
    event.preventDefault();
    location.href = link.href;
  }, true);

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  const safeHref = (value = "") => /^https?:\/\//i.test(value) ? value : "#";
  const setText = (selector, value) => { const element = document.querySelector(selector); if (element && value) element.textContent = value; };
  const calendarWeekIndex = () => {
    const now = new Date();
    const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = current.getUTCDay() || 7;
    current.setUTCDate(current.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
    return current.getUTCFullYear() * 53 + Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
  };

  fetch(new URL("content/community-overrides.json", packageRoot), { cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data) return;
      const artistCard = document.querySelector("[data-monthly-artist]");
      if (artistCard && data.monthlyArtist?.name && data.monthlyArtist?.href) {
        artistCard.href = safeHref(data.monthlyArtist.href);
        setText('[data-field="artist-initials"]', data.monthlyArtist.initials || "AI");
        setText('[data-field="artist-genre"]', data.monthlyArtist.genre);
        setText('[data-field="artist-name"]', data.monthlyArtist.name);
        setText('[data-field="artist-description"]', data.monthlyArtist.description);
      }
      const managedSongs = Array.isArray(data.weeklySongs) ? data.weeklySongs.filter((song) => song?.title && /^https?:\/\//i.test(song?.href || "")) : [];
      const songCard = document.querySelector("[data-weekly-song]");
      if (songCard && managedSongs.length) {
        const song = managedSongs[calendarWeekIndex() % managedSongs.length];
        songCard.href = safeHref(song.href);
        setText('[data-field="song-initials"]', song.initials || "♪");
        setText('[data-field="song-title"]', song.title);
        setText('[data-field="song-artist"]', song.artist || "AIMA");
        setText('[data-field="song-description"]', song.description);
      }
      const eventGrid = document.querySelector(".event-grid");
      if (eventGrid && Array.isArray(data.events)) {
        data.events.slice().reverse().forEach((item, index) => eventGrid.insertAdjacentHTML("afterbegin", `<a class="event-card" href="${safeHref(item.href)}" target="_blank" rel="noreferrer"><div class="event-date"><span>${String(index + 1).padStart(2, "0")}</span><small>${escapeHtml(item.date)}</small></div><div><b>${escapeHtml(item.status || "חדש")}</b><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p></div><strong>לפרטים ↗</strong></a>`));
      }

      const resourceGrid = document.querySelector(".resource-grid");
      if (resourceGrid && Array.isArray(data.resources)) {
        data.resources.slice().reverse().forEach((item) => resourceGrid.insertAdjacentHTML("afterbegin", `<a class="resource-card featured" href="${safeHref(item.href)}" target="_blank" rel="noreferrer"><div class="resource-card-top"><span>${escapeHtml(item.category || "חדש")}</span><b>${escapeHtml(item.platform || "AIMA")}</b></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p><div class="resource-card-bottom"><small>חדש מהסטודיו</small><strong>פתיחה ↗</strong></div></a>`));
      }

      const newsAnchor = document.querySelector(".lead-story");
      if (newsAnchor && Array.isArray(data.news) && data.news.length) {
        const cards = data.news.map((item, index) => `<a href="${safeHref(item.href)}" target="_blank" rel="noreferrer"><span>${String(index + 1).padStart(2, "0")}</span><div><small>${escapeHtml(item.label || "AIMA UPDATE")} · ${escapeHtml(item.date)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div><b>↗</b></a>`).join("");
        newsAnchor.insertAdjacentHTML("afterend", `<section class="managed-news"><div class="news-section-head"><p class="eyebrow">FROM AIMA HQ</p><h2>עדכוני הקהילה</h2></div><div class="news-list">${cards}</div></section>`);
      }
    })
    .catch(() => {});
})();

// AIMA guides navigation. Keep the existing site and backend intact.
(() => {
  const root = new URL('./', document.currentScript.src);
  const addGuidesLink = () => {
    document.querySelectorAll('nav[aria-label="ניווט ראשי"], nav[aria-label="ניווט מהיר"]').forEach(nav => {
      if (nav.querySelector('[data-aima-guides]')) return;
      const model = nav.querySelector('a');
      if (!model) return;
      const link = model.cloneNode(false);
      link.removeAttribute('aria-current');
      link.href = new URL('guides.html', root).href;
      link.textContent = 'מדריכים';
      link.dataset.aimaGuides = 'true';
      nav.append(link);
    });
  };
  addGuidesLink();
  const observer = new MutationObserver(addGuidesLink);
  observer.observe(document.body, {childList:true,subtree:true});
})();

// Phase 2: simplify home without replacing hydration, tracking or backend behavior.
(() => {
  const root = new URL('./', document.currentScript.src);
  const home = location.pathname === '/' || /\/index\.html$/.test(location.pathname) && location.pathname.split('/').length === 2;
  if (!home) return;
  const style = document.createElement('style');
  style.textContent = `.hero{display:block!important;padding-top:45px!important;padding-bottom:25px!important;min-height:0!important}.hero-copy{max-width:850px}.hero-stage,.hero-proof,.ticker,.home-feature-story,#resources,.artists-section,.manifesto,.community-app-strip{display:none!important}.hero h1{font-size:clamp(38px,5vw,62px)!important;line-height:1.1!important}.hero-lede{max-width:750px}.pulse-section{padding-top:35px!important;padding-bottom:35px!important}.spotlight-section{padding-top:35px!important;padding-bottom:35px!important}.spotlight-head h2{font-size:clamp(32px,4vw,48px)!important}.pulse-layout{grid-template-columns:1fr!important}.pulse-sidebar{display:none!important}.pulse-lead{max-width:100%}.pulse-section .section-head{margin-bottom:25px!important}.aima-guide-start{display:flex;justify-content:space-between;align-items:center;gap:20px;background:#d8ff3e;border-radius:18px;padding:22px;margin-top:20px;margin-bottom:35px}.aima-guide-start p{margin:0}.aima-guide-start a{white-space:nowrap}.aima-home-note{font-size:15px;line-height:1.7;color:#585751;margin:16px 0 0}.mobile-nav{overflow-x:auto!important}@media(max-width:700px){.aima-guide-start{flex-direction:column;align-items:flex-start}.hero{padding-top:28px!important}.site-header nav{overflow-x:auto}}`;
  document.head.append(style);
  const text = (selector,value) => {const el=document.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value;};
  const update = () => {
    const title=document.querySelector('.hero h1');
    if(title && title.textContent !== 'מוזיקה חדשה.קהילה שיוצרת יחד.') title.innerHTML='מוזיקה חדשה.<br><em>קהילה שיוצרת יחד.</em>';
    text('.hero-lede','עדכונים שכדאי להכיר, יוצרים שכדאי לשמוע ומקום להתחיל ממנו.');
    const first=document.querySelector('.hero-actions .primary');if(first&&first.textContent!=='מה חדש השבוע? ←')first.textContent='מה חדש השבוע? ←';
    const pulse=document.querySelector('#aima-pulse');
    if(pulse){
      const eyebrow=pulse.querySelector('.eyebrow');if(eyebrow&&eyebrow.textContent!=='AIMA PULSE · העדכונים האחרונים')eyebrow.textContent='AIMA PULSE · העדכונים האחרונים';
      const h=pulse.querySelector('h2');if(h&&h.textContent!=='מה חדש השבוע?')h.textContent='מה חדש השבוע?';
      const head=pulse.querySelector('.pulse-heading');
      if(head){const p=head.querySelector(':scope > p');if(p&&p.textContent!=='העדכונים האחרונים שאושרו בקהילה. התאריך מופיע בכל עדכון; לא בכל שבוע מגיע עדכון חדש.')p.textContent='העדכונים האחרונים שאושרו בקהילה. התאריך מופיע בכל עדכון; לא בכל שבוע מגיע עדכון חדש.';}
      if(!document.querySelector('.aima-guide-start')){const section=document.createElement('section');section.className='shell aima-guide-start';section.innerHTML='<p><strong>חדשים בסונו?</strong><br>רעיון ראשון, פרומפט וטיפים לעברית. מתחילים בלי ללכת לאיבוד.</p><a class="button primary" href="'+new URL('guides.html',root).href+'">איפה מתחילים ←</a>';pulse.before(section);}
    }
    const spot=document.querySelector('#community-spotlight');
    if(spot){const h=spot.querySelector('h2');if(h&&h.textContent!=='האמן שבמרכז. שיר השבוע.')h.textContent='האמן שבמרכז. שיר השבוע.';
      if(!spot.querySelector('.aima-home-note')){const p=document.createElement('p');p.className='aima-home-note';p.textContent='כאן מוצגים אמן החודש ושיר שמתחלף אוטומטית מתוך רשימת הקהילה. בחירה שבועית לפי הצבעות עדיין לא פעילה, ולכן לא מוצג מנצח בהצבעה.';(spot.querySelector('.shell')||spot).append(p);}
    }
  };
  update();new MutationObserver(update).observe(document.body,{childList:true,subtree:true});
})();
