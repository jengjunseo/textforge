const NOW = new Date("2026-06-03T09:00:00.000Z");

function makeDocument(options = {}) {
  const text = String(options.text ?? "TextForge local document");
  const id = options.id || `fixture-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: options.title ?? `Fixture ${id}`,
    content: options.content ?? text,
    contentHtml: options.contentHtml ?? `<p>${text}</p>`,
    plainText: options.plainText ?? text,
    previewText: options.previewText ?? text.replace(/\s+/g, " ").slice(0, 120),
    type: options.type || "note",
    folderId: options.folderId ?? null,
    tags: options.tags || [],
    favorite: Boolean(options.favorite),
    deletedAt: options.deletedAt || null,
    charCount: options.charCount ?? text.length,
    historyCount: options.historyCount || 0,
    createdAt: options.createdAt || NOW.toISOString(),
    updatedAt: options.updatedAt || NOW.toISOString(),
    color: options.color || "#167c80",
  };
}

function createEditorFixtures() {
  const long17k = "가".repeat(17000);
  const long100k = "Long document sentence. ".repeat(5000).slice(0, 100000);
  const oneLine50k = "x".repeat(50000);
  return {
    empty: makeDocument({ id: "empty", title: "Empty", text: "", content: "", contentHtml: "<p></p>" }),
    regular: makeDocument({ id: "regular", title: "Regular", text: "A normal local-first writing document." }),
    long17k: makeDocument({ id: "long-17k", title: "17K", text: long17k }),
    long100k: makeDocument({ id: "long-100k", title: "100K", text: long100k }),
    oneLine50k: makeDocument({ id: "one-line-50k", title: "One line 50K", text: oneLine50k }),
    nestedFormatting: makeDocument({
      id: "nested-formatting",
      title: "Nested formatting",
      text: "Nested list quote link inline formatting",
      contentHtml: '<blockquote><ul><li><strong>Bold <em>italic</em></strong></li><li><a href="https://example.invalid">Link</a></li></ul></blockquote>',
    }),
    aiHtml: makeDocument({
      id: "ai-html",
      title: "AI output",
      text: "AI output with headings code and a table",
      contentHtml: "<h2>AI output</h2><pre><code>const local = true;</code></pre><table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>",
    }),
    legacy: {
      id: "legacy",
      title: "Legacy document",
      content: "Legacy Markdown without newer derived fields",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  };
}

function createNestedFolders(depth = 8) {
  return Array.from({ length: depth }, (_, index) => ({
    id: `folder-${index}`,
    name: `Folder ${index + 1}`,
    parentId: index ? `folder-${index - 1}` : null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  }));
}

function createLibraryDocuments(count = 39, totalCharacters = 228622) {
  const base = Math.floor(totalCharacters / count);
  const remainder = totalCharacters % count;
  return Array.from({ length: count }, (_, index) => {
    const charCount = base + (index < remainder ? 1 : 0);
    return makeDocument({
      id: `library-${index}`,
      title: index % 11 === 0 ? `Untitled ${index}` : `Library Document ${index + 1}`,
      text: "x".repeat(Math.max(0, charCount)),
      previewText: `Local library fixture ${index + 1}`,
      charCount,
      folderId: index % 6 === 0 ? null : `folder-${index % 4}`,
      tags: index % 4 === 0 ? ["writing", "local"] : ["notes"],
      favorite: index % 7 === 0,
      historyCount: index % 9 === 0 ? 2 : 0,
      createdAt: new Date(NOW.getTime() - index * 86400000).toISOString(),
      updatedAt: new Date(NOW.getTime() - index * 3600000).toISOString(),
    });
  });
}

function createPortalScaleDocuments(count = 1000) {
  return Array.from({ length: count }, (_, index) => makeDocument({
    id: `scale-${index}`,
    title: `Portal Document ${String(index + 1).padStart(4, "0")}`,
    text: `metadata preview ${index} local writing release notes`,
    previewText: `Searchable local metadata preview ${index}`,
    charCount: 300 + (index % 130) * 137,
    folderId: index % 8 === 0 ? null : `folder-${index % 12}`,
    tags: index % 5 === 0 ? ["release", "writing"] : ["notes"],
    favorite: index % 13 === 0,
    historyCount: index % 19 === 0 ? 1 : 0,
    updatedAt: new Date(NOW.getTime() - index * 60000).toISOString(),
  }));
}

module.exports = {
  makeDocument,
  createEditorFixtures,
  createNestedFolders,
  createLibraryDocuments,
  createPortalScaleDocuments,
};
