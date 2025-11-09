import React, { useState, useEffect } from 'react';
import { documentService } from '../services/supabaseService';
import { ShieldCheckIcon, ExclamationCircleIcon, LightbulbIcon, BalanceScaleIcon, TrashIcon, DownloadIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface Document {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    summary: string;
    pros: string[];
    cons: string[];
    potential_loopholes: string[];
    potential_challenges: string[];
    created_at: string;
}

interface DocumentHistoryProps {
    userId: string;
}

const AnalysisSection = ({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
        <h3 className="flex items-center text-lg font-semibold text-brand-dark dark:text-white mb-3">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        <ul className="space-y-2">
            {items.map((item, index) => (
                <li key={index} className="flex items-start">
                    <svg className="w-4 h-4 text-brand-secondary mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <p className="ml-2 text-gray-700 dark:text-gray-300 text-sm">{item}</p>
                </li>
            ))}
        </ul>
    </div>
);

const DocumentHistory = ({ userId }: DocumentHistoryProps) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadDocuments();
    }, [userId]);

    const loadDocuments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const docs = await documentService.getUserDocuments(userId);
            setDocuments(docs as Document[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        setDeletingId(docId);
        try {
            await documentService.deleteDocument(docId, userId);
            setDocuments(documents.filter(doc => doc.id !== docId));
            if (selectedDoc?.id === docId) {
                setSelectedDoc(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete document');
        } finally {
            setDeletingId(null);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

    if (error && documents.length === 0) {
        return (
            <div className="p-4">
                <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-2">Document History</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    View and manage your analyzed documents
                </p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {documents.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        No documents yet. Upload and analyze a document to see it here!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Document List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">
                            Your Documents ({documents.length})
                        </h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className={`p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                                        selectedDoc?.id === doc.id
                                            ? 'border-brand-secondary'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                    onClick={() => setSelectedDoc(doc)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-brand-dark dark:text-white truncate">
                                                {doc.file_name}
                                            </h4>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span>{formatFileSize(doc.file_size)}</span>
                                                <span>•</span>
                                                <span>{formatDate(doc.created_at)}</span>
                                            </div>
                                            {doc.summary && (
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {doc.summary}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(doc.id);
                                            }}
                                            disabled={deletingId === doc.id}
                                            className="ml-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                                            title="Delete document"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Document Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">
                            Analysis Details
                        </h3>
                        {selectedDoc ? (
                            <div className="space-y-6">
                                <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                                    <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-3">
                                        {selectedDoc.file_name}
                                    </h2>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {selectedDoc.summary}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AnalysisSection
                                        title="Pros"
                                        items={selectedDoc.pros || []}
                                        icon={<ShieldCheckIcon className="w-5 h-5 text-green-500" />}
                                    />
                                    <AnalysisSection
                                        title="Cons"
                                        items={selectedDoc.cons || []}
                                        icon={<ExclamationCircleIcon className="w-5 h-5 text-red-500" />}
                                    />
                                    <AnalysisSection
                                        title="Potential Loopholes"
                                        items={selectedDoc.potential_loopholes || []}
                                        icon={<LightbulbIcon className="w-5 h-5 text-yellow-500" />}
                                    />
                                    <AnalysisSection
                                        title="Potential Challenges"
                                        items={selectedDoc.potential_challenges || []}
                                        icon={<BalanceScaleIcon className="w-5 h-5 text-blue-500" />}
                                    />
                                </div>

                                {selectedDoc.file_url && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg flex flex-col sm:flex-row gap-3">
                                        <a
                                            href={selectedDoc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center px-4 py-2 bg-brand-secondary text-white rounded-lg hover:bg-sky-600 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Document
                                        </a>
                                        <a
                                            href={selectedDoc.file_url}
                                            download={selectedDoc.file_name}
                                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <DownloadIcon className="w-5 h-5 mr-2" />
                                            Download
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 bg-gray-50 dark:bg-slate-700 rounded-lg text-center">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Select a document from the list to view its analysis
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentHistory;

