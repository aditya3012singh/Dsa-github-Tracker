import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLeaderboardQuery, useSyncAllMutation } from '../../store/apiSlice';
import { Search, ChevronLeft, ChevronRight, RefreshCw, Trophy, Medal, Github, Code, LayoutGrid, ChevronDown, Zap, CheckCircle } from 'lucide-react';

const SORT_OPTIONS = [
  { key: 'totalSolved', label: 'Total Solved' },
  { key: 'leetcode', label: 'LeetCode' },
  { key: 'codeforces', label: 'Codeforces' },
  { key: 'codechef', label: 'CodeChef' },
  { key: 'gfg', label: 'GfG' },
  { key: 'github', label: 'GitHub' },
];

const Leaderboard = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalSolved');
  const [order, setOrder] = useState('desc');
  const [yearFilter, setYearFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [syncDone, setSyncDone] = useState(false);
  const limit = 50;

  const [syncAll, { isLoading: isSyncing }] = useSyncAllMutation();

  const handleSyncAll = async () => {
    try {
      const res: any = await syncAll(undefined).unwrap();
      setSyncDone(true);
      setTimeout(() => { setSyncDone(false); refetch(); }, 3000);
      console.log('[sync-all]', res.message);
    } catch (e) {
      console.error('[sync-all] failed', e);
    }
  };

  const { data, isLoading, isFetching, error, refetch } = useGetLeaderboardQuery({
    page, limit, search, sortBy, order,
  });

  const students = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((s: any) => {
      const yearMatch = yearFilter === 'All' || s.year?.toString() === yearFilter;
      const branchMatch = branchFilter === 'All' || (s.branch || '').toLowerCase().includes(branchFilter.toLowerCase());
      return yearMatch && branchMatch;
    });
  }, [data, yearFilter, sectionFilter, branchFilter]);

  const topThree = students.slice(0, 3);
  const tableStudents = students.slice(0);

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label ?? 'Total Solved';

  if (error) return (
    <div className="flex items-center justify-center p-12 text-red-400 bg-red-400/10 border border-red-400/20 rounded-2xl mt-32 mx-8">
      Oops! Something went wrong while loading the leaderboard.
    </div>
  );

  return (
    <div className="flex flex-col gap-10 pb-20 animate-fade-in pt-[100px]">

      {/* ── Page Header ── */}
      <header className="flex flex-col items-center gap-3 text-center px-4">
        <h1 className="text-[4rem] sm:text-[5.5rem] font-black font-outfit uppercase tracking-tighter text-white leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          Leaderboard
        </h1>
        <p className="text-base text-text-dim uppercase tracking-[0.3em] font-semibold">
          KIET Deemed to be University — DSA Rankings
        </p>
      </header>

      {/* ── Controls Row: Sort + Filters ── */}
      <div className="flex flex-wrap justify-center gap-4 px-4">
        {/* Sort by dropdown */}
        <DropdownSelect
          label="Sort By"
          value={sortBy}
          onChange={(val) => { setSortBy(val); setOrder('desc'); setPage(1); }}
          options={SORT_OPTIONS.map(o => ({ value: o.key, label: o.label }))}
          accent
        />

        {/* Order toggle */}


        {/* Year filter */}
        <DropdownSelect
          label="Year"
          value={yearFilter}
          onChange={(val) => { setYearFilter(val); setPage(1); }}
          options={[
            { value: 'All', label: 'All Years' },
            { value: '1', label: '1st Year' },
            { value: '2', label: '2nd Year' },
            { value: '3', label: '3rd Year' },
            { value: '4', label: '4th Year' },
          ]}
        />

        {/* Section filter */}
        <DropdownSelect
          label="Section"
          value={sectionFilter}
          onChange={(val: any) => { setSectionFilter(val); setPage(1); }}
          options={[
            { value: 'All', label: 'All Sections' },
            { value: 'A', label: 'Section A' },
            { value: 'B', label: 'Section B' },
            { value: 'C', label: 'Section C' },
            { value: 'D', label: 'Section D' },
          ]}
        />

        {/* Branch filter */}
        <DropdownSelect
          label="Branch"
          value={branchFilter}
          onChange={(val: any) => { setBranchFilter(val); setPage(1); }}
          options={[
            { value: 'All', label: 'All Branches' },
            { value: 'CS', label: 'CS' },
            { value: 'CSE', label: 'CSE' },
            { value: 'IT', label: 'IT' },
            { value: 'ECE', label: 'ECE' },
            { value: 'ME', label: 'ME' },
            { value: 'CE', label: 'CE' },
          ]}
        />
      </div>

      {/* ── Top-3 Highlight Section ── */}
      {!isLoading && topThree.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[98%] mx-auto w-full px-8">
          {topThree[0] && <HighlightCard student={topThree[0]} rank={1} color="#FFD700" />}
          {topThree[1] && <HighlightCard student={topThree[1]} rank={2} color="#E2E8F0" />}
          {topThree[2] && <HighlightCard student={topThree[2]} rank={3} color="#FDBA74" />}
        </section>
      )}

      {/* ── Main Table Area ── */}
      <div className="flex flex-col gap-8 max-w-[98%] mx-auto w-full px-8">
        {/* Controls Container */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-md">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-[15px] focus:border-primary/40 outline-none transition-all placeholder:text-slate-600"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="bg-white/[0.03] border border-white/5 text-slate-300 p-3 rounded-xl hover:border-primary/40 transition-all group"
              title="Refresh leaderboard"
            >
              <RefreshCw className={`${isFetching ? 'animate-spin' : ''} group-hover:text-primary`} size={20} />
            </button>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing || syncDone}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold border transition-all disabled:opacity-50 ${syncDone
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white'
                }`}
            >
              {isSyncing ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : syncDone ? <CheckCircle size={18} /> : <Zap size={18} />}
              <span>{isSyncing ? 'Syncing...' : syncDone ? 'Queued' : 'Sync All'}</span>
            </button>
          </div>
        </div>

        {/* Active sort indicator */}
        <div className="flex items-center gap-2 text-sm text-text-dim">
          <span>Sorted by</span>
          <span className="text-primary font-bold">{activeSortLabel}</span>
          <span className="opacity-40">·</span>
          <span>{tableStudents.length} students</span>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden rounded-2xl border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="text-[14px] uppercase tracking-[0.2em] font-black border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-5 text-white whitespace-nowrap">Rank</th>
                  <th className="px-6 py-5 text-white">Student</th>
                  <SortTh label="Total" sortKey="totalSolved" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} />
                  <th className="px-6 py-5 text-white whitespace-nowrap">Year</th>
                  <th className="px-6 py-5 text-white">Branch</th>
                  <th className="px-6 py-5 text-white">Sec</th>
                  <th className="px-6 py-5 text-white whitespace-nowrap">Roll No.</th>
                  <SortTh label="LeetCode" sortKey="leetcode" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} />
                  <SortTh label="Codeforces" sortKey="codeforces" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} />
                  <SortTh label="CodeChef" sortKey="codechef" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} />
                  <SortTh label="GfG" sortKey="gfg" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} />
                  <SortTh label="GitHub" sortKey="github" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} />
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                  : tableStudents.map((student: any, index: number) => {
                    const rank = (page - 1) * limit + index + 1;
                    const isEven = index % 2 === 0;
                    return (
                      <tr
                        key={student.id}
                        onClick={() => navigate(`/profile/${student.id}`)}
                        className={`group cursor-pointer transition-all duration-200 border-b border-white/[0.04] hover:bg-primary/8 ${isEven ? 'bg-white/[0.012]' : ''}`}
                      >
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <span className="text-[15px] font-bold text-slate-500 group-hover:text-primary transition-colors">#{rank}</span>
                        </td>

                        {/* Student name */}
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="font-bold text-[17px] text-slate-100 tracking-tight group-hover:text-primary transition-colors">{student.name}</span>
                        </td>

                        {/* Total */}
                        <td className="px-8 py-6">
                          <span className={`text-[17px] font-black font-outfit ${sortBy === 'totalSolved' ? 'text-primary' : 'text-slate-100'}`}>
                            {student.totalSolved}
                          </span>
                        </td>

                        {/* Year */}
                        <td className="px-8 py-6">
                          <span className="text-[15px] font-semibold text-slate-100">Year {student.year}</span>
                        </td>

                        {/* Branch */}
                        <td className="px-8 py-6">
                          <span className="text-[15px] font-medium text-slate-100">
                            {(student.branch || '—').replace(/[\d\s]+[A-Z]$/i, '').trim() || student.branch || '—'}
                          </span>
                        </td>

                        {/* Section */}
                        <td className="px-8 py-6">
                          <span className="text-[15px] font-bold text-slate-400">
                            {(student.branch || '').match(/([A-Za-z])$/)?.[1]?.toUpperCase() || '—'}
                          </span>
                        </td>

                        {/* Roll No */}
                        <td className="px-8 py-6">
                          <span className="font-mono text-[15px] text-slate-100 whitespace-nowrap tracking-tight">{student.rollNo}</span>
                        </td>

                        {/* LeetCode */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.leetcode.total} href={`https://leetcode.com/${student.leetcode.handle}`} color="#FFA116" active={sortBy === 'leetcode'} />
                        </td>

                        {/* Codeforces */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.codeforces.rating} href={`https://codeforces.com/profile/${student.codeforces.handle}`} color="#4dabf7" active={sortBy === 'codeforces'} suffix="pts" />
                        </td>

                        {/* CodeChef */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.codechef.rating} href={`https://www.codechef.com/users/${student.codechef.handle}`} color="#e8a87c" active={sortBy === 'codechef'} />
                        </td>

                        {/* GfG */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.gfg.total} href={`https://www.geeksforgeeks.org/user/${student.gfg.handle}/`} color="#69db7c" active={sortBy === 'gfg'} />
                        </td>

                        {/* GitHub */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.github.contributions} href={`https://github.com/${student.github.handle}`} color="#c9d1d9" active={sortBy === 'github'} />
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={page} total={data?.total || 0} limit={limit} setPage={setPage} />
      </div>
    </div>
  );
};

/* ── Helper Components ─────────────────────────────────────────────────────── */

const DropdownSelect = ({ label, value, onChange, options, accent = false }: any) => (
  <div className="flex flex-col gap-1.5 items-start">
    <span className="text-[10px] uppercase font-black text-text-dim/60 ml-1 tracking-[0.1em]">{label}</span>
    <div className="relative group/sel">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pr-10 pl-5 py-3 rounded-2xl outline-none cursor-pointer text-[13px] font-bold transition-all border shadow-lg ${accent
            ? 'bg-primary/10 border-primary/30 text-primary hover:border-primary hover:bg-primary/20'
            : 'bg-white/[0.03] border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
          }`}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-[#0f1425] text-white py-2">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover/sel:translate-y-[-40%] ${accent ? 'text-primary' : 'text-text-dim'}`} />
    </div>
  </div>
);
const SortTh = ({ label, sortKey, sortBy, order, onSort }: any) => {
  const active = sortBy === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-6 py-5 whitespace-nowrap cursor-pointer select-none transition-all text-[11px] uppercase tracking-[0.2em] font-black ${active
          ? 'text-primary'
          : 'text-slate-500 hover:text-slate-300'
        }`}
    >
      {label}{active && <span className="ml-1 text-[10px] opacity-80">{order === 'desc' ? '↓' : '↑'}</span>}
    </th>
  );
};

const PlatformCell = ({ value, href, color, active, suffix = '' }: any) => {
  const isZero = !value || value === 0;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 no-underline transition-all rounded-md px-3 py-1.5 -ml-3 ${active && !isZero
          ? 'font-black text-[16px]'
          : 'font-bold text-[16px] opacity-70 hover:opacity-100 hover:bg-white/5'
        }`}
      style={{
        color: isZero ? '#475569' : color,
        background: active && !isZero ? `${color}15` : '',
        boxShadow: active && !isZero ? `0 0 10px ${color}10` : 'none',
        textShadow: active && !isZero ? `0 0 8px ${color}40` : 'none',
      }}
    >
      {value ?? 0}
      {suffix && <span className="text-[10px] opacity-60 uppercase ml-0.5 tracking-wider">{suffix}</span>}
    </a>
  );
};

const HighlightCard = ({ student, rank, color }: any) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/profile/${student.id}`)}
      className="relative glass-card p-10 flex flex-col gap-6 cursor-pointer group hover:border-white/20 transition-all overflow-hidden"
    >
      <div className="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <Trophy size={120} style={{ color }} />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5 font-black text-2xl" style={{ color }}>
            #{rank}
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold font-outfit text-white tracking-tight">{student.name}</h3>
            <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">{student.rollNo}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 relative z-10">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">Solved</span>
          <span className="text-5xl font-black font-outfit text-white group-hover:text-primary transition-colors">{student.totalSolved}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">Rating</span>
          <span className="text-5xl font-black font-outfit text-slate-200" style={{ color: `${color}cc` }}>{student.score.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ page, total, limit, setPage }: any) => (
  <footer className="flex justify-center items-center gap-6 py-8">
    <button
      disabled={page === 1}
      onClick={() => setPage((p: number) => p - 1)}
      className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-white hover:border-primary hover:bg-primary/10 disabled:opacity-20 transition-all"
    >
      <ChevronLeft size={20} />
    </button>
    <span className="text-text-dim text-sm font-bold uppercase tracking-widest">
      Page {page} <span className="mx-2 opacity-30">/</span> {Math.max(1, Math.ceil(total / limit))}
    </span>
    <button
      disabled={page * limit >= total}
      onClick={() => setPage((p: number) => p + 1)}
      className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-white hover:border-primary hover:bg-primary/10 disabled:opacity-20 transition-all"
    >
      <ChevronRight size={20} />
    </button>
  </footer>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(11)].map((_, i) => (
      <td key={i} className="px-5 py-4">
        <div className="h-4 bg-white/5 rounded w-full max-w-[80px]" />
      </td>
    ))}
  </tr>
);

export default Leaderboard;
