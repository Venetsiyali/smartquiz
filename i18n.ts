import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import fs from 'fs';
import uzMessages from './messages/uz.json';
import ruMessages from './messages/ru.json';
import enMessages from './messages/en.json';

export const locales = ['uz', 'ru', 'en'];
export const defaultLocale = 'uz';

export default getRequestConfig(async ({ locale }) => {
    try { fs.appendFileSync('locale_debug.log', "I18N LOCALE RECEIVED: " + locale + "\n"); } catch (e) { }
    if (!locales.includes(locale as any)) {
        console.error("I18N INVALID LOCALE PASSED:", locale);
        // notFound();
    }

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
