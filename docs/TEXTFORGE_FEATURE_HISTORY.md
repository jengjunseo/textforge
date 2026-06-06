# TextForge Feature History

이 문서는 TextForge가 어떤 문제를 해결하면서 발전했는지 기록한다.

## 1. 메모장보다 강한 로컬 에디터

문제:

- 기본 메모장은 빠르지만 문서함, 서식, 출력 변환이 약하다.

해결:

- 단일 페이지 로컬 앱으로 시작했다.
- localStorage 기반 문서 배열과 active document 개념을 만들었다.

교훈:

- 빠른 작성 경험이 기본이다.
- 서버와 계정은 초기 목표에서 제외한다.

관련:

- `index.html`
- `app.js`

## 2. Rich Text MVP

문제:

- Markdown만으로는 사용자가 원하는 즉시 서식 경험이 부족하다.

해결:

- `contenteditable` 기반 rich editor를 중심에 두었다.
- Source / Preview 모드를 함께 제공했다.

교훈:

- rich HTML과 Markdown 변환 사이의 동기화가 핵심 난제다.

관련:

- `syncRichToDocumentFull`
- `markdownToHtml`
- `htmlToMarkdown`

## 3. Smart Copy / Export

문제:

- 같은 문서를 상황마다 plain, rich, Markdown, board, HTML 등으로 내보내야 한다.

해결:

- Smart Copy와 Export 메뉴를 추가했다.
- TXT, MD, HTML, PDF, DOC, EPUB, PNG Card를 지원한다.

교훈:

- 출력 변환은 사용자의 실제 workflow와 맞닿아 있어 회귀 위험이 크다.

관련:

- `copyAs`
- `exportFile`
- `exportEpub`
- `exportCard`

## 4. Finder / GoodNotes식 문서함

문제:

- 단순 문서 목록만으로는 문서가 늘어날수록 관리가 어렵다.

해결:

- Finder 스타일 문서함을 만들었다.
- 태그, 폴더, 즐겨찾기, 검색, 정렬, bulk move/trash를 추가했다.

교훈:

- 문서 작성 앱은 편집기만큼 문서함 UX가 중요하다.

관련:

- `renderFinder`
- `getFinderDocuments`
- `createDocCard`

## 5. Forge Snapshot

문제:

- 로컬 문서를 장기 보존하고 모바일에서 읽을 방법이 필요했다.

해결:

- 문서함을 하나의 읽기 전용 HTML 파일로 굽는 Forge Snapshot을 추가했다.

교훈:

- 백업은 단순 export보다 열람 가능한 archive 형태가 강하다.
- Snapshot은 read-only가 원칙이다.

관련:

- `forge-snapshot.js`
- `openForgeSnapshotPanel`

## 6. App Mode / PWA 준비

문제:

- 브라우저 탭이 아니라 로컬 앱처럼 실행하고 싶었다.

해결:

- `manifest.json`
- `launch-textforge-app.bat`
- `Start TextForge.cmd`
- icon files

교훈:

- Tauri/Electron 전에 app mode만으로도 사용성 개선이 크다.

## 7. Diagnostics / Benchmark / MTTR

문제:

- 성능과 신뢰성을 감으로 판단하면 위험하다.

해결:

- Quick/Full Benchmark
- Reliability Loop
- Forge Snapshot Benchmark
- MTTR Benchmark
- Real Library Benchmark
- Document Switch Benchmark

교훈:

- 실제 사용자 문서함 기준 측정이 중요하다.
- headless 임시 프로필 결과만으로 결론을 내리면 안 된다.

관련:

- `textforge-diagnostics.js`
- `run-document-switch-benchmark.cjs`

## 8. 문서 전환 최적화

문제:

- 문서 전환이 체감상 느릴 때가 있었다.

해결:

- render path를 계측했다.
- selected list item 갱신과 deferred render를 사용했다.

교훈:

- 실제 병목을 확인하기 전까지 무리한 최적화를 하지 않는다.

관련:

- `openDocumentInPane`
- `renderActive`
- `renderActiveDeferred`

## 9. 긴 문서 typing fast sync

문제:

- 17,000자 이상 문서에서 매 입력마다 sanitize, Markdown 변환, stats, preview가 실행되어 typing이 느려졌다.

해결:

- `syncRichToDocumentFast`와 `syncRichToDocumentFull`로 분리했다.
- 입력 중에는 memory `contentHtml` 반영과 timer 예약만 수행한다.
- 무거운 파생 데이터 갱신은 debounce/flush로 미룬다.

교훈:

- 입력 handler는 16ms frame budget을 넘기지 않는 것이 중요하다.

관련:

- `syncRichToDocumentFast`
- `flushRichDocumentNow`
- `scheduleSanitizedSync`

## 10. 자동 줄바꿈 display-only

문제:

- 자동 줄바꿈/긴 줄 보호 기능이 문서 내용을 실제로 바꿔 공백과 줄 구조를 손상시킬 수 있었다.

해결:

- 줄바꿈은 `textforge.wordWrap` preference와 CSS class만 바꾸도록 수정했다.
- guard banner는 layout shift를 만들지 않도록 비활성화했다.

교훈:

- 보기 옵션은 절대 원본 문서를 바꾸면 안 된다.

관련:

- `toggleWordWrapDisplayOnly`
- `applyWordWrapPreference`

## 11. Safety Snapshot / Bulk Undo Redo

문제:

- 전체 문서 서식 변경은 native undo만으로 복구가 불안정할 수 있다.

해결:

- 전체 문서 대상 작업 전 Safety Snapshot을 history에 남긴다.
- bulk operation undo/redo stack을 추가했다.

교훈:

- 일반 타이핑은 native undo, bulk 작업은 app-level recovery가 적합하다.

관련:

- `createSafetySnapshot`
- `pushBulkOperationUndoState`
- `restoreLastBulkOperation`
- `redoLastBulkOperation`

## 12. AI 출력 정리 원본 보호

문제:

- AI 출력 정리가 plain text 변환 후 문서를 덮어써 공백/문단/서식을 손상시킬 수 있었다.

해결:

- 원본을 덮어쓰지 않고 새 문서로 정리 결과를 만든다.
- 실행 전 확인창과 Safety Snapshot을 추가했다.

교훈:

- 정리 기능은 기본적으로 원본 보호형이어야 한다.

관련:

- `cleanAiOutput`

## 13. Focus Mode resize

문제:

- Focus Mode 글 박스 폭이 고정되어 사용자가 원하는 캔버스 폭을 직접 조절할 수 없었다.

해결:

- 좌우 resize handle을 추가했다.
- `textforge.focusCanvasWidth` preference와 CSS variable로 폭을 저장한다.

교훈:

- 보기 preference는 문서 content와 분리한다.

관련:

- `applyFocusCanvasWidth`
- `initFocusResizeHandles`
- focus-mode CSS
