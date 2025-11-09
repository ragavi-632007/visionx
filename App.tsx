import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { auth } from './services/supabaseService';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from './components/LoadingSpinner';

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount
        const checkSession = async () => {
            try {
                const session = await auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleLogin = async () => {
        const currentUser = await auth.getUser();
        if (currentUser) {
            setUser(currentUser);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        setUser(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        return <LandingPage onLogin={handleLogin} />;
    }

    return <Dashboard onLogout={handleLogout} userId={user.id} />;
};

export default App;