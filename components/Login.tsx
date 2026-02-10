import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin123') onLogin();
    else alert('Invalid credentials. Use admin / admin123');
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverySent(true);
    // Simulate API call
    setTimeout(() => {
      setRecoverySent(false);
      setIsForgotPassword(false);
      alert('If an account exists for ' + recoveryEmail + ', a reset link has been sent.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-black text-indigo-400 tracking-tighter">QUEENS CHAMBERS</h1>
          <p className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Management Portal</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300">
          {!isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Access ID</label>
                <input 
                  placeholder="Username" 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-indigo-500 transition-all" 
                  onChange={e => setUser(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Secure Key</label>
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-indigo-500 transition-all" 
                  onChange={e => setPass(e.target.value)} 
                  required
                />
              </div>
              
              <div className="text-right px-2">
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)}
                  className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700 tracking-widest transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all transform active:scale-[0.98]">
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-6 animate-in">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-800">Reset Access</h2>
                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  Enter the email address associated with your administrator account to receive a secure reset link.
                </p>
              </div>
              
              <input 
                type="email" 
                placeholder="registered@email.com" 
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-indigo-500 transition-all" 
                value={recoveryEmail}
                onChange={e => setRecoveryEmail(e.target.value)}
                required
              />

              <div className="space-y-3">
                <button 
                  disabled={recoverySent}
                  className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {recoverySent ? 'Sending...' : 'Send Recovery Link'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
          
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Authorized Access Only</p>
        </div>

        <div className="pt-4">
          <p className="text-slate-600 text-[10px] font-medium opacity-50 uppercase tracking-[0.2em]">
            &copy; 2024 Queens Chambers Real Estate Management
          </p>
        </div>
      </div>
    </div>
  );
};