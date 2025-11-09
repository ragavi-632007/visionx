import React, { useState } from 'react';
import DocumentAnalysis from './DocumentAnalysis';
import DocumentHistory from './DocumentHistory';
import ChatHistory from './ChatHistory';
import LegalQA from './LegalQA';
import { DocumentIcon, ChatIcon, LogoutIcon, HistoryIcon, MenuIcon, XIcon } from './icons';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageProvider';

interface DashboardProps {
    onLogout: () => void;
    userId: string;
}

type ActiveTab = 'analysis' | 'history' | 'chathistory' | 'qa';

const Dashboard = ({ onLogout, userId }: DashboardProps) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('analysis');
    const [loadChatSessionId, setLoadChatSessionId] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { t } = useLanguage();

    const TabButton = ({ tabName, label, icon }: { tabName: ActiveTab; label: React.ReactNode; icon: React.ReactNode }) => (
        <button
            onClick={() => {
                setActiveTab(tabName);
                setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-center flex-shrink-0 px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-xs sm:text-sm md:text-base rounded-t-lg transition-colors duration-200 focus:outline-none whitespace-nowrap min-w-[60px] sm:min-w-0 ${
                activeTab === tabName
                    ? 'bg-white dark:bg-slate-800 text-brand-secondary border-b-2 border-brand-secondary'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
            <span className="ml-1 sm:ml-2">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-brand-dark text-brand-dark dark:text-gray-200 font-sans">
            <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 md:py-4">
                    <div className="flex justify-between items-center">
                        <div 
                            className="text-xl md:text-2xl font-bold text-brand-primary dark:text-white cursor-pointer"
                            onClick={() => {
                                setActiveTab('analysis');
                                setMobileMenuOpen(false);
                            }}
                        >
                            Lexi<span className="text-brand-secondary">Gem</span>
                        </div>
                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            <LanguageSwitcher />
                            <button 
                                onClick={() => setActiveTab('analysis')}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-secondary dark:hover:text-brand-secondary transition-colors"
                            >
                                {t('common.dashboard')}
                            </button>
                            <button
                                onClick={onLogout}
                                className="flex items-center px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                                <LogoutIcon className="w-4 h-4 mr-2" />
                                {t('common.logout')}
                            </button>
                        </div>
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <XIcon className="w-6 h-6" />
                            ) : (
                                <MenuIcon className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                    {/* Mobile Menu Dropdown */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3 animate-slide-down">
                            <div className="flex items-center justify-between px-2">
                                <LanguageSwitcher />
                            </div>
                            <button 
                                onClick={() => {
                                    setActiveTab('analysis');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            >
                                {t('common.dashboard')}
                            </button>
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                                <LogoutIcon className="w-4 h-4 mr-2" />
                                {t('common.logout')}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="container mx-auto p-2 sm:p-4 md:p-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0 hide-scrollbar">
                        <TabButton 
                            tabName="analysis" 
                            label={<span className="hidden sm:inline">{t('tabs.analysis')}</span>}
                            icon={<DocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        />
                        <TabButton 
                            tabName="history" 
                            label={<span className="hidden sm:inline">{t('tabs.documents')}</span>}
                            icon={<HistoryIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        />
                        <TabButton 
                            tabName="chathistory" 
                            label={<span className="hidden sm:inline">{t('tabs.chatHistory')}</span>}
                            icon={<ChatIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        />
                        <TabButton 
                            tabName="qa" 
                            label={<span className="hidden sm:inline">{t('tabs.qa')}</span>}
                            icon={<ChatIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        />
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-b-lg shadow-lg">
                        {activeTab === 'analysis' && <DocumentAnalysis userId={userId} />}
                        {activeTab === 'history' && <DocumentHistory userId={userId} />}
                        {activeTab === 'chathistory' && (
                            <ChatHistory 
                                userId={userId} 
                                onLoadSession={(sessionId) => {
                                    setLoadChatSessionId(sessionId);
                                    setActiveTab('qa');
                                }}
                            />
                        )}
                        {activeTab === 'qa' && (
                            <LegalQA 
                                userId={userId} 
                                loadSessionId={loadChatSessionId}
                                onSessionLoaded={() => setLoadChatSessionId(null)}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;