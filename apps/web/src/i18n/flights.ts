import type {Locale} from '@trip-fit/domain';
const copy={
  "en": {
    "title": "Flights to Busan",
    "intro": "Choose your departure city, travel dates and passengers in the partner search. Busan is preselected as the destination.",
    "dates": "Preset dates are examples. Set your own travel dates and confirm airports, currency, baggage and fare rules before booking. Booking and payment take place on the partner site.",
    "link": "Find flights to Busan",
    "open": "Open flight search"
  },
  "ko": {
    "title": "부산행 항공권",
    "intro": "판매처 검색창에서 출발 도시·여행 날짜·인원을 선택하세요. 도착지는 부산으로 미리 선택되어 있습니다.",
    "dates": "기본 날짜는 예시입니다. 여행 날짜를 직접 설정하고 공항·통화·수하물·운임 규정을 확인하세요. 예약과 결제는 판매처에서 진행합니다.",
    "link": "부산행 항공권 찾기",
    "open": "항공권 검색 열기"
  },
  "ja": {
    "title": "釜山行きの航空券",
    "intro": "提携先の検索で出発地・旅行日・人数を選んでください。到着地は釜山に設定されています。",
    "dates": "初期の日付は例です。旅行日を設定し、空港・通貨・手荷物・運賃条件を確認してください。予約と支払いは提携先で行います。",
    "link": "釜山行きの航空券を探す",
    "open": "航空券検索を開く"
  },
  "zh-CN": {
    "title": "飞往釜山的机票",
    "intro": "在合作平台搜索中选择出发城市、旅行日期和人数。目的地已预设为釜山。",
    "dates": "预设日期仅为示例。请设置自己的旅行日期，并确认机场、货币、行李与票价规则。预订和付款均在合作平台进行。",
    "link": "查找飞往釜山的机票",
    "open": "打开机票搜索"
  },
  "zh-TW": {
    "title": "飛往釜山的機票",
    "intro": "在合作平台搜尋中選擇出發城市、旅行日期和人數。目的地已預設為釜山。",
    "dates": "預設日期僅為範例。請設定自己的旅行日期，並確認機場、幣別、行李與票價規則。預訂和付款均在合作平台進行。",
    "link": "尋找飛往釜山的機票",
    "open": "開啟機票搜尋"
  }
};
export const getFlightCopy=(locale:Locale)=>copy[locale];
