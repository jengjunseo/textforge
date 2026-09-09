(() => {
  "use strict";

  function escapeHtml(value) {
    const node = document.createElement("span");
    node.textContent = String(value || "");
    return node.innerHTML;
  }

  function sanitize(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    template.content.querySelectorAll("script,style,iframe,object,embed,form").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => [...node.attributes].forEach((attribute) => {
      if (/^on/i.test(attribute.name) || attribute.name.toLowerCase() === "contenteditable") node.removeAttribute(attribute.name);
      if (/^(href|src)$/i.test(attribute.name) && /^\s*(?:javascript|data:text\/html):/i.test(attribute.value || "")) node.removeAttribute(attribute.name);
    }));
    return template.innerHTML || "<p></p>";
  }

  function plain(html) {
    const node = document.createElement("div");
    node.innerHTML = sanitize(html);
    return node.textContent || "";
  }

  function sameItem(left, right) {
    if (!left || !right) return false;
    if (left.key || right.key) return left.key === right.key;
    return left.type === right.type && left.id === right.id && left.docId === right.docId;
  }

  function create(options = {}) {
    let activeDialog = null;
    let loadSequence = 0;

    function close(reason = "close") {
      if (!activeDialog) return false;
      const state = activeDialog;
      activeDialog = null;
      state.root.remove();
      options.onClose?.({ reason, item: state.item, payload: state.payload, returnState: state.returnState });
      requestAnimationFrame(() => {
        if (state.returnFocus?.isConnected) state.returnFocus.focus({ preventScroll: true });
      });
      return true;
    }

    async function open(config = {}) {
      const initial = config.item;
      if (!initial || typeof options.getItem !== "function") return false;
      close("replace");
      const items = (Array.isArray(config.items) ? config.items : [initial]).filter(Boolean);
      if (!items.some((item) => sameItem(item, initial))) items.unshift(initial);
      let index = Math.max(0, items.findIndex((item) => sameItem(item, initial)));
      const returnFocus = config.focusTarget || document.activeElement;
      const returnState = options.captureState?.(config) || null;
      const root = document.createElement("div");
      root.id = config.id || "tfQuickLook";
      root.className = "tf-overlay tf-quicklook-overlay";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-labelledby", `${root.id}Title`);
      root.innerHTML = `<section class="tf-modal tf-quicklook-modal"><header class="tf-modal-head"><h2 id="${root.id}Title">${escapeHtml(config.title || "Quick Look")}</h2><button class="tf-icon-button" type="button" aria-label="Close">x</button></header><div class="tf-quicklook"><div class="tf-quicklook-toolbar"><button type="button" data-quick-nav="-1" aria-label="Previous item">&#8592;</button><button type="button" data-quick-nav="1" aria-label="Next item">&#8594;</button><label class="tf-quicklook-search">Search preview<input type="search" autocomplete="off"><span aria-live="polite">0 / 0</span></label><button type="button" data-match-nav="-1" aria-label="Previous match">&#8593;</button><button type="button" data-match-nav="1" aria-label="Next match">&#8595;</button></div><div class="tf-quicklook-meta" aria-live="polite"></div><article class="tf-preview tf-quicklook-preview" tabindex="0" aria-label="Read-only document preview"></article></div><div class="tf-modal-actions"><span class="tf-readonly-badge">Read only</span><button type="button" data-copy="plain">Copy plain</button><button type="button" data-open="true">${escapeHtml(config.openLabel || "Open document")}</button></div></section>`;
      const preview = root.querySelector(".tf-quicklook-preview");
      const meta = root.querySelector(".tf-quicklook-meta");
      const search = root.querySelector("input");
      const matchStatus = root.querySelector(".tf-quicklook-search span");
      const openButton = root.querySelector("[data-open]");
      let rawHtml = "";
      let matches = [];
      let matchIndex = -1;

      activeDialog = { root, item: items[index], payload: null, returnFocus, returnState };

      const markMatches = () => {
        preview.innerHTML = rawHtml;
        matches = [];
        matchIndex = -1;
        const term = search.value.trim();
        if (!term) { matchStatus.textContent = "0 / 0"; return; }
        const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        const needle = term.toLocaleLowerCase();
        nodes.forEach((node) => {
          const found = node.nodeValue.toLocaleLowerCase().indexOf(needle);
          if (found < 0) return;
          const range = document.createRange();
          range.setStart(node, found);
          range.setEnd(node, found + term.length);
          const mark = document.createElement("mark");
          mark.dataset.quickMatch = "true";
          range.surroundContents(mark);
          matches.push(mark);
        });
        if (matches.length) {
          matchIndex = 0;
          matches[0].classList.add("current");
          matches[0].scrollIntoView({ block: "center" });
        }
        matchStatus.textContent = `${matches.length ? 1 : 0} / ${matches.length}`;
      };

      const moveMatch = (delta) => {
        if (!matches.length) return;
        matches[matchIndex]?.classList.remove("current");
        matchIndex = (matchIndex + delta + matches.length) % matches.length;
        matches[matchIndex].classList.add("current");
        matches[matchIndex].scrollIntoView({ block: "center" });
        matchStatus.textContent = `${matchIndex + 1} / ${matches.length}`;
      };

      const load = async () => {
        const sequence = ++loadSequence;
        const item = items[index];
        activeDialog.item = item;
        preview.innerHTML = '<p class="loading-preview">Loading preview...</p>';
        root.querySelectorAll("[data-quick-nav]").forEach((button) => {
          const delta = Number(button.dataset.quickNav);
          button.disabled = index + delta < 0 || index + delta >= items.length;
        });
        try {
          const payload = await options.getItem(item, config);
          if (!activeDialog || activeDialog.root !== root || sequence !== loadSequence) return;
          activeDialog.payload = payload;
          rawHtml = sanitize(payload?.contentHtml || "<p>This item is unavailable.</p>");
          preview.innerHTML = rawHtml;
          const flags = [item.contextLabel || payload?.sourceContext, payload?.folder, payload?.favorite ? "Favorite" : "", payload?.deleted ? "Deleted" : "", payload?.label].filter(Boolean);
          meta.innerHTML = `<strong>${escapeHtml(payload?.title || "Unavailable")}</strong><span>${Number(payload?.charCount || 0).toLocaleString()} chars</span><span>${escapeHtml(flags.join(" · ") || "Local document")}</span><time>${payload?.updatedAt ? new Date(payload.updatedAt).toLocaleString() : ""}</time>`;
          openButton.disabled = payload?.available === false || !payload?.docId;
          markMatches();
        } catch (error) {
          if (!activeDialog || activeDialog.root !== root || sequence !== loadSequence) return;
          const message = options.unavailableMessage?.(error) || "Preview is unavailable. Check the connection and try again.";
          rawHtml = `<p>${escapeHtml(message)}</p>`;
          preview.innerHTML = rawHtml;
          meta.innerHTML = `<strong>Unavailable</strong><span>${escapeHtml(item.contextLabel || "Preview request failed")}</span>`;
          openButton.disabled = true;
        }
      };

      const navigate = (delta) => {
        const next = index + delta;
        if (next < 0 || next >= items.length) return;
        index = next;
        load();
      };

      root.addEventListener("click", async (event) => {
        if (event.target === root || event.target.closest(".tf-modal-head button")) { close("dismiss"); return; }
        const nav = event.target.closest("[data-quick-nav]");
        if (nav) { navigate(Number(nav.dataset.quickNav)); return; }
        const match = event.target.closest("[data-match-nav]");
        if (match) { moveMatch(Number(match.dataset.matchNav)); return; }
        if (event.target.closest("[data-copy='plain']")) { await navigator.clipboard?.writeText(plain(rawHtml)); return; }
        if (event.target.closest("[data-open]") && activeDialog?.payload) {
          await options.openItem?.(activeDialog.payload, activeDialog.item, config);
          close("open");
        }
      });
      search.addEventListener("input", markMatches);
      search.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); moveMatch(event.shiftKey ? -1 : 1); }
      });
      root.addEventListener("keydown", (event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close("escape"); return; }
        if (event.target.matches("input,textarea,[contenteditable=true]") || event.isComposing) return;
        if (event.code === "Space") { event.preventDefault(); close("space"); return; }
        if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); return; }
        if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); return; }
        if (event.key !== "Tab") return;
        const focusable = [...root.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter((element) => !element.hidden);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
      document.body.append(root);
      root.querySelector(".tf-modal-head button")?.focus({ preventScroll: true });
      await load();
      return true;
    }

    return { open, close, isOpen: () => Boolean(activeDialog), sanitize };
  }

  window.TextForgeQuickLookController = { create, sanitize };
})();
