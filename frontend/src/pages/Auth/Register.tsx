import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../../store/apiSlice';
import { User, Mail, Lock, Github, Code, LayoutGrid, Trophy, ArrowRight, CheckCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    password: '',
    branch: '',
    year: '1',
    leetcodeHandle: '',
    githubHandle: '',
    codeforcesHandle: '',
    codechefHandle: '',
    gfgHandle: ''
  });

  const [register, { isLoading, isSuccess }] = useRegisterMutation();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        ...formData,
        year: parseInt(formData.year)
      }).unwrap();
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex justify-center items-center py-20 px-4 animate-fade-in">
        <div className="glass-card success-view flex flex-col items-center gap-6 p-16 text-center">
          <CheckCircle size={64} className="text-success" />
          <h1 className="text-3xl font-outfit font-bold">Registration Successful!</h1>
          <p className="text-text-dim">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12 px-4 animate-fade-in">
      <div className="glass-card w-full max-w-[800px] p-12 flex flex-col gap-10">
        <header className="text-center">
          <h1 className="text-3xl font-outfit font-bold mb-2">Create Account</h1>
          <p className="text-text-dim text-sm">Join the elite coding community</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Full Name" name="name" icon={<User size={18}/>} placeholder="John Doe" value={formData.name} onChange={handleChange} required />
              <InputGroup label="Roll Number" name="rollNo" icon={<Trophy size={18}/>} placeholder="21BCS001" value={formData.rollNo} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Email Address" name="email" type="email" icon={<Mail size={18}/>} placeholder="john@college.edu" value={formData.email} onChange={handleChange} required />
              <InputGroup label="Password" name="password" type="password" icon={<Lock size={18}/>} placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Branch</label>
                <select name="branch" value={formData.branch} onChange={handleChange} required className="w-full bg-bg-glass border border-border px-4 py-3 rounded-xl text-white outline-none focus:border-primary transition-all text-sm">
                  <option value="" className='bg-bg-dark'>Select Branch</option>
                  <option value="CSE" className='bg-bg-dark'>Computer Science</option>
                  <option value="IT" className='bg-bg-dark'>Information Technology</option>
                  <option value="ECE" className='bg-bg-dark'>Electronics</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Year</label>
                <select name="year" value={formData.year} onChange={handleChange} required className="w-full bg-bg-glass border border-border px-4 py-3 rounded-xl text-white outline-none focus:border-primary transition-all text-sm">
                  <option value="1" className='bg-bg-dark'>1st Year</option>
                  <option value="2" className='bg-bg-dark'>2nd Year</option>
                  <option value="3" className='bg-bg-dark'>3rd Year</option>
                  <option value="4" className='bg-bg-dark'>4th Year</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">Coding Handles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup 
                label="LeetCode" 
                name="leetcodeHandle" 
                icon={<img src="https://img.icons8.com/?size=100&id=9L16NypUzu38&format=png&color=FFFFFF" alt="LeetCode" className="w-5 h-5 object-contain opacity-70" />} 
                placeholder="leetcode_user" 
                value={formData.leetcodeHandle} 
                onChange={handleChange} 
              />
              <InputGroup 
                label="GitHub" 
                name="githubHandle" 
                icon={<img src="https://img.icons8.com/?size=100&id=efFfwotdkiU5&format=png&color=FFFFFF" alt="GitHub" className="w-5 h-5 object-contain opacity-70" />} 
                placeholder="github_user" 
                value={formData.githubHandle} 
                onChange={handleChange} 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup 
                label="Codeforces" 
                name="codeforcesHandle" 
                icon={<img src="https://img.icons8.com/?size=100&id=jldAN67IAsrW&format=png&color=FFFFFF" alt="Codeforces" className="w-5 h-5 object-contain opacity-70" />} 
                placeholder="cf_handle" 
                value={formData.codeforcesHandle} 
                onChange={handleChange} 
              />
              <InputGroup 
                label="CodeChef" 
                name="codechefHandle" 
                icon={<img src="https://img.icons8.com/?size=100&id=4z2zrIWYmGqx&format=png&color=FFFFFF" alt="CodeChef" className="w-5 h-5 object-contain opacity-70" />} 
                placeholder="cc_handle" 
                value={formData.codechefHandle} 
                onChange={handleChange} 
              />
              <InputGroup 
                label="GeeksforGeeks" 
                name="gfgHandle" 
                icon={<img src="https://img.icons8.com/?size=100&id=AbQBhN9v62Ob&format=png&color=FFFFFF" alt="GfG" className="w-5 h-5 object-contain opacity-70" />} 
                placeholder="gfg_user" 
                value={formData.gfgHandle} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-primary text-white border-none p-4 rounded-xl font-bold flex items-center justify-center gap-3 cursor-pointer hover:bg-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-primary/20 text-lg"
          >
            {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <footer className="text-center text-sm text-text-dim mt-4">
          <p>Already have an account? <Link to="/login" className="text-primary no-underline font-semibold hover:underline">Sign In</Link></p>
        </footer>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">{label}</label>
    <div className="relative flex items-center">
      <span className="absolute left-4 text-text-dim">{icon}</span>
      <input 
        {...props} 
        className="w-full bg-bg-glass border border-border pl-12 pr-4 py-3 rounded-xl text-white outline-none focus:border-primary transition-all text-sm"
      />
    </div>
  </div>
);

export default Register;
