import type {Locale,PublicOffer} from '@trip-fit/domain';
const NAMES={ko:'한국어',en:'English',ja:'日本語','zh-CN':'简体中文','zh-TW':'繁體中文'} satisfies Record<Locale,string>;
const LABELS={ko:'예약 페이지 언어',en:'Booking page language',ja:'予約ページの言語','zh-CN':'预订页面语言','zh-TW':'預訂頁面語言'} satisfies Record<Locale,string>;
export function BookingLanguage({offer,locale}:{offer:PublicOffer;locale:Locale}){return offer.bookingLocale&&offer.bookingLocale!==locale?<p className="booking-language" data-testid="booking-language">{LABELS[locale]}: <span lang={offer.bookingLocale}>{NAMES[offer.bookingLocale]}</span></p>:null;}
