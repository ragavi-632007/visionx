import React from 'react';
import { useLanguage } from '../i18n/LanguageProvider';

const LanguageSwitcher = () => {
  const { language, setLanguage, languageNames, t } = useLanguage();
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm text-gray-600 dark:text-gray-300">
        {t('common.language')}
      </label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700"
      >
        {Object.entries(languageNames).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;


