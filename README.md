# TextForge v1.0 Local

TextForge는 서버, 계정, 클라우드 동기화 없이 브라우저 프로필에 문서를 저장하는 로컬 우선 Rich Text 문서 작업공간입니다.

> 서식은 풍부하게, 출력은 깨끗하게.

## 실행

```powershell
npm.cmd start
```

브라우저 주소:

```txt
http://127.0.0.1:4291
```

Windows app mode는 `Start TextForge.cmd`로 실행할 수 있습니다.

## 프로젝트 브리핑

현재 구현, 아키텍처, 안전 계약, 동결 영역, 남은 한계와 다음 개발 시작점은 다음 단일 문서를 기준으로 합니다.

- [텍스트포지 프로젝트 브리핑](docs/%ED%85%8D%EC%8A%A4%ED%8A%B8%ED%8F%AC%EC%A7%80%20%EB%B8%8C%EB%A6%AC%ED%95%91.md)

## 확인

```powershell
npm.cmd run check
```

실제 사용자 문서는 repository가 아니라 브라우저 프로필의 localStorage/IndexedDB에 있습니다. Git commit이나 소스 백업은 사용자 문서 백업이 아니며, 문서 보존에는 Forge Snapshot, Export 또는 브라우저 프로필 백업을 사용해야 합니다.

## 남은 검증

상세 근거와 동결 범위는 [프로젝트 브리핑](docs/%ED%85%8D%EC%8A%A4%ED%8A%B8%ED%8F%AC%EC%A7%80%20%EB%B8%8C%EB%A6%AC%ED%95%91.md)의 7–8절을 참고하세요.

- [ ] 실제 Windows app mode에서 한글 IME, Undo/Redo, 별도 창 재연결을 수동 검증한다.
- [ ] 격리된 테스트 문서로 주요 Export와 브라우저 인쇄·Snapshot 열람을 확인한다.
- [ ] 실제 화면 배율과 다중 모니터 조합을 확인한다.
