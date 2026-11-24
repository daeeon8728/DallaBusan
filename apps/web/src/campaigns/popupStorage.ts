export const POPUP_DAY_KEY = 'dallabusan:recommendation-day:v1';
export const POPUP_SESSION_KEY = 'dallabusan:recommendation-session:v1';
let closedForVisit = false;
let suppressedDay: string | null = null;
export function localDay(date: Date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function canShowPopup(date: Date, day: Pick<Storage, 'getItem'>, session: Pick<Storage, 'getItem'>) {
    const today = localDay(date);
    if (closedForVisit || suppressedDay === today)
        return false;
    try {
        if (day.getItem(POPUP_DAY_KEY) === today)
            return false;
    }
    catch { /* Storage can be blocked. */ }
    try {
        return session.getItem(POPUP_SESSION_KEY) !== 'closed';
    }
    catch {
        return true;
    }
}
export function dismissPopup(today: boolean, date: Date, day: Pick<Storage, 'setItem'>, session: Pick<Storage, 'setItem'>) {
    if (today) {
        try {
            day.setItem(POPUP_DAY_KEY, localDay(date));
            suppressedDay = localDay(date);
            return true;
        }
        catch { /* Keep the dialog closed for this visit, without claiming persistence. */ }
    }
    closedForVisit = true;
    try {
        session.setItem(POPUP_SESSION_KEY, 'closed');
    }
    catch { /* In-memory dismissal remains available. */ }
    return !today;
}
