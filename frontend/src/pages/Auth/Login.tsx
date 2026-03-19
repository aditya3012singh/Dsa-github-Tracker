import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../store/apiSlice';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const [libraryId, setLibraryId] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ libraryId, password }).unwrap();
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.data));
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="flex justify-center items-center py-16 px-4 animate-fade-in pt-40 pb-40">
      <div className="glass-card w-full max-w-[440px] p-12 flex flex-col gap-8">
        <header className="text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-outfit font-bold mb-2">Welcome Back</h1>
          <p className="text-text-dim text-sm">Login with your college library credentials</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle size={20} />
              <span>Invalid Library ID or Password</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-black text-text-dim/60 ml-2 tracking-widest transition-colors">LIBRARY ID</label>
            <div className="relative flex items-center">
              <User className="absolute left-4 text-text-dim" size={20} />
              <input 
                type="text" 
                placeholder="Ex: 2226CSE1084" 
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-700"
                value={libraryId}
                onChange={(e) => setLibraryId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-black text-text-dim/60 ml-2 tracking-widest transition-colors">PASSWORD</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-text-dim" size={20} />
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-primary hover:bg-[hsl(var(--primary-glow))] text-white font-black font-outfit py-5 rounded-[24px] shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 mt-4 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <footer className="text-center text-sm text-text-dim mt-4">
          <p>Forgot password? <span className="text-primary font-semibold">Contact your administrator</span></p>
          <p className="mt-2 text-[11px] opacity-60">Accounts are created by the admin. Contact KIET DSA Club.</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
