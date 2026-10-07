import { getRequestConfig } from 'next-intl/server';
import uzMessages from './messages/uz.json';
import ruMessages from './messages/ru.json';
import enMessages from './messages/en.json';

export const locales = ['uz', 'ru', 'en'];
export const defaultLocale = 'uz';

export default getRequestConfig(async ({ locale }) => {
    // Noma'lum yoki bo'sh locale (masalan, statik 404 sahifa) — o'zbekcha ishlatiladi
    let messages;
    if (locale === 'ru') {
        messages = ruMessages;
    } else if (locale === 'en') {
        messages = enMessages;
    } else {
        messages = uzMessages;
    }

    const safeLocale = (typeof locale === 'string' && locales.includes(locale)) ? locale : defaultLocale;

    return {
        locale: safeLocale,
        messages
    };
});
