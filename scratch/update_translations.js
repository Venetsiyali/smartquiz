const fs = require('fs');

const pathUz = './messages/uz.json';
const pathRu = './messages/ru.json';
const pathEn = './messages/en.json';

const getTexts = (lang) => {
    let result = {};
    if (lang === 'uz') {
        result = {
            aiOson: "Zukkoo AI (Oson)",
            aiQiyin: "Zukkoo AI (Qiyin)",
        };
    } else if (lang === 'ru') {
        result = {
            aiOson: "Zukkoo AI (Легкий)",
            aiQiyin: "Zukkoo AI (Сложный)",
        };
    } else {
        result = {
            aiOson: "Zukkoo AI (Easy)",
            aiQiyin: "Zukkoo AI (Hard)",
        };
    }
    return result;
}

const updateJson = (filepath, lang) => {
    try {
        let data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const additions = getTexts(lang);
        
        // Add inside TeacherCreate.Modals
        if (data.TeacherCreate && data.TeacherCreate.Modals) {
            data.TeacherCreate.Modals = {
                ...data.TeacherCreate.Modals,
                ...additions
            };
        }

        fs.writeFileSync(filepath, JSON.stringify(data, null, 4), 'utf8');
        console.log(`Updated ${filepath}`);
    } catch (e) {
        console.error(`Error updating ${filepath}:`, e);
    }
}

updateJson(pathUz, 'uz');
updateJson(pathRu, 'ru');
updateJson(pathEn, 'en');
