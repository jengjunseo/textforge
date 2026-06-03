(function () {
  const SNAPSHOT_VERSION = 1;
  const DEFAULT_FILENAME_PREFIX = "TextForge-Snapshot";
  let context = null;
  let lastSummary = null;

  const els = () => ({
    dialog: document.querySelector("#forgeSnapshotDialog"),
    close: document.querySelector("#forgeSnapshotCloseBtn"),
    cancel: document.querySelector("#snapshotCancelBtn"),
    estimate: document.querySelector("#snapshotEstimateBtn"),
    generate: document.querySelector("#snapshotGenerateBtn"),
    summary: document.querySelector("#snapshotSummary"),
    filename: document.querySelector("#snapshotFilenameInput"),
    theme: document.querySelector("#snapshotThemeSelect"),
    folderSelect: document.querySelector("#snapshotFolderSelect"),
    tagSelect: document.querySelector("#snapshotTagSelect"),
    excludeTrash: document.querySelector("#snapshotExcludeTrash"),
    excludePrompts: document.querySelector("#snapshotExcludePrompts"),
    excludeEmpty: document.querySelector("#snapshotExcludeEmpty"),
    excludeImages: document.querySelector("#snapshotExcludeImages"),
    excludeHistory: document.querySelector("#snapshotExcludeHistory"),
    mobileUi: document.querySelector("#snapshotMobileUi"),
    desktopUi: document.querySelector("#snapshotDesktopUi"),
  });

  function openForgeSnapshotDialog(nextContext) {
    context = nextContext || {};
    const ui = els();
    const folders = context?.getFolders?.() || [];
    const docs = context?.getDocuments?.() || [];
    const tags = [...new Set(docs.flatMap((doc) => doc.tags || []))].sort((a, b) => a.localeCompare(b, "ko"));
    ui.folderSelect.innerHTML = folders.length
      ? folders.map((folder) => `<option value="${escapeAttr(folder.id)}">${escapeHtml(folder.name || "Folder")}</option>`).join("")
      : '<option value="">폴더 없음</option>';
    ui.tagSelect.innerHTML = tags.length
      ? tags.map((tag) => `<option value="${escapeAttr(tag)}">#${escapeHtml(tag)}</option>`).join("")
      : '<option value="">태그 없음</option>';
    ui.filename.value = generateSnapshotFilename();
    ui.theme.value = "system";
    ui.summary.textContent = "미리 계산을 누르면 포함될 문서 수와 예상 크기를 확인합니다.";
    ui.dialog.classList.remove("hidden");
  }

  function closeForgeSnapshotDialog() {
    els().dialog.classList.add("hidden");
  }

  function getDialogOptions() {
    const ui = els();
    const scope = document.querySelector('input[name="snapshotScope"]:checked')?.value || "all";
    return {
      scope,
      theme: ui.theme.value || "system",
      filename: ui.filename.value.trim() || generateSnapshotFilename(),
      includeTrash: !ui.excludeTrash.checked,
      includePrompts: !ui.excludePrompts.checked,
      includeEmpty: !ui.excludeEmpty.checked,
      includeImages: !ui.excludeImages.checked,
      includeHistory: !ui.excludeHistory.checked,
      includeMobileUi: ui.mobileUi.checked,
      includeDesktopUi: ui.desktopUi.checked,
      selectedIds: context?.getSelectedIds?.() || [],
      currentFolderId: context?.getCurrentFolderId?.() || null,
      folderId: ui.folderSelect.value || null,
      tag: ui.tagSelect.value || null,
    };
  }

  function collectSnapshotDocuments(options) {
    const sourceDocs = context?.getDocuments?.() || [];
    let docs = sourceDocs.slice();
    if (!options.includeTrash) docs = docs.filter((doc) => !doc.deletedAt);
    if (!options.includePrompts) docs = docs.filter((doc) => doc.type !== "prompt");
    if (!options.includeEmpty) docs = docs.filter((doc) => (doc.plainText || htmlToPlainText(doc.contentHtml || doc.content || "")).trim());
    if (options.scope === "favorites") docs = docs.filter((doc) => doc.favorite);
    if (options.scope === "current-folder") docs = docs.filter((doc) => (doc.folderId || null) === (options.currentFolderId || null));
    if (options.scope === "specific-folder") docs = docs.filter((doc) => (doc.folderId || null) === (options.folderId || null));
    if (options.scope === "specific-tag") docs = docs.filter((doc) => (doc.tags || []).includes(options.tag));
    if (options.scope === "recent") docs = docs.sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt)).slice(0, 30);
    if (options.scope === "selected") {
      const selected = new Set(options.selectedIds);
      docs = docs.filter((doc) => selected.has(doc.id));
    }
    return docs.map((doc) => normalizeSnapshotDocument(doc, options));
  }

  function buildSnapshotData(options) {
    const documents = collectSnapshotDocuments(options);
    const folders = normalizeFolders(context?.getFolders?.() || [], documents);
    const tags = [...new Set(documents.flatMap((doc) => doc.tags))].sort((a, b) => a.localeCompare(b, "ko"));
    const folderIds = new Set(folders.map((folder) => folder.id));
    documents.forEach((doc) => {
      if (doc.folderId && !folderIds.has(doc.folderId)) doc.folderId = null;
      doc.backlinks = documents
        .filter((candidate) => candidate.id !== doc.id && candidate.links.includes(doc.title))
        .map((candidate) => ({ id: candidate.id, title: candidate.title }));
    });
    const createdAt = Date.now();
    return {
      snapshotVersion: SNAPSHOT_VERSION,
      app: "TextForge",
      createdAt,
      createdAtIso: new Date(createdAt).toISOString(),
      title: "TextForge Snapshot",
      description: "Read-only archive generated by TextForge",
      source: {
        appName: "TextForge",
        appVersion: "MVP",
        exportType: "forge-snapshot",
      },
      options: {
        scope: options.scope,
        theme: options.theme,
        includeImages: options.includeImages,
        includeTrash: options.includeTrash,
        includeHistory: options.includeHistory,
      },
      stats: {
        documentCount: documents.length,
        folderCount: folders.length,
        tagCount: tags.length,
        totalCharCount: documents.reduce((sum, doc) => sum + (doc.charCount || 0), 0),
        favoriteCount: documents.filter((doc) => doc.favorite).length,
      },
      folders,
      tags,
      documents,
    };
  }

  function normalizeSnapshotDocument(doc, options) {
    const contentHtml = sanitizeSnapshotHtml(doc.contentHtml || markdownToHtml(doc.content || ""), options);
    const plainText = doc.plainText || htmlToPlainText(contentHtml);
    const title = doc.title || "Untitled";
    return {
      id: String(doc.id || crypto.randomUUID()),
      title,
      type: ["note", "prompt", "report", "board", "log"].includes(doc.type) ? doc.type : "unknown",
      contentHtml,
      plainText,
      previewText: (doc.previewText || plainText.replace(/\s+/g, " ").trim()).slice(0, 120),
      searchText: `${title}\n${doc.type || ""}\n${(doc.tags || []).join(" ")}\n${doc.searchText || plainText}`.toLowerCase(),
      tags: Array.isArray(doc.tags) ? doc.tags.slice(0, 20) : [],
      favorite: Boolean(doc.favorite),
      folderId: doc.folderId || null,
      createdAt: toTime(doc.createdAt),
      updatedAt: toTime(doc.updatedAt),
      charCount: doc.charCount || plainText.length,
      wordCount: doc.wordCount || countWords(plainText),
      links: extractWikiLinks(plainText),
      backlinks: [],
      toc: extractToc(contentHtml),
    };
  }

  function normalizeFolders(folders, docs) {
    const used = new Set(docs.map((doc) => doc.folderId).filter(Boolean));
    return folders
      .filter((folder) => used.has(folder.id))
      .map((folder) => ({
        id: String(folder.id),
        name: folder.name || "Folder",
        parentId: folder.parentId || null,
        createdAt: toTime(folder.createdAt),
        updatedAt: toTime(folder.updatedAt),
      }));
  }

  function sanitizeSnapshotHtml(html, options = {}) {
    const template = document.createElement("template");
    template.innerHTML = html || "";
    template.content.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());
    if (!options.includeImages) template.content.querySelectorAll("img").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value || "";
        if (name.startsWith("on")) node.removeAttribute(attr.name);
        if (name === "contenteditable") node.removeAttribute(attr.name);
        if (name === "data-dark-color-fix") node.removeAttribute(attr.name);
        if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) node.removeAttribute(attr.name);
        if (name === "style") {
          node.style.removeProperty("--tf-adapted-color");
          if (!node.getAttribute("style")?.trim()) node.removeAttribute("style");
        }
      });
      if (node.tagName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
      if (node.tagName === "IMG") node.setAttribute("loading", "lazy");
    });
    return template.innerHTML || "<p></p>";
  }

  function buildSnapshotHtml(snapshotData, options) {
    const json = JSON.stringify(snapshotData).replace(/</g, "\\u003c");
    return `<!doctype html>
<html lang="ko" data-theme="${escapeAttr(options.theme === "system" ? "light" : options.theme)}" data-theme-mode="${escapeAttr(options.theme)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(snapshotData.title)}</title>
  <style>${snapshotViewerCss()}</style>
</head>
<body>
  <div id="snapshot-app"></div>
  <script type="application/json" id="textforge-snapshot-data">${json}</script>
  <script>${snapshotViewerJs()}</script>
</body>
</html>`;
  }

  function downloadSnapshotHtml(html, filename) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename.endsWith(".html") ? filename : `${filename}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    return blob.size;
  }

  function estimateSnapshotSize(snapshotData) {
    return new Blob([buildSnapshotHtml(snapshotData, snapshotData.options)]).size;
  }

  function generateSnapshotFilename() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${DEFAULT_FILENAME_PREFIX}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.html`;
  }

  function renderSummary(snapshotData, size) {
    return `문서 ${snapshotData.stats.documentCount.toLocaleString("ko-KR")}개 · 총 ${snapshotData.stats.totalCharCount.toLocaleString("ko-KR")}자 · 태그 ${snapshotData.stats.tagCount}개 · 폴더 ${snapshotData.stats.folderCount}개 · 즐겨찾기 ${snapshotData.stats.favoriteCount}개 · 예상 크기 ${formatBytes(size)} · 생성일 ${new Date(snapshotData.createdAt).toLocaleString("ko-KR")}`;
  }

  function estimate() {
    const options = getDialogOptions();
    const data = buildSnapshotData(options);
    const size = estimateSnapshotSize(data);
    lastSummary = { data, size, options };
    els().summary.textContent = renderSummary(data, size);
  }

  function generate() {
    const options = getDialogOptions();
    const data = buildSnapshotData(options);
    const html = buildSnapshotHtml(data, options);
    const size = downloadSnapshotHtml(html, options.filename);
    els().summary.textContent = `${renderSummary(data, size)} · 이 파일은 문서 내용을 포함합니다.`;
    lastSummary = { data, size, options };
  }

  function attachDialogEvents() {
    const ui = els();
    ui.close?.addEventListener("click", closeForgeSnapshotDialog);
    ui.cancel?.addEventListener("click", closeForgeSnapshotDialog);
    ui.estimate?.addEventListener("click", estimate);
    ui.generate?.addEventListener("click", generate);
  }

  function snapshotViewerCss() {
    return `
:root{--bg-app:#f6f7f9;--bg-surface:#fff;--bg-surface-2:#f1f3f5;--bg-elevated:#fff;--text-primary:#1f2328;--text-secondary:#4b5563;--text-muted:#7b8494;--border-default:#d0d7de;--border-subtle:#e5e7eb;--accent:#167c80;--accent-soft:#dff2f1;--card-bg:#fff;--input-bg:#fff;--button-bg:#fff;--button-hover:#f0f2f5;--code-bg:#17212b;--code-text:#eef6f6;--quote-bg:#f4faf9;--mark-bg:#fff4d8;--shadow:0 10px 28px rgba(15,23,42,.12);color-scheme:light}
html[data-theme=dark]{--bg-app:#1b1d21;--bg-surface:#23262b;--bg-surface-2:#2a2e35;--bg-elevated:#2f343c;--text-primary:#f1f3f5;--text-secondary:#c9ced6;--text-muted:#9aa3af;--border-default:#3d434d;--border-subtle:#30343b;--accent:#6ea8fe;--accent-soft:rgba(110,168,254,.16);--card-bg:#282c33;--input-bg:#2a2e35;--button-bg:#2a2e35;--button-hover:#30343c;--code-bg:#1f2329;--code-text:#dce7f3;--quote-bg:#252a31;--mark-bg:#665c1e;--shadow:0 18px 40px rgba(0,0,0,.42);color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg-app);color:var(--text-primary);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,select{font:inherit}button{border:1px solid var(--border-default);background:var(--button-bg);color:var(--text-primary);border-radius:8px;cursor:pointer}button:hover{background:var(--button-hover)}.app{min-height:100vh;display:grid;grid-template-rows:auto minmax(0,1fr)}.top{position:sticky;top:0;z-index:5;display:grid;gap:12px;padding:16px;border-bottom:1px solid var(--border-default);background:var(--bg-surface)}.brand{display:flex;justify-content:space-between;gap:12px;align-items:start}.brand h1{margin:0;font-size:24px}.brand p{margin:4px 0 0;color:var(--text-muted);font-size:13px}.badge{display:inline-flex;align-items:center;min-height:26px;padding:0 9px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-size:11px;font-weight:900}.controls{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px}.controls input,.controls select{min-height:38px;border:1px solid var(--border-default);border-radius:8px;background:var(--input-bg);color:var(--text-primary);padding:0 11px}.layout{display:grid;grid-template-columns:240px minmax(0,1fr);min-height:0}.side{border-right:1px solid var(--border-default);background:var(--bg-surface);padding:14px;overflow:auto}.nav{display:grid;gap:6px}.nav button{width:100%;min-height:34px;text-align:left;border:0;background:transparent;font-weight:750}.nav button.active{background:var(--accent-soft);color:var(--accent)}.main{min-width:0;padding:16px;overflow:auto}.result-line{color:var(--text-muted);font-size:13px;font-weight:800;margin-bottom:12px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.card{display:grid;gap:8px;min-height:150px;padding:14px;border:1px solid var(--border-default);border-radius:10px;background:var(--card-bg);box-shadow:var(--shadow);text-align:left}.card h3{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}.meta,.preview,.tags{color:var(--text-muted);font-size:12px}.preview{display:-webkit-box;overflow:hidden;-webkit-line-clamp:3;-webkit-box-orient:vertical;line-height:1.5}.tags{display:flex;gap:5px;flex-wrap:wrap}.tags span{padding:2px 7px;border-radius:999px;background:var(--bg-surface-2);color:var(--accent)}mark{background:var(--mark-bg);color:inherit}.more{margin:16px auto 0;display:block;min-height:38px;padding:0 14px}.reader{position:fixed;inset:0;z-index:10;display:grid;grid-template-rows:auto minmax(0,1fr);background:var(--bg-app)}.reader.hidden{display:none}.reader-head{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border-default);background:var(--bg-surface)}.reader-actions{display:flex;gap:7px;flex-wrap:wrap}.doc{overflow:auto;padding:18px}.paper{max-width:860px;margin:0 auto;padding:22px;border:1px solid var(--border-default);border-radius:10px;background:var(--bg-surface);line-height:1.75}.paper h2{margin-top:0}.doc-meta{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 18px;color:var(--text-muted);font-size:12px}.content pre{overflow:auto;padding:12px;border-radius:8px;background:var(--code-bg);color:var(--code-text)}.content code{background:var(--bg-surface-2);padding:2px 5px;border-radius:5px}.content blockquote{margin-left:0;padding:10px 14px;border-left:4px solid var(--accent);background:var(--quote-bg)}.content table{width:100%;border-collapse:collapse}.content th,.content td{border:1px solid var(--border-default);padding:8px}.empty{display:grid;place-items:center;min-height:260px;color:var(--text-muted);font-weight:800}.info{padding:14px;border:1px solid var(--border-default);border-radius:10px;background:var(--bg-surface);line-height:1.6}.toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);padding:10px 13px;border-radius:999px;background:var(--bg-elevated);box-shadow:var(--shadow);font-size:13px}.toast.hidden{display:none}html[data-theme=dark] .content [data-dark-color-fix=true]{color:var(--text-primary)!important}@media(max-width:760px){.controls{grid-template-columns:1fr 1fr}.controls input{grid-column:1/-1}.layout{grid-template-columns:1fr}.side{border-right:0;border-bottom:1px solid var(--border-default)}.grid{grid-template-columns:1fr}.paper{border:0;border-radius:0;padding:18px}.brand{display:grid}.reader-actions button{min-height:34px}}`;
  }

  function snapshotViewerJs() {
    return `
(function(){const data=JSON.parse(document.getElementById("textforge-snapshot-data").textContent);const app=document.getElementById("snapshot-app");const state={query:"",filter:"all",tag:null,folderId:null,sort:"updated-desc",limit:100,openId:null,theme:data.options.theme||"system"};const mq=matchMedia("(prefers-color-scheme: dark)");function esc(v){return String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}function theme(t=state.theme){const r=t==="system"?(mq.matches?"dark":"light"):t;document.documentElement.dataset.theme=r;document.documentElement.dataset.themeMode=t}mq.addEventListener("change",()=>{if(state.theme==="system")theme()});function fmt(t){return new Date(t).toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}function docs(){let out=data.documents.slice();if(state.filter==="favorites")out=out.filter(d=>d.favorite);if(state.filter==="recent")out=out.sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,30);if(state.tag)out=out.filter(d=>d.tags.includes(state.tag));if(state.folderId)out=out.filter(d=>d.folderId===state.folderId);const q=state.query.trim().toLowerCase();if(q)out=out.filter(d=>(d.searchText||d.plainText||d.title||"").toLowerCase().includes(q)||d.tags.some(t=>t.toLowerCase().includes(q)));out.sort((a,b)=>state.sort==="title"?a.title.localeCompare(b.title,"ko"):state.sort==="updated-asc"?a.updatedAt-b.updatedAt:state.sort==="chars"?b.charCount-a.charCount:state.sort==="favorite"?(Number(b.favorite)-Number(a.favorite))||(b.updatedAt-a.updatedAt):b.updatedAt-a.updatedAt);return out}function hi(text){const q=state.query.trim();if(!q)return esc(text);const i=text.toLowerCase().indexOf(q.toLowerCase());if(i<0)return esc(text);return esc(text.slice(0,i))+"<mark>"+esc(text.slice(i,i+q.length))+"</mark>"+esc(text.slice(i+q.length))}function typeLabel(t){return({note:"메모",prompt:"프롬프트",report:"보고서",board:"게시글",log:"로그",unknown:"문서"}[t]||"문서")}function render(){const list=docs();app.innerHTML='<div class="app"><header class="top"><div class="brand"><div><span class="badge">READ-ONLY SNAPSHOT</span><h1>'+esc(data.title)+'</h1><p>이 파일은 TextForge에서 생성된 읽기 전용 보존본입니다. · '+esc(new Date(data.createdAt).toLocaleString("ko-KR"))+' · 문서 '+data.stats.documentCount.toLocaleString("ko-KR")+'개</p></div><button data-info>정보</button></div><div class="controls"><input id="q" placeholder="문서 검색" value="'+esc(state.query)+'"><select id="sort"><option value="updated-desc">최근 수정순</option><option value="updated-asc">오래된 수정순</option><option value="title">제목순</option><option value="chars">글자 수 많은 순</option><option value="favorite">즐겨찾기 우선</option></select><select id="theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div></header><div class="layout"><aside class="side"><div class="nav">'+navHtml()+'</div></aside><main class="main"><div class="result-line">'+list.length.toLocaleString("ko-KR")+'개 문서</div><div class="grid">'+list.slice(0,state.limit).map(cardHtml).join("")+'</div>'+(list.length>state.limit?'<button class="more" data-more>더보기</button>':'')+(list.length?'':'<div class="empty">검색 결과가 없습니다.</div>')+'</main></div></div><div id="reader" class="reader hidden"></div><div id="toast" class="toast hidden"></div>';document.getElementById("sort").value=state.sort;document.getElementById("theme").value=state.theme;bind()}function navHtml(){return'<button data-filter="all" class="'+(state.filter==="all"&&!state.tag&&!state.folderId?"active":"")+'">전체 문서</button><button data-filter="favorites" class="'+(state.filter==="favorites"?"active":"")+'">즐겨찾기</button><button data-filter="recent" class="'+(state.filter==="recent"?"active":"")+'">최근 문서</button><button data-info>Snapshot 정보</button><hr>'+data.tags.map(t=>'<button data-tag="'+esc(t)+'" class="'+(state.tag===t?"active":"")+'">#'+esc(t)+'</button>').join("")+'<hr>'+data.folders.map(f=>'<button data-folder="'+esc(f.id)+'" class="'+(state.folderId===f.id?"active":"")+'">'+esc(f.name)+'</button>').join("")}function cardHtml(d){return'<button class="card" data-open="'+esc(d.id)+'"><div><span class="badge">'+typeLabel(d.type)+'</span> '+(d.favorite?'★':'☆')+'</div><h3>'+esc(d.title)+'</h3><div class="preview">'+hi(d.previewText||"")+'</div><div class="tags">'+d.tags.slice(0,4).map(t=>'<span>#'+esc(t)+'</span>').join("")+'</div><div class="meta">'+fmt(d.updatedAt)+' · '+(d.charCount||0).toLocaleString("ko-KR")+'자</div></button>'}function bind(){let timer;document.getElementById("q").addEventListener("input",e=>{clearTimeout(timer);timer=setTimeout(()=>{state.query=e.target.value;state.limit=100;render()},180)});document.getElementById("sort").addEventListener("change",e=>{state.sort=e.target.value;render()});document.getElementById("theme").addEventListener("change",e=>{state.theme=e.target.value;theme();document.getElementById("theme").value=state.theme;adaptColors()});app.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;state.tag=null;state.folderId=null;render()});app.querySelectorAll("[data-tag]").forEach(b=>b.onclick=()=>{state.filter="all";state.tag=b.dataset.tag;state.folderId=null;render()});app.querySelectorAll("[data-folder]").forEach(b=>b.onclick=()=>{state.filter="all";state.tag=null;state.folderId=b.dataset.folder;render()});app.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openDoc(b.dataset.open));app.querySelector("[data-more]")?.addEventListener("click",()=>{state.limit+=100;render()});app.querySelectorAll("[data-info]").forEach(b=>b.onclick=openInfo)}function openInfo(){openReader('<div class="paper info"><h2>Snapshot 정보</h2><p>문서 '+data.stats.documentCount.toLocaleString("ko-KR")+'개, 폴더 '+data.stats.folderCount+'개, 태그 '+data.stats.tagCount+'개, 총 '+data.stats.totalCharCount.toLocaleString("ko-KR")+'자.</p><p>생성일: '+esc(new Date(data.createdAt).toLocaleString("ko-KR"))+'</p><p>이 파일은 문서 내용을 포함하는 읽기 전용 HTML 아카이브입니다.</p></div>')}function openDoc(id){const d=data.documents.find(x=>x.id===id);if(!d)return;openReader('<article class="paper"><button data-back>← 뒤로</button><h2>'+esc(d.title)+'</h2><div class="doc-meta"><span>'+typeLabel(d.type)+'</span><span>'+fmt(d.updatedAt)+'</span><span>'+d.charCount.toLocaleString("ko-KR")+'자</span>'+d.tags.map(t=>'<span>#'+esc(t)+'</span>').join("")+'</div><div class="reader-actions"><button data-copy="plain">Plain Copy</button><button data-copy="board">Board Copy</button><button data-top>Top</button>'+(navigator.share?'<button data-share>Share</button>':'')+'</div><div class="content">'+d.contentHtml+'</div></article>',d)}function openReader(html,d){const r=document.getElementById("reader");r.innerHTML='<div class="reader-head"><strong>READ-ONLY SNAPSHOT</strong><button data-close>닫기</button></div><main class="doc">'+html+'</main>';r.classList.remove("hidden");r.querySelector("[data-close]").onclick=()=>r.classList.add("hidden");r.querySelector("[data-back]")?.addEventListener("click",()=>r.classList.add("hidden"));r.querySelector("[data-top]")?.addEventListener("click",()=>r.querySelector(".doc").scrollTo({top:0,behavior:"smooth"}));r.querySelector("[data-copy=plain]")?.addEventListener("click",()=>copy(d.plainText));r.querySelector("[data-copy=board]")?.addEventListener("click",()=>copy(boardText(d)));r.querySelector("[data-share]")?.addEventListener("click",()=>navigator.share({title:d.title,text:d.previewText}).catch(()=>{}));adaptColors()}function boardText(d){const box=document.createElement("div");box.innerHTML=d.contentHtml;box.querySelectorAll("br").forEach(x=>x.replaceWith("\\n"));box.querySelectorAll("p,div,h1,h2,h3,li,blockquote,pre").forEach(x=>x.append("\\n"));return (d.title+"\\n\\n"+box.textContent).replace(/\\n{3,}/g,"\\n\\n").trim()}async function copy(text){try{await navigator.clipboard.writeText(text)}catch{const a=document.createElement("textarea");a.value=text;document.body.append(a);a.select();document.execCommand("copy");a.remove()}toast("복사했습니다")}function toast(t){const el=document.getElementById("toast");el.textContent=t;el.classList.remove("hidden");setTimeout(()=>el.classList.add("hidden"),1400)}function parseColor(v){if(!v||["inherit","currentcolor","transparent"].includes(String(v).toLowerCase()))return null;const p=document.createElement("span");p.style.color=v;document.body.append(p);const c=getComputedStyle(p).color;p.remove();const m=c.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);return m?{r:+m[1],g:+m[2],b:+m[3],a:m[4]===undefined?1:+m[4]}:null}function lum(c){const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)}function lightBg(el,root){let n=el,d=0;while(n&&n!==root&&d++<5){const c=parseColor(getComputedStyle(n).backgroundColor);if(c&&c.a>.05&&lum(c)>.55)return true;n=n.parentElement}return false}function adaptColors(){const root=document.querySelector(".content");if(!root)return;root.querySelectorAll("[data-dark-color-fix]").forEach(e=>e.removeAttribute("data-dark-color-fix"));if(document.documentElement.dataset.theme!=="dark")return;root.querySelectorAll('[style*="color" i]').forEach(e=>{const c=parseColor(e.style.color);if(c&&lum(c)<.35&&!lightBg(e,root)&&!e.closest("pre,code,a,mark,.spoiler"))e.dataset.darkColorFix="true"})}theme();render();})();`;
  }

  function markdownToHtml(markdown) {
    return `<p>${escapeHtml(markdown || "").replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
  }

  function htmlToPlainText(html) {
    const box = document.createElement("div");
    box.innerHTML = sanitizeSnapshotHtml(html || "<p></p>", { includeImages: true });
    box.querySelectorAll("br").forEach((node) => node.replaceWith("\n"));
    box.querySelectorAll("p,div,h1,h2,h3,li,blockquote,pre,tr").forEach((node) => node.append("\n"));
    return box.textContent.replace(/\n{3,}/g, "\n\n").trim();
  }

  function extractToc(html) {
    const box = document.createElement("div");
    box.innerHTML = html || "";
    return [...box.querySelectorAll("h1,h2,h3")].slice(0, 80).map((node, index) => ({
      id: `h-${index + 1}`,
      level: Number(node.tagName.slice(1)),
      text: node.textContent.trim(),
    }));
  }

  function extractWikiLinks(text) {
    return [...String(text || "").matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => match[1].trim()).filter(Boolean);
  }

  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function toTime(value) {
    if (typeof value === "number") return value;
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : Date.now();
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  window.ForgeSnapshot = {
    openForgeSnapshotDialog,
    collectSnapshotDocuments,
    buildSnapshotData,
    sanitizeSnapshotHtml,
    normalizeSnapshotDocument,
    buildSnapshotHtml,
    downloadSnapshotHtml,
    estimateSnapshotSize,
    generateSnapshotFilename,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachDialogEvents);
  } else {
    attachDialogEvents();
  }
})();
