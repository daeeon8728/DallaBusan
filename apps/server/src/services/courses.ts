import { CourseSchema, CoursesResponseSchema, type CourseCategory, type Locale } from '@trip-fit/domain';
import type { CourseCatalog } from '../config/courses.js';
import type { DestinationService } from './destinations.js';
import type { GuideService } from './guides.js';
export function createCourseService(config: CourseCatalog, destinations: DestinationService, guides: GuideService) {
    const cache = new Map<Locale, ReturnType<typeof CourseSchema.parse>[]>();
    function items(locale: Locale) {
        const cached = cache.get(locale);
        if (cached)
            return cached;
        const result = config.items.flatMap(item => {
            let valid = true;
            const steps = item.steps.map(step => {
                if (step.kind === 'note')
                    return { kind: step.kind, id: null, name: step.texts[locale], originalName: null, contentTranslation: 'editorial', href: null, address: null, image: null, sourceUrl: null, locale };
                if (step.kind === 'destination') {
                    const value = destinations.get(step.id, locale)?.destination;
                    if (!value) {
                        valid = false;
                        return null;
                    }
                    return { kind: step.kind, id: step.id, name: value.name, originalName: destinations.get(step.id, 'ko')?.destination.name ?? null, contentTranslation: value.contentTranslation, href: '/places/' + step.id, address: value.address, image: value.image ? { url: value.image.url, credit: value.image.credit } : null, sourceUrl: value.sourceUrl, locale: value.locale };
                }
                const value = guides.get('food', step.id, locale);
                if (!value) {
                    valid = false;
                    return null;
                }
                return { kind: step.kind, id: step.id, name: value.item.name, originalName: value.item.originalName, contentTranslation: value.item.contentTranslation, href: '/food/' + step.id, address: value.item.address, image: value.item.imageUrl ? { url: value.item.imageUrl, credit: value.source.credit } : null, sourceUrl: value.source.url, locale: value.item.locale };
            });
            return valid ? [CourseSchema.parse({ id: item.id, category: item.category, title: item.titles[locale], locale, status: item.status, routeCheck: 'pending', fieldValidation: 'not-performed', steps, image: steps.find(step => step?.image)?.image ?? null, reviewedOn: config.reviewedOn })] : [];
        });
        cache.set(locale, result);
        return result;
    }
    return { list(locale: Locale, category?: CourseCategory) { const all = items(locale); return CoursesResponseSchema.parse({ locale, items: category ? all.filter(item => item.category === category) : all, total: all.length, counts: { family: all.filter(x => x.category === 'family').length, date: all.filter(x => x.category === 'date').length, food: all.filter(x => x.category === 'food').length, dallabusan: all.filter(x => x.category === 'dallabusan').length } }); }, get(id: string, locale: Locale) { return items(locale).find(item => item.id === id) ?? null; } };
}
export type CourseService = ReturnType<typeof createCourseService>;
