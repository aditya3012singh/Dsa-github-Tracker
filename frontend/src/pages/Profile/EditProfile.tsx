import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetStudentQuery, useUpdateProfileMutation } from '../../store/apiSlice';
import { User, BookOpen, GraduationCap, Grid, Code, Github, Globe, Hash, Save, X, Trophy } from 'lucide-react';
import { DropdownSelect } from '../Dashboard/components/LeaderboardComponents';
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
    codechefHandle: '',
    gfgHandle: ''
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
        codechefHandle: s.codechef?.handle || '',
        gfgHandle: s.gfg?.handle || ''
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black font-outfit text-white mb-2">Edit Profile</h1>
            <p className="text-text-dim uppercase tracking-widest text-sm font-bold">Refine your identity on the platform</p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary flex items-center gap-3 mb-6">
              <User size={20} />
              Basic Information
            </h2>

            <InputGroup label="Full Name" icon={<User size={18} />} name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
            
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Library ID (Read-only)" icon={<Hash size={18} />} name="libraryId" value={formData.libraryId} onChange={() => {}} placeholder="2226CSE1084" readOnly />
              <InputGroup label="Roll Number" icon={<Trophy size={18} />} name="rollNo" value={formData.rollNo} onChange={handleChange} placeholder="2100290120123" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DropdownSelect
                label="Year"
                icon={GraduationCap}
                value={formData.year}
                onChange={(val: string) => setFormData({ ...formData, year: val })}
                options={[
                  { value: '1', label: '1st Year' },
                  { value: '2', label: '2nd Year' },
                  { value: '3', label: '3rd Year' },
                  { value: '4', label: '4th Year' },
                ]}
              />
              <InputGroup label="Section" icon={<Grid size={18} />} name="section" value={formData.section} onChange={handleChange} placeholder="e.g. A" />
            </div>

            <InputGroup label="Branch" icon={<BookOpen size={18} />} name="branch" value={formData.branch} onChange={handleChange} placeholder="e.g. CS" />
          </div>

          {/* Coding Handles Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary flex items-center gap-3 mb-6">
              <Code size={20} />
              Coding Platforms
            </h2>

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
              <InputGroup 
                label="CodeChef" 
                icon={<img src={codechefIcon} className="w-[18px] h-[18px]" alt="CC" />} 
                name="codechefHandle" 
                value={formData.codechefHandle} 
                onChange={handleChange} 
                placeholder="cc_id" 
              />
              <InputGroup 
                label="GfG" 
                icon={<img src={gfgIcon} className="w-[18px] h-[18px]" alt="GFG" />} 
                name="gfgHandle" 
                value={formData.gfgHandle} 
                onChange={handleChange} 
                placeholder="gfg_id" 
              />
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 pt-8">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-primary hover:bg-primary-hover text-white font-black font-outfit py-5 rounded-[24px] shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={24} />
                  SAVE CHANGES
                </>
              )}
            </button>
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
            ? 'bg-white/[0.01] border-white/[0.03] text-slate-500 cursor-not-allowed select-none'
            : 'bg-white/[0.03] border-white/5 focus:border-primary/50 focus:bg-white/[0.05]'
        }`}
      />
    </div>
  </div>
);

export default EditProfile;
