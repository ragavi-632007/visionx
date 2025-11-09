import React, { useState } from 'react';
import DocumentAnalysis from './DocumentAnalysis';
import DocumentHistory from './DocumentHistory';
import ChatHistory from './ChatHistory';
import LegalQA from './LegalQA';
import { DocumentIcon, ChatIcon, LogoutIcon, HistoryIcon } from './icons';
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
    const { t } = useLanguage();

    const TabButton = ({ tabName, label, icon }: { tabName: ActiveTab; label: string; icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center justify-center w-full md:w-auto px-4 py-3 font-semibold text-sm md:text-base rounded-t-lg transition-colors duration-200 focus:outline-none ${
                activeTab === tabName
                    ? 'bg-white dark:bg-slate-800 text-brand-secondary border-b-2 border-brand-secondary'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
            <span className="ml-2">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-brand-dark text-brand-dark dark:text-gray-200 font-sans">
            <header className="bg-white dark:bg-slate-900 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div 
                        className="text-2xl font-bold text-brand-primary dark:text-white cursor-pointer"
                        onClick={() => setActiveTab('analysis')}
                    >
                        Lexi<span className="text-brand-secondary">Gem</span>
                    </div>
                    <div className="flex items-center space-x-4">
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
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <TabButton 
                            tabName="analysis" 
                            label={t('tabs.analysis')} 
                            icon={<DocumentIcon className="w-5 h-5" />}
                        />
                        <TabButton 
                            tabName="history" 
                            label={t('tabs.documents')} 
                            icon={<HistoryIcon className="w-5 h-5" />}
                        />
                        <TabButton 
                            tabName="chathistory" 
                            label={t('tabs.chatHistory')} 
                            icon={<ChatIcon className="w-5 h-5" />}
                        />
                        <TabButton 
                            tabName="qa" 
                            label={t('tabs.qa')}
                            icon={<ChatIcon className="w-5 h-5" />}
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