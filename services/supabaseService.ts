import { createClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL environment variable not set");
}

if (!process.env.SUPABASE_API_KEY) {
    throw new Error("SUPABASE_API_KEY environment variable not set");
}

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_API_KEY
);

// Auth helper functions
export const auth = {
    async signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { data, error };
    },

    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getSession(): Promise<Session | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    async getUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
        return { data: { subscription } };
    }
};

// Document storage functions
export const documentService = {
    async uploadFile(file: File, userId: string): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL from storage bucket
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

        return publicUrl;
    },

    async getFileFromStorage(filePath: string): Promise<string> {
        // Get public URL from storage bucket 'documents'
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
        
        return publicUrl;
    },

    async listUserFiles(userId: string) {
        // List all files for a user from the 'documents' storage bucket
        const { data, error } = await supabase.storage
            .from('documents')
            .list(`${userId}/`, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'desc' }
            });

        if (error) throw error;
        return data;
    },

    async saveDocument(documentData: {
        userId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
        fileUrl: string;
        summary: string;
        pros: string[];
        cons: string[];
        potentialLoopholes: string[];
        potentialChallenges: string[];
    }) {
        const { data, error } = await supabase
            .from('documents')
            .insert({
                user_id: documentData.userId,
                file_name: documentData.fileName,
                file_type: documentData.fileType,
                file_size: documentData.fileSize,
                file_url: documentData.fileUrl,
                summary: documentData.summary,
                pros: documentData.pros,
                cons: documentData.cons,
                potential_loopholes: documentData.potentialLoopholes,
                potential_challenges: documentData.potentialChallenges,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getUserDocuments(userId: string) {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async deleteDocument(documentId: string, userId: string) {
        // First get the document to find the file path
        const { data: doc } = await supabase
            .from('documents')
            .select('file_url')
            .eq('id', documentId)
            .eq('user_id', userId)
            .single();

        // Delete from database first
        const { error: dbError } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId)
            .eq('user_id', userId);

        if (dbError) throw dbError;

        // Delete file from storage bucket 'documents' if exists
        if (doc?.file_url) {
            try {
                // Extract the storage path from the public URL
                // Public URL format: https://[project].supabase.co/storage/v1/object/public/documents/[userId]/[timestamp].[ext]
                const urlParts = doc.file_url.split('/documents/');
                if (urlParts.length > 1) {
                    const storagePath = urlParts[1]; // This is userId/timestamp.ext
                    
                    // Delete from 'documents' bucket
                    const { error: storageError } = await supabase.storage
                        .from('documents')
                        .remove([storagePath]);
                    
                    if (storageError) {
                        console.error('Error deleting file from storage:', storageError);
                        // Don't throw - file might already be deleted
                    }
                }
            } catch (err) {
                console.error('Error processing storage deletion:', err);
                // Continue even if storage deletion fails
            }
        }

        return { success: true };
    }
};

// Chat history service functions
export const chatService = {
    async saveMessage(userId: string, sessionId: string, role: 'user' | 'model', message: string) {
        const { data, error } = await supabase
            .from('chat_history')
            .insert({
                user_id: userId,
                session_id: sessionId,
                role,
                message,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getChatHistory(sessionId: string, userId: string) {
        const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getUserChatSessions(userId: string) {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createChatSession(userId: string, sessionId: string, title?: string) {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({
                user_id: userId,
                session_id: sessionId,
                title: title || null,
                message_count: 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateChatSessionTitle(sessionId: string, userId: string, title: string) {
        const { data, error } = await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteChatSession(sessionId: string, userId: string) {
        const { error: messagesError } = await supabase
            .from('chat_history')
            .delete()
            .eq('session_id', sessionId)
            .eq('user_id', userId);

        if (messagesError) throw messagesError;

        const { error: sessionError } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('session_id', sessionId)
            .eq('user_id', userId);

        if (sessionError) throw sessionError;

        return { success: true };
    }
};

