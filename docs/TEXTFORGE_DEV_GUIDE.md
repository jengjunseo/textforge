# TextForge Dev Guide

이 문서는 TextForge 개발 작업을 이어받는 사람을 위한 작업 가이드다.

## 실행 방법

Node.js가 설치되어 있으면 다음으로 실행한다.

```bash
npm start
```

또는 직접 서버를 실행한다.

```bash
node dev-server.js
```

브라우저에서 연다.

```txt
http://127.0.0.1:4291
```

Windows app mode로 실행하려면 다음 파일을 사용할 수 있다.

```txt
Start TextForge.cmd
```

내부적으로 `launch-textforge-app.bat`가 로컬 서버 상태를 확인하고 Edge 또는 Chrome의 `--app=http://127.0.0.1:4291` 모드로 연다.

## 기본 테스트 명령

```bash
node --check app.js
node --check forge-snapshot.js
node --check textforge-diagnostics.js
```

전체 check:

```bash
npm run check
```

Windows PowerShell에서 `npm.ps1` 실행 정책 오류가 나면 다음을 사용한다.

```bash
npm.cmd run check
```

## 브라우저에서 확인할 것

변경 후 최소 확인:

- 앱 로드
- 문서 작성
- 문서 전환
- 자동저장 표시
- 새로고침 후 세션 복구
- Smart Copy
- Export
- Forge Snapshot
- Focus Mode
- Light/Dark Theme
- Source / Preview / Split View
- 긴 문서 입력 반응

성능 변경이라면 Typing Debug 또는 Diagnostics를 사용한다.

```js
window.TextForgeTypingDebug.enable()
window.TextForgeTypingDebug.clear()
window.TextForgeTypingDebug.summary()
```

## 권장 브랜치 전략

`main`은 가능한 안정 상태로 유지한다.

추천 branch 이름:

- `feature/...`
- `fix/...`
- `safety/...`
- `docs/...`
- `perf/...`

대형 변경 전에는 release snapshot 또는 별도 backup을 만든다.

## Codex 작업 원칙

- 먼저 코드와 실제 파일 구조를 읽는다.
- 계측 없는 최적화를 피한다.
- 저장 포맷과 사용자 문서 데이터는 함부로 바꾸지 않는다.
- Smart Copy, Export, Forge Snapshot은 영향 범위가 크므로 좁게 건드린다.
- 긴 문서 성능은 실제 문서함/실제 앱 상태에서 확인한다.
- 보기 옵션은 `contentHtml`을 바꾸면 안 된다.
- 위험한 bulk 작업은 Safety Snapshot을 먼저 만든다.
- 작업 후 `npm.cmd run check` 또는 JS syntax check를 실행한다.

## 커밋 전 체크리스트

- [ ] 사용자 문서 수정 없음
- [ ] 저장 포맷 변경 없음 또는 명시 기록
- [ ] Smart Copy 정상
- [ ] Export 정상
- [ ] Forge Snapshot 정상
- [ ] 자동저장 정상
- [ ] 세션 복구 정상
- [ ] 문서 전환 속도 유지
- [ ] 긴 문서 typing 속도 유지
- [ ] Light/Dark Theme 정상
- [ ] Focus Mode 정상
- [ ] `node --check app.js` 통과
- [ ] `node --check forge-snapshot.js` 통과
- [ ] `node --check textforge-diagnostics.js` 통과

## 자주 건드리는 영역

| 목적 | 주로 보는 파일/함수 |
| -- | -- |
| editor 입력 | `app.js`, `syncRichToDocumentFast`, `syncRichToDocumentFull` |
| 저장 | `persistSoon`, `persistNow`, `persistToDurableStorage`, `hydrateFromDurableStorage` |
| 문서 전환 | `openDocumentInPane`, `renderActive`, `renderDocList` |
| Finder | `renderFinder`, `getFinderDocuments`, `createDocCard` |
| Export | `copyAs`, `exportFile`, `exportEpub`, `exportCard` |
| Forge Snapshot | `forge-snapshot.js`, `openForgeSnapshotPanel` |
| Diagnostics | `textforge-diagnostics.js`, `configureDiagnosticsContext` |
| Focus Mode | `applyFocusMode`, `applyFocusCanvasWidth`, focus-mode CSS |
| Safety | `createSafetySnapshot`, `pushBulkOperationUndoState` |

## 개발 시 금지에 가까운 작업

- 기존 사용자 문서 migration
- editor engine 교체
- 저장 key 변경
- `contentHtml`를 보기 옵션 때문에 변경
- hidden preview를 매 입력마다 강제 렌더
- Forge Snapshot format을 대규모 변경
- Export 변환 로직을 한 번에 크게 수정

## release snapshot 권장 시점

- 저장 구조 변경 전
- editor loop 변경 전
- Export/Forge Snapshot 변경 전
- 대형 UI 구조 변경 전
- 실제 사용자 문서로 benchmark 하기 전
