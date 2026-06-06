# TextForge Project Overview

TextForge는 로컬 우선 rich text 문서 작업공간이다. 시작점은 Windows 메모장보다 강한 개인용 에디터였지만, 현재는 문서 작성, 문서함 관리, 변환, 백업, 읽기 전용 아카이브까지 포함하는 로컬 문서 도구로 발전했다.

대표 방향은 단순하다.

> 서식은 풍부하게, 출력은 깨끗하게.

## 무엇을 위해 만들었나

TextForge는 계정, 서버, 클라우드 동기화 없이 개인 문서를 빠르게 쓰고 보존하기 위한 도구다. 일반 메모 앱은 빠르지만 출력과 문서함이 약하고, Google Docs류 도구는 협업에는 강하지만 로컬 보존성이 약하다. Markdown 전용 에디터는 깨끗하지만 rich text 작성 경험이 제한된다.

TextForge는 그 사이에서 다음을 목표로 한다.

- 빠른 문서 작성
- 로컬 저장
- Finder/GoodNotes식 문서함
- Rich Text 작성과 clean output 변환
- 장기 보존용 Forge Snapshot
- 앱 모드 실행
- 원본 문서 보호

## 다른 도구와의 차이

| 비교 대상 | TextForge와의 차이 |
| -- | -- |
| Windows 메모장 | TextForge는 rich text, 문서함, 태그, export, snapshot을 제공한다. |
| Google Docs | TextForge는 협업/클라우드가 아니라 로컬 저장과 개인 보존을 우선한다. |
| VS Code | TextForge는 코드 에디터가 아니라 문서 작성 UX와 출력 변환에 맞춘 도구다. |
| Markdown editor | TextForge는 Markdown 출력도 가능하지만 기본 작성 경험은 rich text 중심이다. |

## 현재 주요 기능

- Rich Text 작성
- Write / Source / Preview / Split View
- Finder 스타일 문서함
- 태그, 폴더, 즐겨찾기, 검색, 정렬
- Smart Copy: Plain, Rich, Markdown, Board
- Export: TXT, MD, HTML, PDF, DOC, EPUB, PNG Card
- 자동저장과 세션 복구
- 문서 히스토리 스냅샷
- Prompt Vault
- 목차, 문서 링크, 백링크
- Light / Dark Theme
- 다크모드 inline dark text 보정
- Forge Snapshot 읽기 전용 HTML 아카이브
- Diagnostics / Benchmark / MTTR
- PWA manifest와 app mode launcher
- Focus Mode
- 긴 문서 typing fast sync
- 자동 줄바꿈 display-only 처리
- Safety Snapshot과 bulk undo/redo
- AI 출력 정리 원본 보호
- Focus Mode 폭 조절

## 대표 사용 흐름

1. 문서를 작성한다.
2. 문서함에서 태그, 폴더, 즐겨찾기로 정리한다.
3. 필요한 출력 형식으로 Smart Copy 또는 Export를 실행한다.
4. 장기 보존이나 모바일 열람이 필요하면 Forge Snapshot을 만든다.
5. 위험한 정리 작업 전에는 Safety Snapshot과 history를 확인한다.

## 현재 안정 버전 기준

현재 계열은 `v0.9.x Local Ready`로 볼 수 있다. 로컬 앱으로 쓰기 위한 주요 기능은 갖추었고, 최근에는 긴 문서 입력 속도와 원본 보호 정책을 강화했다.

검증된 방향:

- 실제 문서함 기반 Forge Snapshot 생성과 열람
- 문서 전환 fast path
- 긴 문서 typing fast sync
- 자동 줄바꿈 display-only
- AI 출력 정리 원본 보호
- safety snapshot 기반 복구 가능성 강화

## 아직 하지 않은 것

아래 항목은 의도적으로 아직 정식 도입하지 않았다.

- 클라우드 동기화
- 모바일 편집
- Supabase 같은 외부 DB 연동
- Vercel 배포 기반 웹 미러
- Tauri/Electron 정식 앱 전환
- ProseMirror/Tiptap 같은 editor engine 교체
- 기존 사용자 문서 데이터 migration

## 중요한 주의

TextForge 저장소는 앱 코드 저장소다. 실제 사용자 문서는 브라우저 프로필의 localStorage / IndexedDB에 저장된다. GitHub에 코드를 올린다고 사용자 문서가 같이 백업되는 것은 아니다.

사용자 문서 보존은 다음을 우선한다.

- Forge Snapshot
- Export
- 브라우저 프로필 백업
- TextForge 내부 history / safety snapshot
