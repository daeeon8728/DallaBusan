# AdSense 수동 광고 연결 기록 (2026-11-24)

## 확인된 계정·범위

사용자가 열어둔 로그인 AdSense 화면에서 dallabusan.vercel.app의 기존 등록을 확인했다. 지급 정보 화면/정산 계좌/비밀번호/계정 권한은 변경하지 않았다. 애널리틱스/GTM과 광고 수익용 AdSense는 별도이며 기존 GTM 코드는 보존한다.

- Google 발급 공개 publisher ID: `ca-pub-9707649247569634`.
- 수동 광고 단위: `DallaBusan - Detail Bottom - Responsive`, slot `7687721544`, 디스플레이/반응형.
- 계정에서 발급한 ads.txt: `google.com, pub-9707649247569634, DIRECT, f08c47fec0942fa0`.
- publisher/slot은 공개 HTML에 쓰이는 식별자이며 비밀 API 키가 아니다. .env/키 재발급은 필요하지 않다.
- 계정 UI에서 자동 광고와 자동 최적화를 모두 **사용 안 함**으로 저장하고 목록으로 재확인했다. 전면·앵커·좌우 자동 광고/광고 링크 자동 삽입을 활성화하지 않는다.
- 사이트는 처음 확인 시 **검토 필요**, 소유권 연결 미완료였다. 승인/실제 광고 노출 여부는 아래 검증 기록과 proof.md의 최신 결과를 따른다.

## 사이트 구현

- `apps/web/index.html`: 공식 `google-adsense-account` 메타 태그1개. 공통 React HTML로 모든 페이지의 소유권 확인을 지원한다. 광고 JS를 head에 실행하지 않는다.
- `apps/web/public/ads.txt`: 계정에서 발급한 seller 행. 기존 파일이 있을 경우 기존 내용을 보존해 추가하는 원칙을 유지한다.
- `apps/web/src/config/advertising.ts`: 발급 공개 식별자와 실행 플래그만 관리한다. 계정 전체·키·정산 정보는 포함하지 않는다.
- `advertising/policy.ts`: 명시적 enabled AND 실제 사이트 Ready AND 동의/CMP 검토 Ready가 모두 충족돼야 광고 실행. 고정 script URL·publisher/slot 형식도 확인한다.
- `advertising/DetailAdvertisement.tsx`: 관광지·맛집·코스 상세의 마지막 콘텐츠 아래에 반응형 수동 광고1개를 연결한다. 홈/상품 목록/추천여행/찜/장바구니/404에는 연결하지 않는다. 지도/예약/조작 버튼 위에 겹치지 않으며 본문 폭·메뉴·사진 배치를 줄이지 않는다.
- 현재 `enabled=false`, 승인/동의 검토 미완료다. 따라서 빈 광고 칸이나 광고 JS/요청이 생성되지 않는다. 이 상태는 실제 광고 게재 완료가 아니다.
- 추후 활성화 시 화면 근처에 들어온 양수 폭 슬롯만 요청하고, 공통 광고 script는1회 로딩한다. 취소된 SPA 상세는 요청하지 않으며 페이지별 ins1개/수동 타이머 새로고침 없음/오류·광고 없음 처리/5개 언어 광고 라벨을 제공한다.

## 완료 순서와 남은 확인

1. 메타 태그/ads.txt 정적 파일을 빌드·배포하고 공개 주소의 상태/내용을 확인한다.
2. AdSense의 기존 사이트에서 실제 게시된 확인 방법으로 소유권을 확인하고, 화면의 비계약 검토 요청 절차를 수행한다. 새 약관/계약/개인정보 선택이 나타나면 임의로 동의하지 않는다.
3. Google 심사 결과 Ready를 실제 확인한다. 요청 접수/소유권 확인/광고 단위 생성만으로 승인 완료라고 쓰지 않는다.
4. 운영자가 개인정보 안내와 Google 인증 CMP/방문자 선택을 검토한다. 계정의 개인정보 관련 설정을 도구로 임의 선택하지 않는다. 유럽/영국/스위스 개인 맞춤 광고의 CMP 요구사항은 Google 공식 안내를 따른다. 직접 만든 체크박스를 인증 CMP라고 주장하지 않는다.
5. 위 결과를 확인하고 실행 게이트를 바꿀 때 광고 loader/1슬롯/실패/SPA 이동을 대역 E2E로 추가 검증한다. 실제 광고의 반복 로딩/클릭으로 검사하거나 수익을 만들지 않는다.
6. 광고 수익과 제휴 확정 수익/외부 예약 클릭을 비교한다. 관광 관련 광고만 노출된다는 보장은 하지 않는다. 광고 카테고리 차단에는 한계가 있다.

## 검증 범위

- 단위: 현재 차단/승인·동의·enabled 각각 차단/잘못된 식별자와 script host 차단.
- 브라우저: 공개 ads.txt 내용·text/plain,메타 태그1개,홈/관광지/맛집/코스/찜/장바구니에서 광고 script·요청·빈 슬롯0 및 기존 너비/메뉴 유지.
- 원래 공개 검색/추천여행/코스·팝업/지도 회귀를 포함한다. 실행 명령·결과·실패 수정은 docs/proof.md 참조.
- 현재 허용된 실행 상태는 **비활성화**다. 실제 광고 입찰/광고 표시/광고 수익·활성화 후 CMP 연동을 확인한 것으로 쓰지 않는다.

## 공식 근거

- [사이트 소유권 확인 및 심사](https://support.google.com/adsense/answer/12131223?hl=en)
- [ads.txt 만들기](https://support.google.com/adsense/answer/7532444?hl=ko)
- [ads.txt 반영 지연](https://support.google.com/adsense/answer/12171244?hl=en)
- [광고 코드 구현](https://support.google.com/adsense/answer/9187252?hl=ko)
- [광고 배치 정책](https://support.google.com/adsense/answer/1346295?hl=en)
- [CMP 요구사항 안내](https://support.google.com/adsense/answer/11546682?hl=en)

## 공개 배포·Google 확인 결과

구현 커밋51c9f7a를 DallaBusan main으로 push했다. https://dallabusan.vercel.app/ 의 공식 계정 메타1개와 https://dallabusan.vercel.app/ads.txt 의200/text/plain/정확한 seller행을 실제 HTTP로 확인했다. 전역 광고 JS는0이다. 첫 배포 대기40초 동안은 이전 응답이었으며 이후 정상 반영됐다.

로그인 AdSense에서 메타 태그 확인을 실행해 **사이트가 확인되었습니다**를 확인했다. 이어 기존 사이트의 비계약 검토 요청 버튼을 눌렀고 **준비 중 / 사이트의 광고 게재 가능 여부 검토 중 / 리뷰가 요청됨**을 확인했다. Google 화면은 보통 며칠, 경우에 따라2~4주를 안내한다. 이는 승인 완료가 아니다. 처음 목록의 ads.txt 찾을 수 없음 표시가 Google 재수집으로 해제됐다고 주장하지 않는다. 공개 파일은 이미200이며 별도 수집 지연이 가능하다.

config의 승인 상태는 getting-ready로 기록하며 enabled=false/동의 검토 pending을 유지한다. 실광고 활성화와 CMP·개인정보 안내의 운영자 검토는 후속이며 Ready가 오기 전에 자동 활성화하지 않는다. 지급·계약/개인정보 설정은 변경하지 않았다.
