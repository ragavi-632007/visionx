import React, { useState } from 'react';
import { auth } from '../services/supabaseService';

interface LoginProps {
    onLoginSuccess: () => void;
    onSwitchToRegister: () => void;
}

const Login = ({ onLoginSuccess, onSwitchToRegister }: LoginProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error } = await auth.signIn(email, password);
            if (error) {
                setError(error.message);
            } else {
                onLoginSuccess();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-primary dark:text-white">
                        Lexi<span className="text-brand-secondary">Gem</span>
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome back</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg dark:bg-red-900/20 dark:border-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent dark:bg-slate-700 dark:text-white"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent dark:bg-slate-700 dark:text-white"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-brand-secondary hover:underline font-semibold"
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

