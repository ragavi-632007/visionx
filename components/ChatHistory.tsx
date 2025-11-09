import React, { useState, useEffect } from 'react';
import { chatService } from '../services/supabaseService';
import { ChatIcon, TrashIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface ChatSession {
    id: string;
    session_id: string;
    title: string | null;
    message_count: number;
    created_at: string;
    updated_at: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    message: string;
    created_at: string;
}

interface ChatHistoryProps {
    userId: string;
    onLoadSession?: (sessionId: string) => void;
}

const ChatHistory = ({ userId, onLoadSession }: ChatHistoryProps) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadSessions();
    }, [userId]);

    useEffect(() => {
        if (selectedSession) {
            loadChatHistory(selectedSession.session_id);
        } else {
            setMessages([]);
        }
    }, [selectedSession]);

    const loadSessions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await chatService.getUserChatSessions(userId);
            setSessions(data as ChatSession[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load chat sessions');
        } finally {
            setIsLoading(false);
        }
    };

    const loadChatHistory = async (sessionId: string) => {
        setIsLoadingMessages(true);
        setError(null);
        try {
            const data = await chatService.getChatHistory(sessionId, userId);
            setMessages(data as ChatMessage[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load chat history');
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to delete this conversation?')) {
            return;
        }

        setDeletingId(sessionId);
        try {
            await chatService.deleteChatSession(sessionId, userId);
            setSessions(sessions.filter(s => s.session_id !== sessionId));
            if (selectedSession?.session_id === sessionId) {
                setSelectedSession(null);
                setMessages([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete conversation');
        } finally {
            setDeletingId(null);
        }
    };

    const handleLoadSession = (session: ChatSession) => {
        if (onLoadSession) {
            onLoadSession(session.session_id);
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-2">Chat History</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    View and manage your past conversations
                </p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {sessions.length === 0 ? (
                <div className="text-center py-12">
                    <ChatIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        No conversations yet. Start chatting in the Legal Q&A tab!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sessions List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">
                            Your Conversations ({sessions.length})
                        </h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                                        selectedSession?.session_id === session.session_id
                                            ? 'border-brand-secondary'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                    onClick={() => setSelectedSession(session)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-brand-dark dark:text-white truncate mb-1">
                                                {session.title || 'Untitled Conversation'}
                                            </h4>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span>{session.message_count} messages</span>
                                                <span>•</span>
                                                <span>{formatDate(session.updated_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            {onLoadSession && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLoadSession(session);
                                                    }}
                                                    className="p-2 text-brand-secondary hover:bg-brand-light dark:hover:bg-slate-700 rounded-lg"
                                                    title="Continue this conversation"
                                                >
                                                    <ChatIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(session.session_id);
                                                }}
                                                disabled={deletingId === session.session_id}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                                                title="Delete conversation"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Messages View */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">
                            Conversation Details
                        </h3>
                        {selectedSession ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <h4 className="font-semibold text-brand-dark dark:text-white mb-2">
                                        {selectedSession.title || 'Untitled Conversation'}
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <p>Started: {formatDate(selectedSession.created_at)}</p>
                                        <p>Last updated: {formatDate(selectedSession.updated_at)}</p>
                                        <p>Total messages: {selectedSession.message_count}</p>
                                    </div>
                                </div>

                                {isLoadingMessages ? (
                                    <LoadingSpinner />
                                ) : (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                        {messages.length === 0 ? (
                                            <p className="text-center text-gray-600 dark:text-gray-400">
                                                No messages in this conversation
                                            </p>
                                        ) : (
                                            messages.map((msg, index) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-xl p-3 rounded-2xl whitespace-pre-wrap ${
                                                            msg.role === 'user'
                                                                ? 'bg-brand-secondary text-white rounded-br-none'
                                                                : 'bg-white dark:bg-slate-800 text-brand-dark dark:text-gray-200 rounded-bl-none'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className={`text-xs mt-2 ${
                                                            msg.role === 'user'
                                                                ? 'text-white/70'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                            {formatDate(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 bg-gray-50 dark:bg-slate-700 rounded-lg text-center">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Select a conversation from the list to view its messages
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHistory;

