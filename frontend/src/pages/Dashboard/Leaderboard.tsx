import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLeaderboardQuery, useSyncAllMutation } from '../../store/apiSlice';
import { Search, ChevronLeft, ChevronRight, RefreshCw, Trophy, Medal, Github, Code, LayoutGrid, ChevronDown, Zap, CheckCircle } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { DropdownSelect, SortTh, PlatformCell, HighlightCard, Pagination, SkeletonRow } from './components/LeaderboardComponents';
import leetcodeIcon from '../../assets/icons/leetcode.png';
import codeforcesIcon from '../../assets/icons/codeforces.png';
import codechefIcon from '../../assets/icons/codechef.png';
import gfgIcon from '../../assets/icons/gfg.png';
import githubIcon from '../../assets/icons/github.png';

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
  const debouncedSearch = useDebounce(search, 300);
  const [sortBy, setSortBy] = useState('totalSolved');
  const [order, setOrder] = useState('desc');
  const [yearFilter, setYearFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [syncDone, setSyncDone] = useState(false);
  const limit = 30;

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
    page, limit, search: debouncedSearch, sortBy, order,
    year: yearFilter, section: sectionFilter, branch: branchFilter
  });

  const students = useMemo(() => {
    if (!data?.data) return [];
    return data.data; // Filtering is now handled server-side
  }, [data]);

  const topThree = students.slice(0, 3);
  const tableStudents = students.slice(0);

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label ?? 'Total Solved';

  if (error) return (
    <div className="flex items-center justify-center p-12 text-red-400 bg-red-400/10 border border-red-400/20 rounded-2xl mt-32 mx-8">
      Oops! Something went wrong while loading the leaderboard.
    </div>
  );

  return (
    <div className="flex flex-col gap-10 pb-2 animate-fade-in pt-[100px]">

      {/* ── Page Header ── */}
      <header className="flex flex-col items-center gap-3 text-center px-4">
        <h1 className="text-[2rem] sm:text-[2rem] font-black font-outfit  text-white leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          Leaderboard
        </h1>
        <p className="text-base text-text-dim uppercase tracking-[0.2em] font-semibold">
          KIET Deemed to be University — DSA Rankings
        </p>
      </header>

      {/* ── Controls Row: Sort + Filters ── */}
      <div className="flex flex-wrap justify-center gap-5 px-4">
        {/* Sort by dropdown */}
        <DropdownSelect
          label="Sort By"
          value={sortBy}
          onChange={(val: string) => { setSortBy(val); setOrder('desc'); setPage(1); }}
          options={SORT_OPTIONS.map(o => ({ value: o.key, label: o.label }))}
          accent
        />

        {/* Order toggle */}


        {/* Year filter */}
        <DropdownSelect
          label="Year"
          value={yearFilter}
          onChange={(val: string) => { setYearFilter(val); setPage(1); }}
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
          {topThree[1] && <HighlightCard student={topThree[1]} rank={2} color="#94a3b8" />}
          {topThree[2] && <HighlightCard student={topThree[2]} rank={3} color="#cd7f32" />}
        </section>
      )}

      {/* ── Main Table Area ── */}
      <div className="flex flex-col gap-8 max-w-[98%] mx-auto w-full px-2">
        {/* Controls Container */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center bg-white/[0.02] border border-white/5 p-2 rounded-3xl backdrop-blur-md">
          <div className="relative flex-1 bg-black">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or roll no..."
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

            {/* <button
              onClick={handleSyncAll}
              disabled={isSyncing || syncDone}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold border transition-all disabled:opacity-50 ${syncDone
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white'
                }`}
            >
              {isSyncing ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : syncDone ? <CheckCircle size={18} /> : <Zap size={18} />}
              <span>{isSyncing ? 'Syncing...' : syncDone ? 'Queued' : 'Sync All'}</span>
            </button> */}
          </div>
        </div>

        {/* Active sort indicator */}
        {/* <div className="flex items-center gap-2 text-sm text-text-dim">
          <span>Sorted by</span>
          <span className="text-primary font-bold">{activeSortLabel}</span>
          <span className="opacity-40">·</span>
          <span>{tableStudents.length} students</span>
        </div> */}

        {/* Table */}
        <div className="glass-card overflow-hidden rounded-2xl border border-white/5 bg-black">
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
                  <th className="px-6 py-5 text-white whitespace-nowrap">Roll No</th>
                  <SortTh
                    label={<div className="flex items-center gap-2"><img src={leetcodeIcon} className="w-4 h-4 object-contain" alt="LeetCode" /><span className='text-white'>LeetCode</span></div>}
                    sortKey="leetcode" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                  <SortTh
                    label={<div className="flex items-center gap-2"><img src={codeforcesIcon} className="w-4 h-4 object-contain" alt="Codeforces" /><span className='text-white'>Codeforces</span></div>}
                    sortKey="codeforces" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                  <SortTh
                    label={<div className="flex items-center gap-2"><img src={codechefIcon} className="w-4 h-4 object-contain opacity-80" alt="CodeChef" /><span className='text-white'>CodeChef</span></div>}
                    sortKey="codechef" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                  <SortTh
                    label={<div className="flex items-center gap-2"><img src={gfgIcon} className="w-4 h-4 object-contain opacity-80" alt="GfG" /><span className='text-white'>GfG</span></div>}
                    sortKey="gfg" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                  <SortTh
                    label={<div className="flex items-center gap-2"><img src={githubIcon} className="w-5 h-5 object-contain opacity-80" alt="GitHub" /><span className='text-white' >GitHub</span></div>}
                    sortKey="github" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                </tr>
              </thead>
              <tbody>
                {/* Pinned User Rank */}
                {!isLoading && data?.userRank && (
                  <tr
                    onClick={() => navigate(`/profile/${data.userRank.student.id}`)}
                    className="group cursor-pointer transition-all duration-300 border-b-2 border-primary/30 bg-primary/10 hover:bg-primary/20"
                  >
                    <td className="px-8 py-6 whitespace-nowrap text-center relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                      <span className="text-[15px] font-black text-primary animate-pulse">YOUR RANK: #{data.userRank.rank}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="font-black text-[17px] text-white tracking-tight">{data.userRank.student.name}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[17px] font-black font-outfit text-primary">
                        {data.userRank.student.totalSolved}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[15px] font-semibold text-slate-100">{data.userRank.student.year}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[15px] font-medium text-slate-100">
                        {(data.userRank.student.branch || '—').replace(/[\d\s]+[A-Z]$/i, '').trim() || data.userRank.student.branch || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[15px] font-bold text-slate-400">
                        {data.userRank.student.section || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <span className="font-mono text-[15px] text-slate-100 whitespace-nowrap tracking-tight">{data.userRank.student.rollNo || '—'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <PlatformCell value={data.userRank.student.leetcode.total} href={`https://leetcode.com/${data.userRank.student.leetcode.handle}`} color="#FFD700" active={sortBy === 'leetcode'} />
                    </td>
                    <td className="px-8 py-8  ">
                      <PlatformCell value={data.userRank.student.codeforces.rating} href={`https://codeforces.com/profile/${data.userRank.student.codeforces.handle}`} color="#339AF0" active={sortBy === 'codeforces'} suffix="pts" />
                    </td>
                    <td className="px-8 py-8">
                      <PlatformCell value={data.userRank.student.codechef.rating} href={`https://www.codechef.com/users/${data.userRank.student.codechef.handle}`} color="#FF922B" active={sortBy === 'codechef'} />
                    </td>
                    <td className="px-8 py-6">
                      <PlatformCell value={data.userRank.student.gfg.total} href={`https://www.geeksforgeeks.org/user/${data.userRank.student.gfg.handle}/`} color="#51CF66" active={sortBy === 'gfg'} />
                    </td>
                    <td className="px-8 py-8">
                      <PlatformCell value={data.userRank.student.github.contributions} href={`https://github.com/${data.userRank.student.github.handle}`} color="#F8FAFC" active={sortBy === 'github'} />
                    </td>
                  </tr>
                )}

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
                          <span className="text-[15px] font-semibold text-slate-100">{student.year}</span>
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
                            {student.section || '—'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="font-mono text-[15px] text-slate-100 whitespace-nowrap tracking-tight">{student.rollNo || '—'}</span>
                        </td>

                        {/* LeetCode */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.leetcode.total} href={`https://leetcode.com/${student.leetcode.handle}`} color="#FFD700" active={sortBy === 'leetcode'} />
                        </td>

                        {/* Codeforces */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.codeforces.rating} href={`https://codeforces.com/profile/${student.codeforces.handle}`} color="#339AF0" active={sortBy === 'codeforces'} suffix="pts" />
                        </td>

                        {/* CodeChef */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.codechef.rating} href={`https://www.codechef.com/users/${student.codechef.handle}`} color="#FF922B" active={sortBy === 'codechef'} />
                        </td>

                        {/* GfG */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.gfg.total} href={`https://www.geeksforgeeks.org/user/${student.gfg.handle}/`} color="#51CF66" active={sortBy === 'gfg'} />
                        </td>

                        {/* GitHub */}
                        <td className="px-8 py-6">
                          <PlatformCell value={student.github.contributions} href={`https://github.com/${student.github.handle}`} color="#F8FAFC" active={sortBy === 'github'} />
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

export default Leaderboard;

