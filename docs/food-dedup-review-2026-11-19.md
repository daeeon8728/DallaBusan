# 2026-11-19 사진 없는 음식점 중복 제외 검수

사용자는 사진 있는 항목과 사진 없는 항목으로 중복 등록된 음식점 중 사진 없는 항목을 삭제하도록 요청했다. 원본 API 스냅샷은 보존하고 공개 목록/검색/상세에서 확인된24개 ID만 제외한다. 단순한 이름 유사도나 사진 없음만으로 삭제하지 않는다.

- 원본 고유 ID538개는 보존한다. 공개514개, 사진 없는 공개 항목23개다. 사진 있는 원본491개는 모두 유지한다.
- 기존 사진 없는47개 중 동일 음식점 근거가 확인된24개만 제외한다. 사진 없는 나머지23개를 일괄 삭제하지 않는다.
- 이름이 같은 무궁화1591(부산진구 가야대로772,051-810-6330)와1230(황령산로8번길5,051-623-5700)은 서로 다른 주소·연락처이므로1591을 유지한다.
- 사진 있는 항목끼리의 중복 가능성은 이번 삭제 대상이 아니다. 원본 ID/좌표/내용을 합치거나 추정 사진을 붙이지 않는다.

## 명시적으로 제외하는 ID

| 사진 없는 제외 ID | 이름 | 사진 있는 유지 ID | 대조 근거 |
| --- | --- | --- | --- |
| 1541 | 기장손칼국수 | 1817 | same-name-phone-address |
| 1544 | 언양불고기부산집 | 950 | alias-same-phone-address |
| 1550 | 부다면옥 | 1534 | same-name-phone-address |
| 1554 | 탐복 | 884 | same-name-phone-address |
| 1557 | 산동완탕교자관 | 1487 | same-name-phone-coordinates-address-conflict |
| 1560 | 쇼진 | 1847 | same-name-phone-address |
| 1561 | 스시시안 | 2340 | same-name-phone-address |
| 1563 | 야키토리해공 | 2362 | same-name-address-coordinates-contact-format-differs |
| 1564 | 제로베이스 | 1835 | same-name-address-coordinates-contact-format-differs |
| 1569 | 음주양식당오스테리아어부 | 1911 | same-address-phone-explicit-relocation |
| 1570 | 이재모피자 | 124 | alias-same-phone-address |
| 1573 | 달타이 | 2328 | same-name-address-coordinates-contact-format-differs |
| 1588 | 르도헤 | 1843 | same-name-address-coordinates-contact-format-differs |
| 1590 | 모리 | 1944 | same-name-address-coordinates-contact-format-differs |
| 1597 | 차오란 | 1946 | same-name-phone-address-coordinate-conflict |
| 1599 | 팔레트 | 2344 | same-name-phone-address |
| 1603 | 구포촌국수 | 872 | same-name-phone-address |
| 1605 | 금용 | 1278 | alias-same-phone-address |
| 1610 | 배종관동래삼계탕 | 1813 | same-name-phone-address |
| 1621 | 원조할매낙지 | 92 | alias-same-phone-address |
| 1629 | 무슈뱅상 | 1831 | same-name-phone-address |
| 1630 | 보느파티쓰 리 | 2354 | same-name-phone-address |
| 1631 | 브레드365 | 1465 | alias-same-phone-address |
| 1638 | 쥬가정효 | 2907 | same-name-phone-address-coordinate-conflict |

## 충돌하는 원문 처리

- 산동완탕교자관1557/1487은 이름·전화·좌표가 일치하지만 도로명 주소가 다르다. 동일 음식점 중복 안내로 사진 없는1557을 제외하며 실제 현재 주소를 새로 판단/교정하지 않는다.
- 오스테리아 어부1569/1911은 주소·국가번호 정규화 후 전화가 일치한다.1911 원문이2026년 해운대 이전을 명시하고 있다. 주소와 좌표가 맞지 않는 원문 문제는 보존하며 이전 좌표를 현 주소의 위치로 보장하지 않는다. 다른 사진 있는1490도 이번 제거 대상이 아니다.
- 모리1590은 같은 도로명/건물 및 가까운 좌표의 사진 항목1944와 연결해 제외한다. 같은 이름이더라도 주소가 다른1844에 단순 병합하지 않는다.
- 야키토리 해공·제로베이스·달타이·르도헤는 같은 이름/공백 정규화·도로명 건물·근접 좌표로 확인했고0507 안내번호와 일반 전화가 다름을 기록했다. 층·호수만 있는 상세 차이를 별도 지점이라고 임의로 만들지 않는다.
- 차오란·쥬가정효는 이름·전화·도로명 건물이 일치하지만 좌표 차이가 있다. 원본 좌표를 자동 교정하거나 현장 검증 완료라고 표시하지 않는다.
- 본점 표기·별칭·한글/영문 상호 차이(이재모피자/본점,금용/금용만두,원조할매낙지/원조할매집,브레드365/bread365)는 해당 ID의 주소·연락처를 명시 대조한 목록만 사용한다. 실행 중 이름 유사도 병합은 없다.

## 구현과 재검수

config/catalog/food-visibility.json은 assistant-source-evidence의 명시적 제외/유지 ID와 근거,5개 언어 원본의 이름/주소/전화/좌표/사진/설명 SHA-256을 기록한다. createFoodVisibility는 원본 종류·사진 상태·중복/없는 ID·self/chain·fingerprint를 확인한다. 제외 ID에 새 사진이 생기거나 근거가 바뀌면 기존 제외를 조용히 유지하지 않고 재검수를 요구한다. 원본 갱신 후 npm run data:localization:check를 실행하고 필요한 검수 목록을 갱신한 다음 재시작한다. 사람/현장 검증을 완료한 자료라는 뜻은 아니다.

공개 목록은 페이지 계산 전에 필터링한다. 상세 API는 제외 ID에404를 반환하며 한국어 fallback으로 되살리지 않는다. 다국어의 사진 있는 항목은 유지하고 추천여행 서비스의 같은 숫자 ID에 적용하지 않는다. 기존 찜에 남은 제외 ID는 저장된 이름과 확인 불가 안내를 보이며 자동 삭제/다른 ID로 조용한 이관을 하지 않는다. 원본 DB·공공 스냅샷·내부 테마 근거와 사진/제휴 링크를 변경하지 않는다.

검증 결과는 [proof.md](proof.md)의 최신 절을 따른다.
