import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { getAiClient } from '../services/geminiService';
import { chatService, documentService } from '../services/supabaseService';
import type { ChatMessage } from '../types';
import { SendIcon } from './icons';
import Disclaimer from './Disclaimer';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../i18n/LanguageProvider';

const buildSystemInstruction = (languageName: string) =>
    `You are LexiGem, an AI-powered legal assistant. Your goal is to help everyday users understand general legal topics. Answer questions about legal terms, user rights, or general law-related topics in a clear, simple, and conversational manner.
IMPORTANT: You are an educational tool and not a certified lawyer.
CRITICAL: Respond in ${languageName} only. Append a short disclaimer in ${languageName} at the end stating that the response is not legal advice.`;

interface LegalQAProps {
    userId: string;
    loadSessionId?: string | null;
    onSessionLoaded?: () => void;
}

const LegalQA = ({ userId, loadSessionId, onSessionLoaded }: LegalQAProps) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [documents, setDocuments] = useState<Array<{ id: string; file_name: string; summary: string }>>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { language, languageNames, t } = useLanguage();

    // Load user's analyzed documents for context selection
    useEffect(() => {
        const loadDocuments = async () => {
            try {
                const docs = await documentService.getUserDocuments(userId);
                setDocuments(docs?.map((d: any) => ({ id: d.id, file_name: d.file_name, summary: d.summary })) || []);
            } catch (err) {
                console.error('Error loading documents:', err);
            }
        };
        loadDocuments();
    }, [userId]);

    useEffect(() => {
        const initChat = async () => {
            if (loadSessionId) {
                // Load existing session
                setIsLoadingHistory(true);
                try {
                    const history = await chatService.getChatHistory(loadSessionId, userId);
                    const historyMessages: ChatMessage[] = history.map((msg: any) => ({
                        role: msg.role as 'user' | 'model',
                        parts: [{ text: msg.message }]
                    }));
                    setMessages(historyMessages);

                    // Rebuild chat history for Gemini
                    const geminiHistory = historyMessages.map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.parts[0].text }]
                    }));

                    const newChat = getAiClient().chats.create({
                        model: 'gemini-2.5-pro',
                        config: { systemInstruction: buildSystemInstruction(languageNames[language]) },
                        history: geminiHistory.slice(0, -1),
                    });
                    setChat(newChat);
                    setSessionId(loadSessionId);
                    
                    if (onSessionLoaded) {
                        onSessionLoaded();
                    }
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    // Don't show API key errors or service unavailable errors
                    if (!errorMessage.includes('API key') && 
                        !errorMessage.includes('Missing API key') && 
                        errorMessage !== 'SERVICE_UNAVAILABLE') {
                        console.error('Error loading chat history:', err);
                        setError('Failed to load conversation history');
                    } else {
                        console.error('Service unavailable. Please check configuration.');
                    }
                } finally {
                    setIsLoadingHistory(false);
                }
            } else {
                // Generate a new session ID
                const newSessionId = crypto.randomUUID();
                setSessionId(newSessionId);

                // Create chat session in database
                try {
                    await chatService.createChatSession(userId, newSessionId);
                } catch (err) {
                    console.error('Error creating chat session:', err);
                }

                try {
                    const newChat = getAiClient().chats.create({
                        model: 'gemini-2.5-pro',
                        config: { systemInstruction: buildSystemInstruction(languageNames[language]) },
                        history: [],
                    });
                    setChat(newChat);
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    // Silently handle API key errors during initialization
                    if (!errorMessage.includes('API key') && 
                        !errorMessage.includes('Missing API key') && 
                        errorMessage !== 'SERVICE_UNAVAILABLE') {
                        console.error('Error initializing chat:', err);
                    } else {
                        console.error('Service unavailable. Please check configuration.');
                    }
                }
            }
        };
        initChat();
    }, [userId, loadSessionId, language]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading || !sessionId) return;

        const userMessageText = userInput.trim();
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: userMessageText }] };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            // Build contextualized message if a document is selected
            let messageToSend = userMessageText;
            const selectedDoc = documents.find(d => d.id === selectedDocumentId);
            if (selectedDoc) {
                messageToSend = `Context: You have access to an analyzed document.\nTitle: ${selectedDoc.file_name}\nSummary: ${selectedDoc.summary}\n\nUser Question: ${userMessageText}`;
            }

            // Save user message (original) to database
            await chatService.saveMessage(userId, sessionId, 'user', userMessageText);

            // Update session title if this is the first message
            if (messages.length === 0) {
                const title = userMessageText.length > 50 
                    ? userMessageText.substring(0, 50) + '...' 
                    : userMessageText;
                try {
                    await chatService.updateChatSessionTitle(sessionId, userId, title);
                } catch (err) {
                    console.error('Error updating session title:', err);
                }
            }

            // Send to AI and get streaming response with simple retry on rate limit
            const tryStream = async () => {
                try {
                    return await chat.sendMessageStream({ message: messageToSend });
                } catch (e: any) {
                    const msg = (e instanceof Error ? e.message : String(e)) || '';
                    if ((/quota|rate|429/i).test(msg)) {
                        // brief backoff then retry once
                        await new Promise(r => setTimeout(r, 1200));
                        return await chat.sendMessageStream({ message: messageToSend });
                    }
                    throw e;
                }
            };
            const stream = await tryStream();
            
            let modelResponseText = '';
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                modelResponseText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: modelResponseText }] };
                    return newMessages;
                });
            }

            // Save model response to database after streaming completes
            if (modelResponseText) {
                await chatService.saveMessage(userId, sessionId, 'model', modelResponseText);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            // Don't show API key errors or service unavailable errors to the user - handle silently
            if (!errorMessage.includes('API key') && 
                !errorMessage.includes('Missing API key') && 
                errorMessage !== 'SERVICE_UNAVAILABLE') {
                setError(errorMessage);
                const errorResponse: ChatMessage = { role: 'model', parts: [{ text: `Sorry, I encountered an error: ${errorMessage}` }] };
                setMessages(prev => [...prev, errorResponse]);
                
                // Save error message to database if session exists
                if (sessionId) {
                    try {
                        await chatService.saveMessage(userId, sessionId, 'model', errorResponse.parts[0].text);
                    } catch (saveErr) {
                        console.error('Error saving error message:', saveErr);
                    }
                }
            } else {
                // Silently handle API key errors - just log to console
                console.error('Service unavailable. Please check configuration.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingHistory) {
        return (
            <div className="flex items-center justify-center h-[85vh] p-4 md:p-6">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[85vh] p-4 md:p-6 bg-gray-50 dark:bg-slate-900">
            {/* Optional: choose a document to provide context to the AI */}
            {documents.length > 0 && (
                <div className="mb-3">
                    <select
                        value={selectedDocumentId}
                        onChange={(e) => setSelectedDocumentId(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary bg-white dark:bg-slate-800 dark:text-gray-200"
                    >
                        <option value="">{`Select a document to reference (optional)`}</option>
                        {documents.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                                {doc.file_name}
                            </option>
                        ))}
                    </select>
                    {selectedDocumentId && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
                            <p className="font-medium">Selected document summary:</p>
                            <p className="text-gray-600 dark:text-gray-300">
                                {documents.find(d => d.id === selectedDocumentId)?.summary}
                            </p>
                        </div>
                    )}
                </div>
            )}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-inner">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-secondary text-white rounded-br-none' : 'bg-gray-200 dark:bg-slate-700 text-brand-dark dark:text-gray-200 rounded-bl-none'}`}>
                            {msg.parts[0].text}
                            {msg.role === 'model' && msg.parts[0].text.includes("does not constitute legal advice") && <Disclaimer/>}
                        </div>
                    </div>
                ))}
                 {isLoading && messages[messages.length-1]?.role === 'user' && (
                    <div className="flex justify-start">
                        <div className="max-w-xl p-3 rounded-2xl bg-gray-200 dark:bg-slate-700 text-brand-dark dark:text-gray-200 rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                 {!messages.length && (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <p>{t('qa.empty.line1')}</p>
                        <p className="text-sm mt-2">{t('qa.empty.line2')}</p>
                    </div>
                 )}
            </div>
            <Disclaimer />
            
            {error && <div className="mt-2 p-2 text-sm bg-red-100 text-red-700 rounded-lg">{error}</div>}

            <form onSubmit={handleSendMessage} className="mt-4 flex items-center space-x-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={t('qa.placeholder')}
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition duration-150 bg-white dark:bg-slate-800 dark:text-gray-200"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="p-3 bg-brand-secondary text-white rounded-full hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <SendIcon className="h-6 w-6" />
                </button>
            </form>
        </div>
    );
};

export default LegalQA;