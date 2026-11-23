# Vercel Services 구성 검토 — 2026-11-24

상태: 코드/로컬 검증 완료. 사용자가 최종 구성 제시 후 push를 승인하여 GitHub 반영을 진행한다. Vercel 클라우드 배포/프로젝트 연결/환경변수 업로드와 Preview 검증은 아직 수행하지 않았다.

## 최종 구성

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "web": {
      "root": "apps/web",
      "framework": "vite",
      "buildCommand": "cd ../.. && npm run build --workspace @trip-fit/domain && npm run build --workspace @trip-fit/web",
      "outputDirectory": "dist",
      "rewrites": [
        {
          "source": "/",
          "destination": "/index.html"
        },
        {
          "source": "/search",
          "destination": "/index.html"
        },
        {
          "source": "/saved",
          "destination": "/index.html"
        },
        {
          "source": "/cart",
          "destination": "/index.html"
        },
        {
          "source": "/food/:path*",
          "destination": "/index.html"
        },
        {
          "source": "/recommended/:path*",
          "destination": "/index.html"
        },
        {
          "source": "/places/:path*",
          "destination": "/index.html"
        }
      ]
    },
    "server": {
      "root": "apps/server",
      "framework": "fastify",
      "entrypoint": "src/app.ts",
      "buildCommand": "cd ../.. && npm run build --workspace @trip-fit/domain && npm run build --workspace @trip-fit/server",
      "functions": {
        "src/app.ts": {
          "includeFiles": "{../../config/catalog/**,../../data/snapshots/**}"
        }
      },
      "runtime": "nodejs24.x"
    }
  },
  "rewrites": [
    {
      "source": "/api",
      "destination": {
        "service": "server"
      }
    },
    {
      "source": "/api/(.*)",
      "destination": {
        "service": "server"
      }
    },
    {
      "source": "/(.*)",
      "destination": {
        "service": "web"
      }
    }
  ]
}
```

| 서비스 | 루트·역할 | 공개 범위 | 내부 호출/바인딩 |
| --- | --- | --- | --- |
| web | apps/web · 정적 Vite/React | / 및 화면·정적 자산 | 없음 |
| server | apps/server · Node24 Fastify HTTP 함수 | /api 및 /api/** | 없음 |

루트 package.json에서 잘못 추론된 app 서비스는 만들지 않는다. API 규칙을 먼저,나머지 web 규칙을 마지막에 둔다. /api 접두사는 제거하지 않으며 원래 /api/health,/api/offers 등의 경로를 유지한다. web 안에서는 현재 화면 경로만 index.html로 돌려 /food/70,/places/gamcheon 등의 직접 진입/새로고침을 지원한다. 빌드/런타임 설정은 각 서비스 안에만 둔다.

현재 브라우저 React 코드가 같은 도메인의 /api를 직접 호출한다. 정적 web 서비스 안에는 server를 호출하는 서버 함수가 없으며,server의 HTTP 요청은 외부 공공 제공처/환율 등에 한정된다. 따라서 내부 서비스 호출과 바인딩은 **0개**다. 함수 런타임에만 제공되는 바인딩을 Vite 빌드 변수나 VITE_*로 노출하지 않았다. 앱을 BFF/SSR로 바꿔 API를 완전히 내부로 만들려면 별도 설계 확인이 필요하다.

Vite의127.0.0.1:3001 프록시는 기존 npm run dev 전용이며 Vercel에서는 최상위 /api rewrite가 API 서비스로 바로 보낸다. server의 localhost 문자열은 URL 경로 파싱용 기준 주소이며 HTTP 서비스 호출이 아니다. 내부 서비스 URL을 수동 환경변수로 만들지 않았다.

## 실행 코드 변경

- app-factory.ts는 기존 buildApp/라우트 조립을 보존한다. app.ts는 호환 named export와 실제 요청 때만 앱을 초기화하는 HTTP 함수이며 app.ready 이후 요청을 전달한다.
- runtime.ts는 공통 조립, index.ts는 기존 로컬 listen/종료 처리를 맡는다. Vercel 함수는 포트를 별도로 열지 않고 기존 요청/응답 객체를 전달한다.
- 함수는 시스템 환경 변수 설정 여부와 무관하게 readOnlySnapshot:true를 전달한다. data/snapshots/trip-fit.sqlite를 읽기 전용으로 열며 mkdir/migrate/쓰기/복원을 하지 않는다. 일반 로컬·수집 CLI의 DATABASE_PATH와 db:restore 규칙은 유지한다.
- 읽기 전용 스냅샷이 없거나 잘못되면 실패하고 빈 DB나 임의 자료를 만들지 않는다. 공개 카탈로그 JSON과 공공 DB 스냅샷은 API 함수에만 includeFiles로 포함한다. 웹 dist 산출물8개에는 설정·DB·.env가 없다.
- .vercel/과 var/tools/는 Git 제외다. 기존 .env/의존성/lockfile 내용과 공공 DB·사진·상품·번역·테마 자료는 변경하지 않았다.

## 실행과 검증

일반 개발/배포 빌드는 기존 npm ci,npm run dev,npm run build,npm run start를 유지한다. Services 로컬 검사는 저장소 루트에서 vercel dev --local --listen 4318을 사용한다. --local은 계정 연결이나 클라우드 환경변수 읽기 없이 검사한다.

이 Windows에서는 CLI66.6.0 네이티브 설치기의 VLT 의존성 심볼릭 링크가 EPERM으로 실패했다. OS 설정은 바꾸지 않았다. 기존64.2.0 JS로 진입점을 진단한 뒤,Git 제외 var/tools/vercel-cli에 공식 @vercel/cli-support@66.6.0 JS만 테스트용으로 설치해 최신 CLI를 실제 실행했다. 이 지원 패키지는 Windows 기본 배포 대상이 아니므로 테스트 설치에만 플랫폼 제한을 해제했으며 프로젝트 의존성에는 추가하지 않았다.

최신 CLI에서 web/server 감지,API 응답,영어 첫 화면과 맛집5언어 직접 진입을 확인했다. 외부 사진/예약은 대역이다. node:sqlite readOnly 쓰기 거부/원본 SHA 불변,빌드된 HTTP 함수 API200/비공개 경로404를 별도로 검증했다. 전체 검사는 docs/proof.md와 var/imports/vercel-20261123/ 로그를 따른다.

### 로컬 CLI의 파일 서빙 한계

vercel dev --local은 이 저장소에서 config/catalog·data/snapshots·docs의 실제 파일을 직접 정적 응답200으로 제공했다. 단순 경로 rewrite나 Vite fs 제한만으로 이 CLI 동작을 차단했다고 주장하지 않는다. 검사 서버는 외부 터널에 연결하지 않고 작업 후 종료한다. 이 동작을 클라우드에서 재현 확인한 것은 아니다.

실제 웹 빌드에는 이 파일들이 없고,API 함수 자체도 비공개 파일 요청에404다. 다만 아직 Vercel 클라우드 빌드/패키징·라우팅을 검증하지 않았으므로,사용자 구성 확인 후 Preview에서 동일 비공개 경로가 노출되지 않는지 확인한 다음 실제 공개를 판단한다. 개발 CLI의 원본 파일 응답을 운영 배포의 검증 성공으로 보고하지 않는다.

## 확인받을 항목

1. 서비스 이름을 web/server 두 개로 유지하고 루트 app 추론을 제외할지.
2. web을 /에,server를 /api와 /api/**에 공개하고 내부 전용 서비스를 두지 않을지.
3. 서버 간 호출이 없으므로 바인딩0개로 확정할지. 정적 브라우저 요청을 내부 바인딩 요청이라고 표시하지 않을지.

최종 구성 제시 후 사용자 push 승인을 받았다. 클라우드 배포 결과는 별도 검증한다. Vercel 프로젝트 Root Directory는 저장소 루트,서비스 구성은 이 파일을 기준으로 검토한다. 초기 저장 데이터 표시는 새 API 키 없이 가능하며,공공자료 갱신 키 등 실제 필요한 비밀 값은 추후 Vercel 서버 환경변수로만 설정한다. root .env를 Git/프런트에 올리지 않는다.

근거: [Services](https://vercel.com/docs/services),[서비스 설정](https://vercel.com/docs/services/config-reference),[라우팅](https://vercel.com/docs/services/routing),[바인딩](https://vercel.com/docs/services/bindings),[Fastify](https://vercel.com/docs/frameworks/backend/fastify).
