# Google Analytics 연결

2026-11-24 사용자 화면에서 기존 dallaBusan 웹 스트림을 확인했다.
- URL: https://dallabusan.vercel.app
- GA4 측정 ID: G-2G1XYHDY7Y (공개 브라우저 측정 식별자, API 비밀키 아님)
- GTM 컨테이너: GTM-5FJR79NS
- 사이트의 apps/web/index.html head에 사용자 제공 최신 Google 공식 설치 코드 한 번만 둔다. React의 모든 경로는 같은 문서를 사용한다.
- 별도 GA4 gtag.js 로더/config를 중복 설치하지 않는다. 측정은 GTM 안의 단일 Google Analytics 태그와 Initialization - All Pages를 사용한다.
- 기존 GA4 스트림의 향상된 측정은 켜져 있었다. 일반 방문/자동 이벤트와 이메일 등 사용자 제공 데이터 수집은 구분한다.
- 자동 생성된 사용자 제공 데이터 허용/자동 감지는 사용자에게 직접 확인·해제를 요청했다. 계정 링크 추가 안함을 선택하여 추가 읽기 권한을 부여하지 않는다.
- GA4 계정/스트림/API 비밀번호를 새로 만들지 않는다. 외부 제휴사 등록/결제/비밀키 변경도 없다.
- E2E는 GTM JavaScript를 대역 처리하여 실제 Analytics에 반복 테스트 방문을 보내지 않는다. 실제 배포의 단발 검증은 별도로 기록한다.

공식 설치 안내: https://support.google.com/tagmanager/answer/14847097
공식 Google 태그 연결: https://support.google.com/tagmanager/answer/14842872
완료 여부와 실제 HTTP/측정 결과는 아래 후속 검증 기록을 따른다.

초기 로컬 검증: web workspace build 종료0. 원본/빌드 HTML의 GTM 로더1개와 dataLayer 초기화1회,직접 GA4 config 중복0을 실행 검사했다. 코스·팝업 소스는 이 정적 태그 커밋에 포함하지 않는다.
