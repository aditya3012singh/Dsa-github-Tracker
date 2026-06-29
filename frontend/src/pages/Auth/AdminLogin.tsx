import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminRegisterStudentsMutation } from '../../store/apiSlice';
import { Lock, LogIn, AlertCircle } from 'lucide-react';
import loginLogo from '../../assets/image.png';

const AdminLogin = () => {
  const [adminKey, setAdminKey] = useState('');
  const [validateKey, { isLoading }] = useAdminRegisterStudentsMutation();
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsError(false);

    try {
      // Temporarily store key in localStorage to allow header attachment
      localStorage.setItem('adminKey', adminKey);
      
      // Attempt validation by sending an empty batch list ([])
      await validateKey([]).unwrap();
      
      // Successfully authenticated
      navigate('/admin/dashboard');
      window.location.reload();
    } catch (err) {
      console.error('Admin authentication failed:', err);
      setIsError(true);
      localStorage.removeItem('adminKey');
    }
  };

  return (
    <div className="flex justify-center items-center py-16 px-4 animate-fade-in pt-40 pb-40">
      <div className="glass-card w-full bg-black/30 backdrop-blur-2xl border-purple-800 max-w-[440px] p-12 flex flex-col gap-8">
        <header className="text-center">
          <div className='p-8'>
            <img src={loginLogo} alt="Logo" className="h-24 w-auto object-contain mx-auto" />
          </div>
          <h1 className="text-4xl font-outfit font-bold mb-2">Admin Portal</h1>
          <p className="text-text-dim text-sm">Enter administrative key to manage students</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {isError && (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle size={20} />
              <span>Invalid Administrative Access Key</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-black text-text-dim/60 ml-2 tracking-widest transition-colors">
              ADMIN ACCESS KEY
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-text-dim" size={20} />
              <input 
                type="password" 
                placeholder="Enter admin key..." 
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-purple-500 focus:bg-white/[0.05] transition-all placeholder:text-slate-700"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 bg-purple-600 text-white rounded-2xl font-bold tracking-wide uppercase hover:bg-purple-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20 cursor-pointer ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <LogIn size={20} />
            <span>{isLoading ? 'Verifying...' : 'Authenticate'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
