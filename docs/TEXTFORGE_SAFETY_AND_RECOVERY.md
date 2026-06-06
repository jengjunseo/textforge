# TextForge Safety And Recovery

TextForge의 핵심 원칙은 사용자 원본 문서를 보호하는 것이다. 보기 옵션, 성능 옵션, 진단 기능은 원본 `contentHtml`을 바꾸면 안 된다.

## 안전 원칙

- 서버 없음, 계정 없음, 클라우드 동기화 없음
- 사용자 문서는 브라우저 프로필 localStorage / IndexedDB에 저장
- GitHub repository는 앱 코드만 포함
- 위험 작업 전에는 History 또는 Safety Snapshot을 남김
- 원본 덮어쓰기보다 새 문서 복원을 우선
- Forge Snapshot은 장기 보존용 read-only archive

## History Snapshot

문서 객체의 `history` 배열에 저장되는 스냅샷이다. 수동 스냅샷과 자동 스냅샷이 있다.

포함 내용:

- title
- content
- contentHtml
- createdAt
- label

History는 현재 문서 단위 복구에 유용하다.

## Safety Snapshot

Safety Snapshot은 위험한 bulk 작업 전 history에 추가되는 보호 스냅샷이다.

현재 적용된 예:

- AI 출력 정리 전 `Safety: before-ai-cleanup`
- 전체 문서 clear formatting 전
- Ctrl+A 전체 서식 적용 전
- 전체 block style 변경 전

Safety Snapshot은 별도 저장 포맷이 아니라 기존 document history를 사용한다.

## Bulk Undo / Redo

일반 타이핑은 브라우저 native undo를 우선한다. TextForge app-level bulk undo/redo는 전체 문서 대상 작업 직후에만 사용한다.

지원 흐름:

- 전체 문서 서식 적용
- 전체 문서 block style 변경
- 전체 문서 clear formatting

동작:

- bulk 작업 직후 `Ctrl+Z`는 직전 bulk 작업을 복구한다.
- `Ctrl+Y` 또는 `Ctrl+Shift+Z`는 redo를 시도한다.
- 일반 타이핑이 시작되면 bulk undo pending 상태는 해제된다.

## Forge Snapshot의 역할

Forge Snapshot은 문서함을 하나의 읽기 전용 HTML 아카이브로 굽는다.

용도:

- 모바일 열람
- 장기 보존
- 오프라인 백업
- 문서 박물관 형태 보관

중요:

- 현재 TextForge 편집기로 직접 import하는 기능은 없다.
- Snapshot HTML 안에는 문서 데이터 JSON이 들어 있으므로 복구 원천으로는 사용할 수 있다.
- 복구 기능을 만들 때는 원본 덮어쓰기보다 새 문서 생성 방식이 안전하다.

## 보기 옵션은 원본을 바꾸면 안 된다

아래 기능은 display-only여야 한다.

- 자동 줄바꿈
- 긴 글 보호/성능 보호 표시
- Focus Mode 폭 조절
- Preview / Source / Write 전환
- Light/Dark Theme

특히 자동 줄바꿈은 `contentHtml`, `richEditor.innerHTML`, plain text를 변경하면 안 된다. 현재는 `textforge.wordWrap` preference와 CSS class로만 처리한다.

## AI 출력 정리 정책

AI 출력 정리는 plain text 기준 정리 과정이 들어가므로 원본을 망가뜨릴 위험이 있다.

현재 안전 정책:

1. 확인창 표시
2. 원본 문서에 `Safety: before-ai-cleanup` 생성
3. 원본은 유지
4. 정리 결과를 새 문서로 생성
5. 새 문서 제목은 `원본 제목 - cleaned`

원본 직접 덮어쓰기는 기본 흐름이 아니어야 한다.

## 문서가 망가졌을 때 복구 순서

1. 즉시 추가 입력을 멈춘다.
2. 현재 문서를 덮어쓰지 않는다.
3. Forge Snapshot이 있는지 확인한다.
4. History tab에서 최근 snapshot을 확인한다.
5. `Safety:` label이 붙은 snapshot을 확인한다.
6. 세션 복구 데이터가 있는지 확인한다.
7. 가능하면 복구 후보를 새 문서로 만든다.
8. 기존 문서는 삭제하지 말고 보존한다.
9. 복구 후 Forge Snapshot을 다시 만든다.

## 위험 작업 목록

| 작업 | 위험 | 필요한 안전장치 |
| -- | -- | -- |
| AI 출력 정리 | 문단/공백/서식 손상 | 원본 유지, 새 문서 생성, Safety Snapshot |
| 전체 서식 제거 | 전체 span/style 제거 | Safety Snapshot, bulk undo |
| Ctrl+A 전체 서식 적용 | 전체 문서 style 변경 | Safety Snapshot, bulk undo |
| Source rewrite | HTML 재생성 | 확인창, Safety Snapshot |
| Normalize/Cleanup | 구조 손상 가능 | 미리보기, 새 문서 생성 우선 |
| Export/Smart Copy 변경 | 출력 회귀 가능 | fixture와 수동 확인 |
| Forge Snapshot 변경 | 백업/보존 회귀 가능 | snapshot sample 확인 |

## 복구보다 더 좋은 예방

- 위험 기능은 기본적으로 원본 보호형이어야 한다.
- 사용자가 명시적으로 원본 덮어쓰기를 선택하지 않았다면 새 문서로 만든다.
- 경고 UI는 editor layout을 밀면 안 된다.
- 성능 기능은 사용자 문서 내용을 바꾸면 안 된다.
