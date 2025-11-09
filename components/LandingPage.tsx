import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { ArrowRightIcon } from './icons';
import Login from './Login';
import Register from './Register';

interface LandingPageProps {
    onLogin: () => void;
}

const LandingPage = ({ onLogin }: LandingPageProps) => {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const { t } = useLanguage();

    if (showLogin) {
        return <Login onLoginSuccess={onLogin} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />;
    }

    if (showRegister) {
        return <Register onRegisterSuccess={onLogin} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />;
    }

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900 text-center p-4 relative">
            <header className="absolute top-0 left-0 right-0 p-4 md:px-8 md:py-6 flex justify-between items-center">
                <div className="text-xl font-bold text-brand-primary dark:text-white">
                    Lexi<span className="text-brand-secondary">Gem</span>
                </div>
                <div className="flex items-center space-x-3 md:space-x-4">
                    <LanguageSwitcher />
                    <button
                        onClick={() => setShowLogin(true)}
                        className="px-4 py-2 text-sm font-semibold text-brand-primary dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        {t('common.login')}
                    </button>
                    <button
                        onClick={() => setShowRegister(true)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {t('common.signup')}
                    </button>
                </div>
            </header>

            
            <main className="flex flex-col justify-center items-center">
                <h1 className="text-4xl md:text-6xl font-bold text-brand-primary dark:text-white max-w-4xl">
                    Ready to Understand Your Legal Documents?
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                    Join thousands of users who trust LexiGem for clear, AI-powered legal insights.
                </p>
                <button
                    onClick={onLogin}
                    className="mt-10 px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center"
                >
                    Start Analyzing Now
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    No credit card required • Free to start
                </p>
            </main>
        </div>
    );
};

export default LandingPage;