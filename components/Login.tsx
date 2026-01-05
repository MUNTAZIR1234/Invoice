
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

type AuthView = 'login' | 'forgot' | 'success';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulated authentication check
    // Credentials: admin / admin123
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        onLogin();
      } else {
        setError('Invalid username or password. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate recovery process
    setTimeout(() => {
      if (email.includes('@')) {
        setView('success');
      } else {
        setError('Please enter a valid email address.');
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600 text-white text-4xl mb-6 shadow-2xl shadow-indigo-500/40">
            🏢
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">QUEENS CHAMBERS</h1>
          <p className="text-slate-400 mt-2 font-medium">Property Management Portal</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-10">
            {view === 'login' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                <p className="text-slate-500 text-sm mb-8">Please enter your credentials to access the dashboard.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 font-medium"
                        placeholder="Enter username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setView('forgot')}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group disabled:opacity-70 mt-4"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Sign In to Dashboard
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {view === 'forgot' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Recover Password</h2>
                <p className="text-slate-500 text-sm mb-8">Enter your registered email address to receive recovery instructions.</p>

                <form onSubmit={handleRecovery} className="space-y-5">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 font-medium"
                        placeholder="admin@example.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group disabled:opacity-70 mt-4"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Send Recovery Link'
                    )}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setView('login')}
                    className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors py-2"
                  >
                    Back to Login
                  </button>
                </form>
              </div>
            )}

            {view === 'success' && (
              <div className="text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                  ✅
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Check Your Email</h2>
                <p className="text-slate-500 text-sm mb-8">
                  We've sent a recovery link to <span className="font-bold text-slate-700">{email}</span>. Please check your inbox and follow the instructions.
                </p>
                <button 
                  onClick={() => setView('login')}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
          
          <div className="px-10 py-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Authorized access only. System activity is logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
