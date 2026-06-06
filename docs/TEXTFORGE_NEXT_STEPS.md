# TextForge Next Steps

이 문서는 앞으로의 개발 후보를 정리한다. 지금 당장 해야 하는 것과 나중에 해도 되는 것을 분리한다.

## 우선순위 표

| 후보 | 목적 | 난이도 | 위험도 | 선행 조건 | 추천 시점 |
| -- | -- | --: | --: | -- | -- |
| v0.9.2 Writer Safety 태그 | 현재 안전 패치 안정화 | 낮음 | 낮음 | 회귀 테스트 | 즉시 |
| 복구 UI 강화 | Safety/History/Forge Snapshot 복구 흐름 명확화 | 중간 | 중간 | 복구 후보 UI 설계 | 가까운 다음 |
| Snapshot Import Prototype | Forge Snapshot에서 새 문서로 복원 | 중간 | 높음 | 원본 덮어쓰기 금지 정책 | 복구 UI 후 |
| Web Mirror 설계 | 모바일/웹 열람용 mirror | 높음 | 중간 | snapshot/export 안정화 | 나중 |
| TextForge Uploader | 외부 업로드/전송 경로 | 높음 | 높음 | 보안/개인정보 정책 | 훨씬 나중 |
| Mobile Web Draft | 모바일에서 초안 작성 | 중간 | 중간 | 작은 화면 editor UX | Web Mirror 후 |
| Tauri 전환 검토 | 정식 데스크톱 앱화 | 높음 | 중간 | local app mode 안정화 | v1 후보 |
| 문서 검색 고도화 | 큰 문서함 검색 품질 개선 | 중간 | 낮음 | search index 정책 | 안정화 후 |
| Writer Mode 정식화 | 긴 글 작성 화면 정돈 | 중간 | 낮음 | Focus Mode resize 검증 | 가까운 다음 |
| 대형 문서 DOM 최적화 | 더 긴 문서 성능 확보 | 높음 | 높음 | 계측 데이터 | 필요 시 |
| 서식 엔진 개선 | inline style 안정성 향상 | 높음 | 높음 | fixture와 undo 정책 | 조심스럽게 |
| 테스트 자동화 | 회귀 방지 | 중간 | 낮음 | 테스트 시나리오 정리 | 상시 |
| 프로젝트 문서 자동 갱신 | docs drift 방지 | 중간 | 낮음 | docs 구조 확정 | 나중 |

## 지금 당장 추천하는 순서

1. v0.9.2 Writer Safety 태그 만들기
2. 실제 17,000자 문서에서 typing debug 재측정
3. AI 출력 정리 새 문서 생성 UX 확인
4. Focus Mode resize 수동 확인
5. Forge Snapshot 새로 생성
6. 복구 UI 설계

## v0.9.2 Writer Safety 태그

목적:

- 긴 문서 typing fast sync
- 자동 줄바꿈 display-only
- guard banner 무해화
- Safety Snapshot
- AI 출력 정리 원본 보호
- Focus Mode resize

이 세트를 하나의 안정 태그로 묶어두면 이후 Web/Mobile/Tauri 확장 전에 돌아올 기준점이 생긴다.

## 복구 UI 강화

현재 복구 수단은 존재하지만 사용자가 한눈에 보기 어렵다.

강화 후보:

- Safety Snapshot 목록 필터
- snapshot preview
- 새 문서로 복원 버튼
- Forge Snapshot에서 복구 후보 추출
- 복구 전 현재 문서 보존 확인

원칙:

- 기존 문서 직접 덮어쓰기 금지
- 기본은 새 문서 생성

## Snapshot Import Prototype

현재 Forge Snapshot은 read-only archive다. 하지만 HTML 내부의 `textforge-snapshot-data` JSON은 복구 원천으로 사용할 수 있다.

Prototype 방향:

1. snapshot HTML 파일 선택
2. `#textforge-snapshot-data` JSON 파싱
3. 문서 목록 preview
4. 선택 문서만 새 문서로 복원
5. 제목에 `[Snapshot 복원]` 표시
6. 기존 문서함과 merge하되 덮어쓰기 금지

위험:

- 중복 문서
- 오래된 snapshot
- 이미지 포함 여부
- folder/tag 충돌

## Web Mirror

목적:

- 모바일/다른 기기에서 읽기
- 편집이 아니라 mirror와 archive 중심

아직 하지 말아야 할 것:

- 실시간 sync
- 로그인
- Supabase 구조 도입
- 원본 문서 자동 업로드

먼저 설계해야 할 것:

- 무엇을 mirror할지
- 민감 문서 제외 방식
- snapshot 기반 배포인지
- 수동 upload인지

## Mobile Web Draft

모바일 편집은 desktop rich editor와 요구가 다르다. 바로 같은 editor를 모바일에 가져가기보다 draft 중심으로 생각하는 것이 안전하다.

후보:

- plain draft
- quick capture
- 나중에 desktop TextForge로 import
- rich formatting 최소화

## Tauri 전환 검토

Tauri는 정식 앱 경험을 줄 수 있지만, 지금 바로 도입하면 저장/파일 접근/업데이트 정책이 커진다.

도입 전 확인:

- 현재 app mode로 충분한지
- 파일 시스템 저장이 필요한지
- 브라우저 localStorage/IndexedDB를 어떻게 옮길지
- 사용자 문서 migration 계획이 있는지

## 대형 문서 DOM 최적화

현재는 fast sync로 입력 병목을 줄였다. 더 큰 문서에서 문제가 생기면 다음 후보를 검토한다.

- DOM node count 계측
- 특정 문서 HTML 복잡도 분석
- hidden preview 완전 lazy
- panel lazy update
- 장문 문서 전용 mode

단, editor engine 교체는 마지막 선택지다.

## 테스트 자동화 후보

우선순위 높은 수동/자동 테스트:

- 긴 문서 typing 30자
- Backspace 20회
- IME 입력
- 문서 전환 10회
- Smart Copy 4종
- Export 주요 형식
- Forge Snapshot 생성/열람
- AI 출력 정리 원본 보존
- 줄바꿈 display-only hash 불변
- Focus Mode resize 저장/복원

## 뒤로 미뤄야 할 것

- 클라우드 sync
- 계정 시스템
- Supabase 도입
- 모바일 rich text full editor
- Tauri migration
- editor engine 교체

이들은 제품 방향을 크게 바꾸므로 현재 local ready 기준이 충분히 안정화된 뒤 검토한다.
