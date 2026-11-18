# GitHub 다운로드 후 개발 인수인계

기준일: 2026-11-18 (Asia/Seoul). 대상 저장소: https://github.com/daeeon8728/DallaBusan . 소스와 데이터 인수인계이며 호스팅/제휴 채널 신청이 아니다.

## 포함·제외 범위

| 항목 | 포함 여부와 복원 방법 |
| --- | --- |
| apps/web, apps/server, packages/domain | 전체 소스·마이그레이션·구성 포함 |
| package.json / lockfile / .node-version / .npmrc | 포함. Node24.14.1/npm11.11.0에서 npm ci |
| config/catalog | 상품/제휴 링크·사진/번역 근거·관광지·맛집·테마·주차·코스 자료 포함 |
| data/snapshots/trip-fit.sqlite / manifest.json | 기존 공공 DB와 해시·행 수 포함. db:restore로 새 DB에만 복원 |
| apps/web/public | 기존 로고·로컬 사진 포함. 외부 상품 사진 URL 정책 유지 |
| tests / docs / docs/screenshots / AGENTS.md | 전체 테스트·계획·근거·회귀 캡처 포함 |
| .env | 제외. 기존 PC에서 개인적으로 복사하거나 .env.example에 값을 입력 |
| node_modules / dist / 테스트 결과 | 제외. npm ci / build / 브라우저 설치 후 재생성 |
| 활성 var/*.sqlite 및 잠금/로그 | 제외. 기존 DB를 삭제하지 않으며 공공 자료만 별도 백업 |
| var/imports / var/tools | 임시 수집·실험·로그·미완료 파일·도구 바이너리 제외. 필요한 정규화 원본/증빙과 수집 코드는 config/catalog 및 scripts에 포함 |
| sites의 호스팅 세션 메타데이터 | 제외. 로컬/계정별 세션이며 현재 웹 소스가 아님 |
| 공급자 로그인 세션 / 기존 터널 | 미포함. 새 PC에서는 도구에 별도 로그인/설치 |

## 최초 복원

1. README의 버전으로 npm ci를 수행한다. Windows에서는 npm.cmd를 사용한다.
2. .env가 없는 새 폴더에서만 .env.example을 복사한다. 키 없이 저장된 카탈로그를 실행할 수 있다. API 재수집에는 해당 서비스 키가 필요하다.
3. 서버 실행 전에 npm run db:restore. 기본 var/trip-fit.sqlite를 새로 만들고 기존 파일은 거부한다. 강제 덮어쓰기 옵션은 없다. :memory:를 복원 대상으로 쓰지 않는다.
4. npm run dev 또는 npm run build 후 npm run start. 개발 웹5173/API3001, 산출물 기본3001. 포트/호스트는 루트 .env와 서버 config를 따른다.
5. npm run data:themes:check 및 data:parking:check로 내부 자료를 오프라인 재검증한다. 전체 검사는 AGENTS.md를 따른다. E2E 전 npx playwright install chromium.

## 보존한 DB 상태

schema_migrations2, providers4, places1,044, place_translations1,044, products0, attraction_pages15, attraction_records1,044, attraction_imports12를 백업했다. DB의 products0은 상품이 없다는 의미가 아니다. 현재 제휴 상품은 별도 config/catalog/offers.json의 저장303/공개302개다. 명소 원본/캐시는 미검수 공공 자료이며 검수한 운영 상품으로 바꾸지 않는다.

현재 명소 source-ID 그룹220개, 맛집538개, 테마402개와 다국어 제공량 차이를 유지한다. 언어의 ID를 이름만으로 합치거나 빠진 번역을 만들지 않는다. 코스17개는 내부 원문 대조 결과이며 humanApproval=pending, fieldValidation=not-performed, recommendationEnabled=false를 유지한다.

## 갱신과 후속 작업

공공 원본은 기존 .env 키와 data:refresh / data:food:refresh / data:recommended:refresh / data:parking:refresh를 사용한다. 관광지 공개 발행은 data:publish, 코스용 명소 추출은 data:themes:export-attractions, 코스 생성/검사는 data:themes:build/check다. 원본 수집·추출·빌드를 동시에 실행하지 않는다. [운영 절차](operations.md)의 검토·발행 단계를 생략하지 않는다.

백업은 이 인수인계 시점의 고정 복원본이다. 활동 DB를 변경해도 자동 갱신하지 않는다. 후속 백업을 게시할 때 공공 자료 전용 테이블인지, 비밀키/개인 자료가 없는지 다시 검사한다. manifest만 변경해 검증을 우회하지 않는다. 기존 .env·DB는 현재 PC에 그대로 유지된다.

과거 문서의 임시 미리보기 주소 동작은 보장하지 않는다. clone/ZIP은 배포·도메인·서버·제휴 승인을 자동 복원하지 않는다. 현재 범위와 다음 작업은 [catalog-plan.md](catalog-plan.md), 검증은 [proof.md](proof.md)를 따른다.
