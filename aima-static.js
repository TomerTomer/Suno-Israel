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
