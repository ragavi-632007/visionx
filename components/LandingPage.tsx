import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { ArrowRightIcon, LightningIcon, ShieldIcon, CheckCircleIcon, PlayIcon, DocumentIcon, SparkleIcon } from './icons';
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Header */}
            <header className="relative z-10 p-3 sm:p-4 md:p-6 flex justify-between items-center flex-wrap gap-2">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    Lexi<span className="text-sky-400">Gem</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-wrap">
                    <div className="hidden sm:block">
                        <LanguageSwitcher />
                    </div>
                    <button
                        onClick={() => setShowLogin(true)}
                        className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:text-sky-300 transition-colors whitespace-nowrap"
                    >
                        {t('common.login')}
                    </button>
                    <button
                        onClick={() => setShowRegister(true)}
                        className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors whitespace-nowrap"
                    >
                        {t('common.signup')}
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
                <div className="max-w-6xl mx-auto">
                    {/* Badge */}
                    <div className="flex justify-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/20 backdrop-blur-sm border border-sky-400/30 rounded-full">
                            <LightningIcon className="w-4 h-4 text-sky-400" />
                            <span className="text-sm sm:text-base font-medium text-sky-300">AI-Powered Legal Intelligence</span>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white text-center mb-4 sm:mb-6 md:mb-8 leading-tight px-2">
                        Decode Your Legal Documents in <span className="text-sky-400">Seconds</span>
                    </h1>

                    {/* Description */}
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 text-center max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-12 leading-relaxed px-4">
                        Stop struggling with complex legal language. LexiGem uses advanced AI to transform confusing contracts into clear, actionable insights.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12 px-4">
                        <button
                            onClick={() => setShowLogin(true)}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-900 text-sm sm:text-base md:text-lg font-bold rounded-xl shadow-2xl hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white/50 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
                        >
                            Start Analyzing Free
                            <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </button>
                        <button
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white/30 text-white text-sm sm:text-base md:text-lg font-semibold rounded-xl hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 flex items-center justify-center"
                        >
                            <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Watch Demo
                        </button>
                    </div>

                    {/* Features */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-16 sm:mb-20">
                        <div className="flex items-center gap-2 text-white">
                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                            <span className="text-sm sm:text-base">No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                            <span className="text-sm sm:text-base">Free to start</span>
                        </div>
                    </div>
                </div>

                {/* Why Choose LexiGem Section */}
                <div className="max-w-7xl mx-auto mt-20 sm:mt-32">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                            Why Choose LexiGem?
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                            Powerful features designed to simplify your legal document review.
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4">
                        {/* AI-Powered Analysis */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-500/30 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                                <SparkleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-sky-300" />
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                                AI-Powered Analysis
                            </h3>
                            <p className="text-gray-300 text-sm sm:text-base md:text-lg">
                                Advanced AI breaks down complex legal jargon
                            </p>
                        </div>

                        {/* Secure & Private */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-500/30 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                                <ShieldIcon className="w-6 h-6 sm:w-8 sm:h-8 text-sky-300" />
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                                Secure & Private
                            </h3>
                            <p className="text-gray-300 text-sm sm:text-base md:text-lg">
                                Your documents are encrypted and protected
                            </p>
                        </div>

                        {/* Instant Results */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 sm:col-span-2 md:col-span-1">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-500/30 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                                <LightningIcon className="w-6 h-6 sm:w-8 sm:h-8 text-sky-300" />
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                                Instant Results
                            </h3>
                            <p className="text-gray-300 text-sm sm:text-base md:text-lg">
                                Get insights in seconds, not hours
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 bg-slate-950/50 backdrop-blur-sm border-t border-white/10 mt-12 sm:mt-20 md:mt-32 py-6 sm:py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <DocumentIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">LexiGem</span>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm md:text-base text-center sm:text-right">
                            Simplifying legal documents with AI-powered insights
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;