import React from 'react';
import { useLanguage } from '../i18n/LanguageProvider';

const Disclaimer = () => {
    const { t } = useLanguage();
    return (
        <div className="mt-6 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-lg dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-300">
            <p className="text-sm font-semibold">{t('disclaimer.title')}</p>
            <p className="text-sm">{t('disclaimer.body')}</p>
        </div>
    );
};

export default Disclaimer;