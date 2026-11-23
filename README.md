# dallaBusan (Trip Fit)

부산 관광지·맛집·테마여행 안내와 티켓·투어·체험·숙소 제휴 상품을 제공하는 React/TypeScript 사이트입니다. 예약과 결제는 외부 판매처에서 진행합니다. AI·예산·자동 일정·로그인 기능은 현재 범위에 없습니다.

## 내려받은 폴더에서 작업 이어가기

Node.js **24.14.1**, npm **11.11.0**을 설치합니다. 버전 범위는 package.json, 정확한 의존성은 package-lock.json에 고정돼 있습니다. Git clone 또는 GitHub의 Download ZIP을 풀고 프로젝트 루트에서 실행합니다.

~~~powershell
git clone https://github.com/daeeon8728/DallaBusan.git
cd DallaBusan
npm.cmd ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
npm.cmd run db:restore
npm.cmd run dev
~~~

개발 웹: [localhost:5173](http://127.0.0.1:5173), 서버: [localhost:3001](http://127.0.0.1:3001). macOS/Linux에서는 npm.cmd 대신 npm을 사용하고 .env.example을 .env로 복사합니다. ZIP으로 받은 경우 git clone/cd 단계만 생략합니다.

**기존 작업 폴더에서는 db:restore를 다시 실행하지 마세요.** 기존 DB가 있으면 이 명령은 덮어쓰지 않고 실패합니다. 새 폴더에서는 저장된 공공 자료를 API 호출 없이 복원합니다. API 키가 없어도 저장된 상품·관광지·맛집·테마여행을 표시할 수 있습니다.

.env의 실제 비밀 값은 GitHub에 포함하지 않습니다. 현재 PC와 동일한 공공 API 갱신 권한이 필요하면 기존 .env를 새 작업 폴더로 **개인적으로 복사**하거나 .env.example의 해당 항목에 발급 키를 입력하세요. 기존 파일을 덮어쓰지 말고 비교해 필요한 값을 옮깁니다. 키를 GitHub 이슈·커밋·브라우저 코드에 넣지 마세요. AI/OAuth/제휴 API의 자리표시자 설정은 구현 완료를 뜻하지 않습니다.

## 현재 포함된 기능과 자료

- 저장 상품303개 중 공개302개. 중립 provider 설정, 실제 발급 제휴 링크, 상품 이미지 근거·사진 권리·번역 데이터를 포함합니다. 전체 OTA 재고 수를 뜻하지 않습니다.
- 관광정보220개 원본 ID 그룹 / 1,044언어 레코드. 관광지 검색·상세·명시적으로 검수된 상품 관계를 제공합니다.
- 맛집2,127언어 레코드와 테마여행1,191언어 레코드. /food, /recommended의 목록·상세에서 공공 소개·운영시간 등 원문을 제공합니다. 실시간 영업 상태가 아닙니다.
- 한국어·영어·일본어·중국어 간체/번체 UI. 상품 제목의4개 외국어 편집 번역과 누락 시 원문 대체를 구분합니다.
- 공영주차장615건의 원본·정규화·품질 자료와 수동 갱신 CLI. 주차 화면·공개 주차 API는 없습니다.
- 선별 테마 코스17개와 관광지/맛집 명시 매핑44개, 방문 순서 근거·coverage. 내부 검수용이고 새 페이지/API가 없습니다. 사람 승인·현장 검증은 대기이며 추천은 비활성입니다.

## 실행 및 검증

~~~powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test -- --run
npm.cmd run check:providers
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run start
~~~

start는 빌드한 웹/API를 기본3001에서 제공합니다. 실행 전에 build가 필요합니다. E2E는4317의 별도 서버와 메모리 DB, 외부 요청 대역을 사용합니다. 테스트 브라우저 설치는 최초1회만 필요합니다. 외부 지역/다른 네트워크에 공개하는 호스팅·터널은 별도이며 저장소 업로드만으로 서버가 열리지는 않습니다.

## 데이터 복원과 갱신

config/catalog에는 공개 카탈로그와 내부 검토 자료가 있습니다. data/snapshots/trip-fit.sqlite와 manifest.json은 기존 공공 관광 DB를 보존한 복원용 백업입니다. SHA-256·테이블·행 수·SQLite 무결성을 확인한 뒤 db:restore가 새 DB를 만듭니다. 실제 작업 DB는 기본 var/trip-fit.sqlite이며 Git에 올리지 않습니다.

~~~powershell
npm.cmd run data:themes:check
npm.cmd run data:parking:check
~~~

위 검사는 외부 API/키 없이 로컬 결과를 검증합니다. 공공 API를 새로 수집하려면 .env 키가 필요합니다. 원본 갱신이 검토 승인까지 자동 갱신하지는 않습니다. 명령과 순서는 [운영 절차](docs/operations.md), [인수인계](docs/handoff.md)를 따릅니다.

작업 전에 [AGENTS.md](AGENTS.md) → [intent.md](docs/intent.md) → [spec.md](docs/spec.md) → [plan.md](docs/plan.md), [최신 카탈로그 계획](docs/catalog-plan.md)을 읽으세요. [proof.md](docs/proof.md)에 검증 이력과 미확인 범위, [코스 검수](docs/theme-route-review-2026-11-14.md)에 보류 근거가 있습니다. 신규 사이트 채널 승인·상시 호스팅·실시간 가격/재고·사람의 코스 승인은 완료된 것으로 표시하지 않습니다.

## 2026-11-18 찜하기·주차 정보

관광지·맛집·상품의 하트로 로그인 없이 저장하고 상단 찜한 곳(/saved)에서 다시 봅니다. 같은 브라우저/사이트 주소에서 새로고침 후 유지되며 기기·브라우저 데이터 삭제·시크릿 모드에 따라 사라질 수 있습니다. 현재 공개 데이터와 언어를 다시 조회하므로 예약 URL/가격을 찜에 캐시하지 않습니다.

기존 관광지 검색(/search)의 부산 주차 정보 펼침 영역에서 유료/무료·공영/민영을 검색하고 관광지·맛집 상세에서 주변 주차장을 확인합니다. 최신 공개 표준자료653행 중641건을 게시했고12행은 중복 식별자로 보류했습니다. 명소명·별칭 검색은 대표 좌표1km 이내 주차장도 포함하며 실제 보행거리·입구·빈자리를 뜻하지 않습니다. 부산 전체 시설을 빠짐없이 확보한 자료는 아닙니다. 키 없는 갱신: npm run data:parking-directory:refresh, 오프라인 검증: npm run data:parking-directory:check. [수집 범위](docs/parking-directory-2026-11-18.md)를 참고하세요.

## 상품 장바구니

각 상품의 장바구니 담기로 추가하고 언어 선택창 옆 버튼(/cart)에서 수량·삭제·합계를 확인합니다. 로그인 없이 같은 브라우저에 보관하며 가격·예약 URL은 저장하지 않고 서버에서 다시 확인합니다. 합계는 등록된 참고가×선택 수량이며 원화/달러 등 통화별로 나눕니다. 실시간 최저가·최종 결제금액이 아니고 미확인 가격/상품은 합계에서 제외됩니다.


### 언어별 상품 가격 표시 (2026-11-19)

한국어 KRW / 영어 USD / 일본어 JPY / 중국어 간체 CNY / 번체 TWD로 표시한다. 서버 /api/exchange-rates가 keyless Frankfurter v2 기준 환율을 캐시하며 .env에 새 키를 추가할 필요가 없다. 원가격과 가격 관찰일은 보존하고 환율 제공일·출처·환산 참고가임을 안내한다. 환율 실패 시 원통화로 복구하며 장바구니도 서로 다른 원통화를 임의로 더하지 않는다. 환전·실시간 최소가·결제 기능은 아니다. 검증/제한은 docs/proof.md, 정책은 docs/operations.md 최신 절을 따른다.


### 음식점 중복 공개 제외 (2026-11-19)

사진 없는 중복24건을 명시 검수해 공개 음식점은5개 언어 모두514개다. 원본538개는 보존하며 사진 있는491개/독립된 사진 없는23개를 유지한다. 원본 갱신 시 food-visibility.json의 원문 fingerprint를 재검수하고 npm run data:localization:check를 실행한다. 세부24쌍은 docs/food-dedup-review-2026-11-19.md를 따른다.


### 제휴 노출 정책 (2026-11-23)

설정 기반 우선순위와 메인 대표 묶음,증빙이 필요한 한국어 예약 조건을 적용한다. 현재117개 공개 링크/메인113개,미검증185개는 비공개다. 세부 출처·원본 보존·조건부 배지는 docs/affiliate-presentation-review-2026-11-23.md를 따른다.

KKday285개 추가의 출처/보류/다국어 예약 링크는 [신규 카탈로그 검수](docs/provider-e-catalog-review-2026-11-23.md)를 참고하세요.

## Vercel 다중 서비스 배포 준비

루트 vercel.json에서 web과 server를 정의한다. 현재 구성은 사용자 최종 확인 대기이며,세부 공개 경로·바인딩0개 근거·읽기 전용 공공 DB·Windows 로컬 CLI 한계는 [배포 검토](docs/vercel-deployment-2026-11-24.md)를 따른다. 로컬 vercel dev 서버를 외부 공개하지 않으며,실제 배포/패키징 검증 완료로 해석하지 않는다.
