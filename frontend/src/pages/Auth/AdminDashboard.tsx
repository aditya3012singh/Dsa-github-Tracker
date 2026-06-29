import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminRegisterStudentsMutation } from '../../store/apiSlice';
import { UserPlus, Users, LogOut, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultItem {
  libraryId: string;
  name?: string;
  status: 'success' | 'failed';
  id?: string;
  error?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [registerStudents, { isLoading }] = useAdminRegisterStudentsMutation();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single student form state
  const [singleStudent, setSingleStudent] = useState({
    name: '',
    libraryId: '',
    rollNo: '',
    email: '',
    branch: 'CSE',
    year: '1',
    section: '',
    leetcodeHandle: '',
    codeforcesHandle: '',
    gfgHandle: '',
    codechefHandle: '',
    githubHandle: '',
    linkedIn: '',
    password: '',
  });

  // Bulk input state
  const [bulkFormat, setBulkFormat] = useState<'json' | 'csv'>('json');
  const [bulkText, setBulkText] = useState('');
  
  // Response/Execution state
  const [statusReport, setStatusReport] = useState<{
    summary: { total: number; success: number; failed: number };
    results: ResultItem[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    navigate('/admin/login');
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusReport(null);
    setErrorMessage('');

    const payload = {
      ...singleStudent,
      year: parseInt(singleStudent.year, 10),
      rollNo: singleStudent.rollNo.trim() || undefined,
      email: singleStudent.email.trim() || undefined,
      section: singleStudent.section.trim() || undefined,
      leetcodeHandle: singleStudent.leetcodeHandle.trim() || undefined,
      codeforcesHandle: singleStudent.codeforcesHandle.trim() || undefined,
      gfgHandle: singleStudent.gfgHandle.trim() || undefined,
      codechefHandle: singleStudent.codechefHandle.trim() || undefined,
      githubHandle: singleStudent.githubHandle.trim() || undefined,
      linkedIn: singleStudent.linkedIn.trim() || undefined,
      password: singleStudent.password.trim() || undefined,
    };

    try {
      const res = await registerStudents(payload).unwrap();
      setStatusReport(res);
      if (res.summary.success > 0) {
        // Reset form
        setSingleStudent({
          name: '',
          libraryId: '',
          rollNo: '',
          email: '',
          branch: 'CSE',
          year: '1',
          section: '',
          leetcodeHandle: '',
          codeforcesHandle: '',
          gfgHandle: '',
          codechefHandle: '',
          githubHandle: '',
          linkedIn: '',
          password: '',
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.data?.message || 'Failed to submit student record.');
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const parsedData: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const currentline = line.split(',');
      const obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        const val = currentline[j] ? currentline[j].trim() : '';
        obj[headers[j]] = val;
      }
      parsedData.push(obj);
    }
    return parsedData;
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusReport(null);
    setErrorMessage('');

    let payload: any = [];

    if (bulkFormat === 'json') {
      try {
        const parsed = JSON.parse(bulkText);
        payload = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err) {
        setErrorMessage('Invalid JSON format. Please verify your brackets and syntax.');
        return;
      }
    } else {
      try {
        payload = parseCSV(bulkText);
        if (payload.length === 0) {
          setErrorMessage('Could not parse any student records. Ensure CSV header is correct.');
          return;
        }
      } catch (err) {
        setErrorMessage('Error parsing CSV. Please check formatting.');
        return;
      }
    }

    try {
      const res = await registerStudents(payload).unwrap();
      setStatusReport(res);
      if (res.summary.success > 0) {
        setBulkText('');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.data?.message || 'Failed to submit batch records.');
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto py-16 px-4 md:px-8 mt-24">
      {/* ── Header Area ── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-outfit font-black tracking-tight text-white mb-2 flex items-center gap-3">
            <Users className="text-purple-500" size={36} />
            Admin Dashboard
          </h1>
          <p className="text-text-dim text-sm">Add students one-by-one or in bunches, and view status logs.</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/5 text-sm"
        >
          <LogOut size={16} />
          Logout Admin
        </button>
      </header>

      {/* ── Main Layout (Dashboard Grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Adding forms (Column Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Tab Selector */}
          <div className="flex bg-black/40 border border-white/5 p-1.5 rounded-2xl w-full">
            <button
              onClick={() => { setActiveTab('single'); setErrorMessage(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold tracking-wide transition-all cursor-pointer text-sm ${
                activeTab === 'single'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              <UserPlus size={18} />
              Add Single Student
            </button>
            <button
              onClick={() => { setActiveTab('bulk'); setErrorMessage(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold tracking-wide transition-all cursor-pointer text-sm ${
                activeTab === 'bulk'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              <Users size={18} />
              Bulk Import (Bunches)
            </button>
          </div>

          {/* Form Card */}
          <div className="glass-card bg-black/30 backdrop-blur-2xl border-white/5 p-8 flex flex-col gap-6">
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle size={20} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {activeTab === 'single' ? (
              // ── SINGLE STUDENT FORM ──
              <form onSubmit={handleSingleSubmit} className="flex flex-col gap-6">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">Student Particulars</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Name *</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="Shivansh Srivastava"
                      value={singleStudent.name}
                      onChange={(e) => setSingleStudent({ ...singleStudent, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Library ID (Unique) *</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="2428CSIT1057"
                      value={singleStudent.libraryId}
                      onChange={(e) => setSingleStudent({ ...singleStudent, libraryId: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Roll No</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="202401100500177"
                      value={singleStudent.rollNo}
                      onChange={(e) => setSingleStudent({ ...singleStudent, rollNo: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Branch *</label>
                    <select
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm cursor-pointer"
                      value={singleStudent.branch}
                      onChange={(e) => setSingleStudent({ ...singleStudent, branch: e.target.value })}
                      required
                    >
                      <option value="CSE">CSE</option>
                      <option value="CS">CS</option>
                      <option value="IT">IT</option>
                      <option value="CSIT">CSIT</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="CE">CE</option>
                      <option value="CSE AI">CSE AI</option>
                      <option value="CSE AIML">CSE AIML</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Year *</label>
                      <select
                        className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm cursor-pointer"
                        value={singleStudent.year}
                        onChange={(e) => setSingleStudent({ ...singleStudent, year: e.target.value })}
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Sec</label>
                      <input
                        type="text"
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                        placeholder="D"
                        value={singleStudent.section}
                        onChange={(e) => setSingleStudent({ ...singleStudent, section: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Email</label>
                    <input
                      type="email"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="student@example.com"
                      value={singleStudent.email}
                      onChange={(e) => setSingleStudent({ ...singleStudent, email: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">LinkedIn Profile Link</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="https://linkedin.com/in/username"
                      value={singleStudent.linkedIn}
                      onChange={(e) => setSingleStudent({ ...singleStudent, linkedIn: e.target.value })}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2 mt-2">Coding Handles & Credentials</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">LeetCode Username</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="shivasri45"
                      value={singleStudent.leetcodeHandle}
                      onChange={(e) => setSingleStudent({ ...singleStudent, leetcodeHandle: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Codeforces Username</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="cf_username"
                      value={singleStudent.codeforcesHandle}
                      onChange={(e) => setSingleStudent({ ...singleStudent, codeforcesHandle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">GeeksforGeeks</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="gfg_username"
                      value={singleStudent.gfgHandle}
                      onChange={(e) => setSingleStudent({ ...singleStudent, gfgHandle: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">CodeChef</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="codechef_username"
                      value={singleStudent.codechefHandle}
                      onChange={(e) => setSingleStudent({ ...singleStudent, codechefHandle: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">GitHub</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                      placeholder="github_username"
                      value={singleStudent.githubHandle}
                      onChange={(e) => setSingleStudent({ ...singleStudent, githubHandle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Account Password (Optional)</label>
                  <input
                    type="password"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm"
                    placeholder="Defaults to password123"
                    value={singleStudent.password}
                    onChange={(e) => setSingleStudent({ ...singleStudent, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 mt-4 bg-purple-600 text-white rounded-2xl font-bold tracking-wide uppercase hover:bg-purple-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20 cursor-pointer ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <UserPlus size={20} />
                  <span>{isLoading ? 'Registering...' : 'Add Student'}</span>
                </button>
              </form>
            ) : (
              // ── BULK IMPORTER FORM ──
              <form onSubmit={handleBulkSubmit} className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-lg font-bold text-white">Batch Bunches</h3>
                  <div className="flex bg-black/60 border border-white/5 p-1 rounded-xl text-xs font-bold text-text-dim">
                    <button
                      type="button"
                      onClick={() => setBulkFormat('json')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        bulkFormat === 'json' ? 'bg-purple-600 text-white shadow-md' : 'hover:text-white'
                      }`}
                    >
                      JSON Array
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkFormat('csv')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        bulkFormat === 'csv' ? 'bg-purple-600 text-white shadow-md' : 'hover:text-white'
                      }`}
                    >
                      CSV Paste
                    </button>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl text-xs leading-relaxed text-text-dim flex flex-col gap-2">
                  <p className="font-bold text-white flex items-center gap-2">
                    <FileText size={14} className="text-purple-500" />
                    Expected Format Guide:
                  </p>
                  {bulkFormat === 'json' ? (
                    <pre className="overflow-x-auto text-[10px] bg-black/40 p-3 rounded-lg text-primary font-mono select-all">
{`[
  {
    "name": "Jane Doe",
    "libraryId": "2428CSIT1057",
    "branch": "CSE",
    "year": 2,
    "leetcodeHandle": "janedoe_lc"
  }
]`}
                    </pre>
                  ) : (
                    <div>
                      <p className="mb-2">Enter headers on line 1 exactly as shown below, followed by data records on each line:</p>
                      <pre className="overflow-x-auto text-[10px] bg-black/40 p-3 rounded-lg text-primary font-mono select-all">
{`name,libraryId,rollNo,email,branch,year,section,leetcodeHandle,githubHandle
Jane Doe,2428CSIT1057,202401100500177,,CSE,2,D,janedoe_lc,janedoe_gh`}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-dim tracking-wider ml-1">Paste Raw Data</label>
                  <textarea
                    rows={12}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-4 text-white font-mono outline-none focus:border-purple-500 transition-all text-xs resize-y"
                    placeholder={bulkFormat === 'json' ? '[\n  {\n    "name": "Student Name", ...\n  }\n]' : 'name,libraryId,branch,year\nJohn Doe,LIB001,CS,3'}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !bulkText.trim()}
                  className={`w-full py-4 bg-purple-600 text-white rounded-2xl font-bold tracking-wide uppercase hover:bg-purple-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20 cursor-pointer ${
                    isLoading || !bulkText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Users size={20} />
                  <span>{isLoading ? 'Importing Batch...' : 'Submit Batch'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Response Report/Status Logs (Column Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card bg-black/30 backdrop-blur-2xl border-white/5 p-8 flex flex-col gap-6 min-h-[400px]">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">Status Log Report</h3>

            {!statusReport ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-text-dim py-12">
                <FileText size={48} className="text-white/10" />
                <div>
                  <p className="font-bold text-sm text-white/40">No Operation Run Yet</p>
                  <p className="text-xs text-text-dim/60 mt-1 max-w-[240px] mx-auto">Results of student registration or bulk loads will display here dynamically.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 flex-1">
                {/* Summary Badges */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl text-center">
                    <p className="text-xl font-black text-white">{statusReport.summary.total}</p>
                    <p className="text-[9px] font-black uppercase text-text-dim/60 tracking-wider mt-1">Total</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
                    <p className="text-xl font-black text-emerald-400">{statusReport.summary.success}</p>
                    <p className="text-[9px] font-black uppercase text-emerald-500/80 tracking-wider mt-1">Success</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
                    <p className="text-xl font-black text-red-400">{statusReport.summary.failed}</p>
                    <p className="text-[9px] font-black uppercase text-red-500/80 tracking-wider mt-1">Failed</p>
                  </div>
                </div>

                {/* Individual Logs List */}
                <div className="flex-1 flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {statusReport.results.map((res, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-3.5 border rounded-xl flex items-start gap-3 transition-all ${
                          res.status === 'success'
                            ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/5 border-red-500/15 text-red-400'
                        }`}
                      >
                        {res.status === 'success' ? (
                          <CheckCircle size={18} className="shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <XCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-white truncate">{res.name || 'Unknown Student'}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px]">
                            <span className="bg-black/25 text-text-dim px-1.5 py-0.5 rounded font-mono font-semibold">{res.libraryId}</span>
                            {res.status === 'success' ? (
                              <span className="text-emerald-500/80 font-bold">Successfully Registered</span>
                            ) : (
                              <span className="text-red-500/80 font-bold max-w-full break-words">{res.error || 'Registration failed'}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
