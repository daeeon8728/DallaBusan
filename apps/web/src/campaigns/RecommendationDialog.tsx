import { useEffect, useRef, useState } from 'react';
import { CoursesResponseSchema, CourseCategorySchema, type Locale } from '@trip-fit/domain';
import { useGuideRequest } from '../hooks/useGuideRequest.js';
import { getCourseCopy } from '../i18n/courses.js';
import { canShowPopup, dismissPopup, POPUP_DAY_KEY, localDay } from './popupStorage.js';
const dayStorage = { getItem: (key: string) => window.localStorage.getItem(key), setItem: (key: string, value: string) => window.localStorage.setItem(key, value) };
const visitStorage = { getItem: (key: string) => window.sessionStorage.getItem(key), setItem: (key: string, value: string) => window.sessionStorage.setItem(key, value) };
export function RecommendationDialog({ locale, eligible, onNavigate }: {
    locale: Locale;
    eligible: boolean;
    onNavigate: (path: string) => void;
}) {
    const c = getCourseCopy(locale);
    const dialog = useRef<HTMLDialogElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const [dismissed, setDismissed] = useState(() => { try {
        return !canShowPopup(new Date(), dayStorage, visitStorage);
    }
    catch {
        return false;
    } });
    const [notice, setNotice] = useState('');
    const request = useGuideRequest('/api/courses?locale=' + locale, CoursesResponseSchema);
    const show = eligible && !dismissed && Boolean(request.value?.total) && !request.error;
    function dismiss(today: boolean) { let saved = false; try {
        saved = dismissPopup(today, new Date(), dayStorage, visitStorage);
    }
    catch { /* The native close button must always work. */ } if (today && !saved)
        setNotice(c.storage); setDismissed(true); dialog.current?.close(); }
    useEffect(() => { const node = dialog.current; if (!node || !show)
        return; const previous = document.activeElement; const overflow = document.body.style.overflow; node.showModal(); closeButton.current?.focus({ preventScroll: true }); node.scrollTop = 0; document.body.style.overflow = 'hidden'; return () => { node.close(); document.body.style.overflow = overflow; if (previous instanceof HTMLElement)
        previous.focus(); }; }, [show]);
    useEffect(() => { function sync(event: StorageEvent) { if (event.key === POPUP_DAY_KEY && event.newValue === localDay(new Date()))
        setDismissed(true); } window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
    return <><dialog ref={dialog} className="recommendation-dialog" data-testid="course-popup" aria-labelledby="course-popup-title" onCancel={e => { e.preventDefault(); dismiss(false); }}><div className="recommendation-body"><p className="eyebrow blue">DALLABUSAN / FIND YOUR BUSAN</p><h2 id="course-popup-title">{c.popupTitle}</h2><p>{c.popupIntro}</p><div className="recommendation-art"><img src="/campaigns/course-popup-v2.png" alt={c.alt} width="1122" height="1402"/></div><div className="recommendation-categories">{CourseCategorySchema.options.map(category => <a href={'/courses?category=' + category + '&locale=' + locale} key={category} onClick={e => { if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        dismiss(false);
        onNavigate('/courses?category=' + category);
    } }}>{c[category]} <span aria-hidden="true">↗</span></a>)}</div><small>{c.preview}</small></div><footer><button type="button" onClick={() => dismiss(true)}>{c.today}</button><button ref={closeButton} type="button" onClick={() => dismiss(false)}>{c.close}</button></footer></dialog>{notice && <p className="popup-storage-notice" role="status">{notice}</p>}</>;
}
