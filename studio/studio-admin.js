(() => {
  const api = "/api/admin/content";
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  let contentItems = [];
  let editingId = null;

  const template = () => `<section class="panel pulse-admin" id="pulse-admin">
    <div class="pulse-admin-head"><div><small class="eyebrow">AIMA PULSE Â· LIVE CONTENT</small><h2>×ž×” ×—×“×©, ×œ×ž×” ×–×” ×ž×©× ×”.</h2><p>×”×¢×“×›×•× ×™×  ×”×—×“×©×™×  ×©×œ Suno × ×›× ×¡×™×  ×œ×›× ×Ÿ ×›×˜×™×•×˜×•×ª ×‘×¢×‘×¨×™×ª. × ×¤×©×¨ ×œ×¢×¨×•×š ×”×›×•×œ ×œ×¤× ×™ ×”×¤×¨×¡×•× , ×•×’×  ×œ×”×•×¡×™×£ ×¢×“×›×•× ×™×  ×•×§×™×©×•×¨×™×  ×ž×©×œ×›× .</p></div><button class="save" id="pulse-import" type="button">×‘×“×™×§×” ×—×“×©×” ×‘-Suno</button></div>
    <div class="pulse-admin-status" id="pulse-admin-status" aria-live="polite">×ž×ª×—×‘×¨ ×œ×ž×¢×¨×›×ª ×”×ª×•×›×Ÿ...</div>
    <div class="pulse-admin-grid">
      <form class="pulse-admin-card" id="pulse-admin-form"><h3 id="pulse-form-title">×¢×“×›×•×Ÿ ×—×“×©</h3>
        <label>×›×•×ª×¨×ª ×‘×¢×‘×¨×™×ª<input name="title" required maxlength="180"></label>
        <label>×ª×§×¦×™×¨ ×§×¦×¨<textarea name="summary" maxlength="1200"></textarea></label>
        <label>×ž×” ×”×ž×©×ž×¢×•×ª ×œ×™×•×¦×¨?<textarea name="impact" maxlength="900"></textarea></label>
        <label>×ž×” ×›×“× ×™ ×œ× ×¡×•×ª ×¢×›×©×™×•?<textarea name="action" maxlength="600"></textarea></label>
        <label>×§×™×©×•×¨ ×œ×ž×§×•×¨<input name="url" type="url" dir="ltr" placeholder="https://..."></label>
        <div class="pulse-admin-form-row"><label>×ª× ×¨×™×š<input name="publishedAt" type="date" required></label><label>×ª×’×™×ª<input name="label" value="AIMA UPDATE"></label></div>
        <div class="pulse-admin-form-row"><label>×¡×•×’ ×ª×•×›×Ÿ<select name="contentType"><option value="news">×—×“×©×•×ª ×•×¢×“×›×•× ×™× </option><option value="resource">×§×™×©×•×¨ ×—×©×•×‘ / ×ž×©× ×‘</option></select></label><label>×¡×˜×˜×•×¡<select name="status"><option value="draft">×˜×™×•×˜×”</option><option value="published">×¤×¨×¡×•×  ×‘× ×ª×¨</option></select></label></div>
        <label>×¡×“×¨ ×ª×¦×•×’×”<input name="position" type="number" value="0"></label>
        <div class="pulse-admin-actions"><button class="save" type="submit">×©×ž×™×¨×”</button><button class="save" id="pulse-cancel" type="button">× ×™×§×•×™</button></div>
      </form>
      <section class="pulse-admin-card"><h3>×ž×ž×ª×™× ×™×  ×•×¤×•×¨×¡×ž×•</h3><div class="pulse-admin-list" id="pulse-admin-list"></div></section>
    </div>
  </section>`;

  const status = (message) => { document.querySelector("#pulse-admin-status").textContent = message; };
  const editor = () => document.querySelector("#pulse-admin-form");

  function resetForm() {
    editingId = null;
    editor().reset();
    editor().elements.publishedAt.value = new Date().toISOString().slice(0, 10);
    editor().elements.label.value = "AIMA UPDATE";
    editor().elements.contentType.value = "news";
    editor().elements.position.value = "0";
    document.querySelector("#pulse-form-title").textContent = "×¢×“×›×•×Ÿ ×—×“×©";
  }

  function render() {
    const list = document.querySelector("#pulse-admin-list");
    if (!contentItems.length) { list.innerHTML = '<div class="empty">×¢×•×“ × ×™×Ÿ ×¢×“×›×•× ×™× . ×œ×—×¦×• ×¢×œ ×‘×“×™×§×” ×—×“×©×” ×‘-Suno.</div>'; return; }
    list.innerHTML = contentItems.map((item) => `<article class="pulse-admin-item is-${escapeHtml(item.status)}" data-id="${item.id}"><small>${escapeHtml(item.label)} Â· ${escapeHtml(item.publishedAt)} Â· ${item.contentType === "resource" ? "×ž×©× ×‘" : "×—×“×©×•×ª"} Â· ${item.status === "published" ? "×ž×¤×•×¨×¡× " : "×ž×ž×ª×™×Ÿ ×œ× ×™×©×•×¨"}</small><h4>${escapeHtml(item.title)}</h4><p><b>×ž×” ×”×ª×—×“×©:</b> ${escapeHtml(item.summary)}</p>${item.impact ? `<p><b>×”×ž×©×ž×¢×•×ª:</b> ${escapeHtml(item.impact)}</p>` : ""}${item.action ? `<p><b>×ž×” ×œ× ×¡×•×ª:</b> ${escapeHtml(item.action)}</p>` : ""}${item.sourceKind === "suno" ? `<div class="pulse-admin-original"><b>Original:</b> ${escapeHtml(item.originalTitle)}</div>` : ""}<div class="pulse-admin-item-actions"><button data-action="edit">×¢×¨×™×›×” ×ž×œ× ×”</button><button class="publish" data-action="toggle">${item.status === "published" ? "×”×—×–×¨×” ×œ×˜×™×•×˜×”" : "×¤×¨×¡×•×  ×¢×›×©×™×•"}</button><button class="delete" data-action="delete">×ž×—×™×§×”</button></div></article>`).join("");
  }

  async function load() {
    const response = await fetch(`${api}?fresh=${Date.now()}`, { cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("×œ×  ×”×¦×œ×—×ª×™ ×œ×”×ª×—×‘×¨. ×•×“× ×• ×©× ×›× ×¡×ª×  ×œ×¡×˜×•×“×™×• ×“×¨×š Cloudflare Access.");
    contentItems = (await response.json()).items || [];
    render();
    status(`× ×˜×¢× ×• ${contentItems.length} ×¢×“×›×•× ×™× . ${contentItems.filter((item) => item.status === "draft").length} ×ž×ž×ª×™× ×™×  ×œ× ×™×©×•×¨.`);
  }

  function edit(item) {
    editingId = item.id;
    const form = editor();
    ["title", "summary", "impact", "action", "url", "publishedAt", "label", "contentType", "status", "position"].forEach((name) => { form.elements[name].value = item[name] ?? ""; });
    document.querySelector("#pulse-form-title").textContent = "×¢×¨×™×›×ª ×¢×“×›×•×Ÿ";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function patchItem(item, changes) {
    const response = await fetch(`${api}/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...item, ...changes }) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || "×”×©×ž×™×¨×” × ×›×©×œ×”.");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".hero").insertAdjacentHTML("afterend", template());
    resetForm();
    load().catch((error) => status(error.message));

    document.querySelector("#pulse-import").addEventListener("click", async (event) => {
      event.currentTarget.disabled = true;
      status("×‘×•×“×§ × ×ª ×¢×ž×•×“ ×”×¢×“×›×•× ×™×  ×”×¨×©×ž×™ ×©×œ Suno ×•×ž×›×™×Ÿ ×”×¡×‘×¨×™×  ×‘×¢×‘×¨×™×ª...");
      try {
        const previousIds = new Set(contentItems.map((item) => item.id));
        const response = await fetch(`${api}/import-suno`, { method: "POST", headers: { accept: "application/json" } });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "×”×‘×“×™×§×” × ×›×©×œ×”.");
        await load();
        const readyDraft = contentItems.find((item) => !previousIds.has(item.id) && item.status === "draft") || contentItems.find((item) => item.status === "draft");
        if (readyDraft) edit(readyDraft);
        const changed = Number(result.imported || 0) + Number(result.enriched || 0);
        status(changed ? `×”×•×›× ×• ${changed} ×˜×™×•×˜×•×ª ×ž×œ× ×•×ª ×‘×¢×‘×¨×™×ª. ×”×¨× ×©×•× ×” ×›×‘×¨ ×¤×ª×•×—×” ×œ×¢×¨×™×›×” ×•×œ× ×™×©×•×¨.` : "×”×›×•×œ ×ž×¢×•×“×›×Ÿ. ×œ×  × ×ž×¦× ×• ×¢×“×›×•× ×™×  ×—×“×©×™× .");
      } catch (error) { status(error.message); }
      finally { event.currentTarget.disabled = false; }
    });

    editor().addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(editor()));
      status("×©×•×ž×¨ × ×ª ×”×¢×“×›×•×Ÿ...");
      try {
        const response = await fetch(editingId ? `${api}/${editingId}` : api, { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "×”×©×ž×™×¨×” × ×›×©×œ×”.");
        resetForm();
        await load();
        status(data.status === "published" ? "× ×©×ž×¨ ×•×¤×•×¨×¡×  ×‘× ×ª×¨." : "× ×©×ž×¨ ×‘×˜×™×•×˜×•×ª.");
      } catch (error) { status(error.message); }
    });
    document.querySelector("#pulse-cancel").addEventListener("click", resetForm);
    document.querySelector("#pulse-admin-list").addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      const card = event.target.closest("[data-id]");
      if (!button || !card) return;
      const item = contentItems.find((entry) => entry.id === Number(card.dataset.id));
      if (!item) return;
      if (button.dataset.action === "edit") { edit(item); return; }
      try {
        if (button.dataset.action === "toggle") await patchItem(item, { status: item.status === "published" ? "draft" : "published" });
        if (button.dataset.action === "delete") {
          if (!window.confirm("×œ×ž×—×•×§ × ×ª ×”×¢×“×›×•×Ÿ ×”×–×”?")) return;
          const response = await fetch(`${api}/${item.id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("×”×ž×—×™×§×” × ×›×©×œ×”.");
        }
        await load();
      } catch (error) { status(error.message); }
    });
  });
})();
