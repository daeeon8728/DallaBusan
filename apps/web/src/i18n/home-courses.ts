import type {Locale} from '@trip-fit/domain';
const copy={
  "en": {
    "title": "Your Busan day starts here.",
    "intro": "Choose a course. See the route. Find tickets for the places you want to visit.",
    "view": "See route & tickets",
    "all": "Explore all courses",
    "search": "Looking for a specific place or ticket?",
    "note": "Course ideas · Book activities separately after checking dates and options.",
    "tickets": "Tickets & experiences along this course",
    "ticketNote": "These products are linked to places on this course. Each is booked separately; this is not a bundled tour.",
    "empty": "Explore each place for public visitor information. Reviewed booking options will appear here when available.",
    "forPlace": "For",
    "mapLanguage": "Basemap labels use English or available Latin names.",
    "mapFailed": "English basemap unavailable. The route and numbered stops remain available."
  },
  "ko": {
    "title": "부산에서 보낼 하루를 골라보세요.",
    "intro": "코스를 고르고, 경로를 확인하고, 가고 싶은 장소의 티켓을 찾아보세요.",
    "view": "경로와 관련 티켓 보기",
    "all": "모든 코스 둘러보기",
    "search": "찾는 관광지나 티켓이 있나요?",
    "note": "편집 코스 제안 · 날짜와 옵션을 확인하고 체험별로 예약하세요.",
    "tickets": "이 코스에서 즐길 티켓·체험",
    "ticketNote": "코스에 포함된 장소와 연결된 상품입니다. 각각 예약하는 상품이며 하나의 패키지 투어가 아닙니다.",
    "empty": "각 장소에서 방문 정보를 확인하세요. 검토된 예약 상품이 있으면 이곳에 표시됩니다.",
    "forPlace": "관련 장소",
    "mapLanguage": "배경 지명은 영어 또는 제공되는 로마자 이름을 사용합니다.",
    "mapFailed": "영문 배경 지도를 불러오지 못했습니다. 경로와 번호별 장소는 계속 볼 수 있습니다."
  },
  "ja": {
    "title": "釜山で過ごす一日を選ぼう。",
    "intro": "コースを選び、ルートを確認して、行きたい場所のチケットを探しましょう。",
    "view": "ルートとチケットを見る",
    "all": "すべてのコースを見る",
    "search": "お探しのスポットやチケットはありますか？",
    "note": "編集コース案・日付と条件を確認し、体験ごとに予約してください。",
    "tickets": "このコースのチケット・体験",
    "ticketNote": "コース内のスポットに関連する商品です。それぞれ別予約で、セットツアーではありません。",
    "empty": "各スポットの訪問情報をご確認ください。確認済みの予約商品がある場合、ここに表示します。",
    "forPlace": "関連スポット",
    "mapLanguage": "背景地図は英語または提供されているラテン文字の地名を表示します。",
    "mapFailed": "英語の背景地図を読み込めません。ルートと番号付きスポットは利用できます。"
  },
  "zh-CN": {
    "title": "从这里开启釜山的一天。",
    "intro": "选择路线，查看行程路径，寻找心仪景点的门票与体验。",
    "view": "查看路线与门票",
    "all": "浏览全部路线",
    "search": "想找特定景点或门票？",
    "note": "编辑路线建议 · 请确认日期与选项，并分别预订各项体验。",
    "tickets": "这条路线的门票与体验",
    "ticketNote": "这些商品与路线中的景点相关，需分别预订，并非组合跟团游。",
    "empty": "请查看各景点的参观信息。核对后的预订商品将在这里显示。",
    "forPlace": "相关景点",
    "mapLanguage": "底图地名使用英语或已有的拉丁字母名称。",
    "mapFailed": "英文底图暂不可用，路线和编号地点仍可查看。"
  },
  "zh-TW": {
    "title": "從這裡開啟釜山的一天。",
    "intro": "選擇路線、查看行程路徑，尋找心儀景點的門票與體驗。",
    "view": "查看路線與門票",
    "all": "瀏覽全部路線",
    "search": "想找特定景點或門票？",
    "note": "編輯路線建議 · 請確認日期與選項，並分別預訂各項體驗。",
    "tickets": "這條路線的門票與體驗",
    "ticketNote": "這些商品與路線中的景點相關，需分別預訂，並非組合跟團遊。",
    "empty": "請查看各景點的參觀資訊。核對後的預訂商品將在這裡顯示。",
    "forPlace": "相關景點",
    "mapLanguage": "底圖地名使用英語或既有的拉丁字母名稱。",
    "mapFailed": "英文底圖暫不可用，路線和編號地點仍可查看。"
  }
};
export const getHomeCourseCopy=(locale:Locale)=>copy[locale];
