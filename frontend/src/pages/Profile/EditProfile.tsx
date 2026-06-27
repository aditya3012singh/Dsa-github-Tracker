import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetStudentQuery, useUpdateProfileMutation } from '../../store/apiSlice';
import { User, BookOpen, GraduationCap, Grid, Code, Github, Hash, Save, X, Trophy, RefreshCw, Linkedin } from 'lucide-react';
import { BRANCHES } from '../../constants/branches';
import leetcodeIcon from '../../assets/icons/leetcode.png';
import codeforcesIcon from '../../assets/icons/codeforces.png';
import gfgIcon from '../../assets/icons/gfg.png';
import codechefIcon from '../../assets/icons/codechef.png';

const EditProfile = () => {
  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = loggedInUser.id;
  const { data, isLoading } = useGetStudentQuery(userId, { skip: !userId });
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    libraryId: '',
    branch: '',
    year: '',
    section: '',
    leetcodeHandle: '',
    githubHandle: '',
    codeforcesHandle: '',
    // codechefHandle: '',
    gfgHandle: '',
    linkedIn: ''
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      setFormData({
        name: s.name || '',
        rollNo: s.rollNo || '',
        libraryId: s.libraryId || '',
        branch: s.branch || '',
        year: s.year?.toString() || '',
        section: s.section || '',
        leetcodeHandle: s.leetcode?.handle || '',
        githubHandle: s.github?.handle || '',
        codeforcesHandle: s.codeforces?.handle || '',
        // codechefHandle: s.codechef?.handle || '',
        gfgHandle: s.gfg?.handle || '',
        linkedIn: s.linkedIn || ''
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        ...formData,
        year: parseInt(formData.year) || 0
      }).unwrap();
      navigate(`/profile/${userId}`);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center text-text-dim text-lg flex items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-primary" size={24} />
        Loading profile data...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 animate-fade-in pt-[100px] px-6 max-w-[1200px] mx-auto w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[2.2rem] font-black font-outfit text-white leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              Edit Profile<span className="text-primary">.</span>
            </h1>
            <p className="text-sm text-text-dim uppercase tracking-[0.2em] font-semibold mt-1">
              Update your information and platform handles
            </p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Info Section */}
          <section className="glass-card p-10 bg-black/30 border-white/10 flex flex-col gap-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center text-primary">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-outfit font-bold text-white tracking-tight">Basic Information</h2>
                <p className="text-[11px] text-text-dim uppercase tracking-[0.18em] font-black">Identity and academic details</p>
              </div>
            </div>

            <InputGroup label="Full Name" icon={<User size={18} />} name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
            
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Library ID (Read-only)" icon={<Hash size={18} />} name="libraryId" value={formData.libraryId} onChange={() => {}} placeholder="2226CSE1084" readOnly />
              <InputGroup label="Roll Number" icon={<Trophy size={18} />} name="rollNo" value={formData.rollNo} onChange={handleChange} placeholder="2100290120123" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectGroup
                label="Year"
                icon={<GraduationCap size={18} />}
                name="year"
                value={formData.year}
                onChange={handleChange}
                options={[
                  { value: '1', label: '1st Year' },
                  { value: '2', label: '2nd Year' },
                  { value: '3', label: '3rd Year' },
                  { value: '4', label: '4th Year' },
                ]}
              />
              <InputGroup label="Section" icon={<Grid size={18} />} name="section" value={formData.section} onChange={handleChange} placeholder="e.g. A" />
            </div>

            <SelectGroup
              label="Branch"
              icon={<BookOpen size={18} />}
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              options={BRANCHES.map(b => ({ value: b, label: b }))}
            />
          </section>

          {/* Coding Handles Section */}
          <section className="glass-card p-10 bg-black/30 border-white/10 flex flex-col gap-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center text-primary">
                <Code size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-outfit font-bold text-white tracking-tight">Coding Platforms</h2>
                <p className="text-[11px] text-text-dim uppercase tracking-[0.18em] font-black">Connect your competitive profiles</p>
              </div>
            </div>

            <InputGroup 
              label="LeetCode Username" 
              icon={<img src={leetcodeIcon} className="w-[18px] h-[18px]" alt="LC" />} 
              name="leetcodeHandle" 
              value={formData.leetcodeHandle} 
              onChange={handleChange} 
              placeholder="leetcode_id" 
            />
            
            <InputGroup 
              label="GitHub Username" 
              icon={<Github size={18} />} 
              name="githubHandle" 
              value={formData.githubHandle} 
              onChange={handleChange} 
              placeholder="github_id" 
            />

            <InputGroup 
              label="Codeforces Handle" 
              icon={<img src={codeforcesIcon} className="w-[18px] h-[18px]" alt="CF" />} 
              name="codeforcesHandle" 
              value={formData.codeforcesHandle} 
              onChange={handleChange} 
              placeholder="cf_id" 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* <InputGroup 
                label="CodeChef" 
                icon={<img src={codechefIcon} className="w-[18px] h-[18px]" alt="CC" />} 
                name="codechefHandle" 
                value={formData.codechefHandle} 
                onChange={handleChange} 
                placeholder="cc_id" 
              /> */}
              <InputGroup 
                label="GfG" 
                icon={<img src={gfgIcon} className="w-[18px] h-[18px]" alt="GFG" />} 
                name="gfgHandle" 
                value={formData.gfgHandle} 
                onChange={handleChange} 
                placeholder="gfg_id" 
              />
            </div>

            <InputGroup 
              label="LinkedIn URL" 
              icon={<Linkedin size={18} />} 
              name="linkedIn" 
              value={formData.linkedIn} 
              onChange={handleChange} 
              placeholder="https://www.linkedin.com/in/your-profile" 
            />
          </section>

          {/* Submit */}
          <div className="lg:col-span-2">
            <div className="glass-card p-5 bg-black/30 border-white/10 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-7 py-3 rounded-xl bg-primary text-white font-black font-outfit shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.45)] hover:bg-[hsl(var(--primary-glow))] transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, name, value, onChange, placeholder, readOnly }: any) => (
  <div className="flex flex-col gap-2 group/input">
    <label className="text-[10px] uppercase font-black text-text-dim/60 ml-2 tracking-widest transition-colors group-focus-within/input:text-primary">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-primary transition-colors">
        {icon}
      </div>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full border rounded-2xl py-4 pl-14 pr-6 text-white font-bold outline-none transition-all placeholder:text-slate-700 ${
          readOnly
            ? 'bg-black/10 border-white/[0.06] text-slate-500 cursor-not-allowed select-none'
            : 'bg-black/20 border-white/10 focus:border-primary/50 focus:bg-black/30'
        }`}
      />
    </div>
  </div>
);

const SelectGroup = ({ label, icon, name, value, onChange, options }: any) => (
  <div className="flex flex-col gap-2 group/select">
    <label className="text-[10px] uppercase font-black text-text-dim/60 ml-2 tracking-widest transition-colors group-focus-within/select:text-primary">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/select:text-primary transition-colors pointer-events-none">
        {icon}
      </div>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border rounded-2xl py-4 pl-14 pr-10 text-white font-bold outline-none transition-all bg-black/20 border-white/10 focus:border-primary/50 focus:bg-black/30 appearance-none"
      >
        <option value="" className="bg-[#0a0a0c] text-slate-400">Select Year</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-[#0a0a0c] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
    </div>
  </div>
);

export default EditProfile;
