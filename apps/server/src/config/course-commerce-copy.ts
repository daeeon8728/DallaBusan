import type {Locale} from '@trip-fit/domain';
const copy={
en:{badge:'Tour option',persuasion:'Let a guided tour handle the connections to this stop. Compare its transport and admission options before choosing.',cta:'See a tour visiting this stop'},
ko:{badge:'투어 선택지',persuasion:'이 장소까지 이동을 맡길 수 있는 투어를 비교하세요. 교통과 입장권 포함 옵션을 확인한 뒤 고르세요.',cta:'이 장소를 방문하는 투어 확인'},
ja:{badge:'ツアーの選択肢',persuasion:'このスポットを訪ねるツアーで移動の手間を減らしましょう。交通と入場券の条件を比較してお選びください。',cta:'このスポットを訪ねるツアーを見る'},
'zh-CN':{badge:'跟团游选项',persuasion:'选择前往此景点的导览行程，省去安排接驳的麻烦。请比较交通与门票的包含条件。',cta:'查看游览此景点的行程'},
'zh-TW':{badge:'跟團遊選項',persuasion:'選擇前往此景點的導覽行程，省去安排接駁的麻煩。請比較交通與門票的包含條件。',cta:'查看遊覽此景點的行程'},
} satisfies Record<Locale,{badge:string;persuasion:string;cta:string}>;
export const getCourseCommerceCopy=(locale:Locale)=>copy[locale];
