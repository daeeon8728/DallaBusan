# Cloudflare Workers 배포

2026-11-26 첨부 로그의 빌드는 성공했고, 루트에서 실행한 `npx wrangler deploy`의 workspace 앱 자동 탐지 단계가 실패했다. Zod 주석·청크 크기·deprecated 경고가 실패 원인은 아니다.

루트 `wrangler.jsonc`에서 Worker 진입점과 정적 산출물 경로를 명시한다. Wrangler 4.168.0을 root devDependency와 lockfile에 고정해 임의 최신 버전 자동 설치를 피한다.

## Cloudflare 설정에 입력할 값

| 설정 | 값 |
| --- | --- |
| 프로젝트 루트 / Root directory | 저장소 루트 `/` |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |
| Worker name | `dallabusan` (`wrangler.jsonc`와 실제 Worker 이름이 같아야 함) |
| 정적 파일 | `apps/web/dist` — Wrangler가 업로드하므로 UI에서 루트 폴더를 자산으로 선택하지 않음 |

이미 입력한 `npm run build`와 `npx wrangler deploy`도 루트 설정이 생기면 동작한다. 위 전용 명령을 권장한다. 웹 앱 폴더로 임의 이동하거나 `apps/server/dist`를 Worker 엔트리로 지정하지 않는다.

## 실제 배포 구조

```text
브라우저 → Cloudflare Worker
             ├─ 공개 페이지·정적 파일: apps/web/dist
             ├─ /api/**: API_ORIGIN의 기존 Node API로 전달
             └─ /api/admin/**: 503, 관리자 쓰기 비활성
```

현재 `API_ORIGIN=https://dallabusan.vercel.app`이며 `/api` 접두사와 언어·검색 파라미터를 보존한다. API 응답은 캐시하지 않는다. 정적 페이지만 배포해 상품/코스가 사라지는 상황을 피한다. 브라우저의 인증/쿠키/임의 포워딩 헤더와 업스트림 Set-Cookie는 전달하지 않는다. 공개 숙소 조건 검색 POST만 최대 2048바이트로 허용하고 다른 쓰기는 차단한다. 업스트림 장애는 명시적502로 표시하고 프런트의 기존 재시도를 유지한다.

**Fastify·SQLite 서버 전체를 Workers로 이전한 것은 아니다.** 기존 검수 DB와 관리자 영구 SQLite는 Node/AWS 서버에서 유지한다. Workers의 임시 저장소에 관리자 내용을 게시하지 않는다. 향후 AWS API를 쓰려면 `API_ORIGIN`을 해당 HTTPS Origin으로 바꾼다. 경로·계정정보·쿼리가 포함된 값이나 Cloudflare 자기 자신을 지정하면 안 된다. 기존 백엔드는 계속 운영해야 한다. 백엔드를 Cloudflare에서 독립 운영하려면 별도 D1/서버 계약 이전 작업이 필요하다.

## Google 지도 키

Cloudflare Worker의 **Settings → Variables and Secrets**에 `GOOGLE_MAPS_EMBED_API_KEY`를 입력하면 `/api/map-links`의 검증된 장소 검색 좌표로 Google Embed URL을 생성한다. 발급된 브라우저 제한 키만 사용한다. 키가 없으면 업스트림의 기존 지도 설정을 유지한다.

이는 브라우저 iframe에 사용되는 공개 제한 키이며 서버 관광 API 키·관리자 비밀번호를 넣는 항목이 아니다. Google Cloud의 Website referrer 제한에 실제 `workers.dev` 주소 또는 연결한 도메인을 추가해야 한다. Maps Embed API 제한도 유지한다. Cloudflare 설정 화면의 빌드 변수만이 아니라 **Worker 런타임 바인딩**에 반영해야 한다. 로컬 `.env`를 Git에 넣거나 Vite `VITE_` 변수로 옮기지 않는다.

사이트 URL이 바뀌어도 제휴사 신규 사이트 승인을 받은 것으로 해석하지 않는다. 기존 상품 링크 검수·공개 자격은 Node API의 동일 계약을 사용한다.

## 로컬 검증

```sh
npm ci
npm run build:cloudflare
npm run check:cloudflare
```

`check:cloudflare`는 실제 업로드 없이 배포 패키지를 생성한다. `.wrangler/`·`var/cloudflare-build/`·`.dev.vars*`는 Git 제외다.

PowerShell에서 비밀 없이 실제 Workers 로컬 런타임 확인:

```powershell
$env:CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV='false'
npm.cmd run dev:cloudflare
```

`http://127.0.0.1:4319/`, `/courses/fa01?locale=en`, `/build-your-day`, `/api/offers?locale=en`을 확인한다. 로컬 Workers 실행은 클라우드 배포 성공과 다르다. 실제 배포 후 공개 주소에서 페이지뿐 아니라 상품·코스 API와 Google 키 반영 상태를 확인해야 한다.

## 근거

- [Workers 정적 자산 바인딩·worker 우선 라우팅](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Wrangler 명시 설정](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [로컬 환경 변수 로딩 제어](https://developers.cloudflare.com/workers/wrangler/environments/)
