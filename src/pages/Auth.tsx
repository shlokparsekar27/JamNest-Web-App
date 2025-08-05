// src/pages/Auth.tsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
// The unused 'useNavigate' import has been removed from this file.

// A smaller, reusable Login Form component
const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        className="w-full p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
};

// A smaller, reusable Sign Up Form component
const SignUpForm = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            alert(error.message);
        } else {
            alert('Your account is successfully created!.');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSignUp} className="space-y-4">
            <input
                className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                type="password"
                placeholder="Password (at least 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button
                type="submit"
                className="w-full p-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
            >
                {loading ? 'Signing up...' : 'Sign Up'}
            </button>
        </form>
    );
};


// The main Auth page component that switches between Login and Sign Up
export default function Auth() {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">JamNest 🎵</h1>
            <p className="text-gray-500 mt-2">
                {isLoginView ? 'Welcome back! Please sign in.' : 'Create your account to get started.'}
            </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg">
            {isLoginView ? <LoginForm /> : <SignUpForm />}
            <div className="mt-6 text-center">
                <button 
                    onClick={() => setIsLoginView(!isLoginView)}
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    {isLoginView ? 'Need an account? Sign up' : 'Already have an account? Log in'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}