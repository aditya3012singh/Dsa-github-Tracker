import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLeaderboardQuery, useSyncAllMutation } from '../../store/apiSlice';
import { Search, RefreshCw, Zap, CheckCircle } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { DropdownSelect, SortTh, PlatformCell, HighlightCard, HighlightCardSkeleton, Pagination, SkeletonRow } from './components/LeaderboardComponents';
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

/* Small pill badges for Year and Section cells */
const YearBadge = ({ year }: { year: number | null }) =>
  year ? (
    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
      Year {year}
    </span>
  ) : <span className="text-slate-600">—</span>;

const SectionBadge = ({ section }: { section: string | null }) =>
  section ? (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-black bg-white/[0.06] text-slate-200 border border-white/10">
      {section}
    </span>
  ) : <span className="text-slate-600">—</span>;

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
    return data.data;
  }, [data]);

  const topThree = students.slice(0, 3);
  const tableStudents = students.slice(0);

  if (error) return (
    <div className="flex items-center justify-center p-12 text-red-400 bg-red-400/10 border border-red-400/20 rounded-2xl mt-32 mx-8">
      Oops! Something went wrong while loading the leaderboard.
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-8 animate-fade-in pt-[100px]">

      {/* ── Page Header + Filters ── */}
      <header className="flex flex-col items-center gap-5 text-center px-4">
        <div>
          <h1 className="text-[2.2rem] font-black font-outfit text-white leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            Leaderboard<span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-text-dim uppercase tracking-[0.2em] font-semibold mt-1">
            KIET Deemed to be University — DSA Rankings
          </p>
        </div>

        {/* Filters row — centered under title */}
        <div className="flex flex-wrap justify-center gap-4">
          <DropdownSelect
            label="Year"
            value={yearFilter}
            onChange={(val: string) => { setYearFilter(val); setPage(1); }}
            options={[
              { value: 'All', label: 'All' },
              { value: '1', label: '1st Year' },
              { value: '2', label: '2nd Year' },
              { value: '3', label: '3rd Year' },
              { value: '4', label: '4th Year' },
            ]}
          />
          <DropdownSelect
            label="Section"
            value={sectionFilter}
            onChange={(val: any) => { setSectionFilter(val); setPage(1); }}
            options={[
              { value: 'All', label: 'All' },
              { value: 'A', label: 'A' },
              { value: 'B', label: 'B' },
              { value: 'C', label: 'C' },
              { value: 'D', label: 'D' },
            ]}
          />
          <DropdownSelect
            label="Branch"
            value={branchFilter}
            onChange={(val: any) => { setBranchFilter(val); setPage(1); }}
            options={[
              { value: 'All', label: 'All' },
              { value: 'CS', label: 'CS' },
              { value: 'CSE', label: 'CSE' },
              { value: 'IT', label: 'IT' },
              { value: 'ECE', label: 'ECE' },
              { value: 'ME', label: 'ME' },
              { value: 'CE', label: 'CE' },
            ]}
          />
          <DropdownSelect
            label="Sort By"
            value={sortBy}
            onChange={(val: string) => { setSortBy(val); setOrder('desc'); setPage(1); }}
            options={SORT_OPTIONS.map(o => ({ value: o.key, label: o.label }))}
            accent
          />
        </div>
      </header>

      {/* ── Top-3 Highlight Section ── */}
      {(isLoading || topThree.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[98%] mx-auto w-full px-6">
          {isLoading ? (
            <>
              <HighlightCardSkeleton />
              <HighlightCardSkeleton />
              <HighlightCardSkeleton />
            </>
          ) : (
            <>
              {topThree[0] && <HighlightCard student={topThree[0]} rank={1} color="#FFD700" />}
              {topThree[1] && <HighlightCard student={topThree[1]} rank={2} color="#94a3b8" />}
              {topThree[2] && <HighlightCard student={topThree[2]} rank={3} color="#cd7f32" />}
            </>
          )}
        </section>
      )}

      {/* ── Main Table Area ── */}
      <div className="flex flex-col gap-4 max-w-[98%] mx-auto w-full px-2">

        {/* Search bar row */}
        <div className="flex items-center justify-end gap-3 px-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              type="text"
              placeholder="Search by name or Libid"
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-white text-[14px] focus:border-primary/40 outline-none transition-all placeholder:text-slate-600"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={() => refetch()}
            className="bg-white/[0.03] border border-white/5 text-slate-400 p-2.5 rounded-xl hover:border-primary/40 hover:text-primary transition-all"
            title="Refresh"
          >
            <RefreshCw className={isFetching ? 'animate-spin' : ''} size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.15em] font-black border-b border-white/[0.06] bg-white/[0.025] text-slate-500">
                  <th className="px-5 py-4 whitespace-nowrap">Rank</th>
                  <th className="px-5 py-4">Name</th>
                  <SortTh label="Total" sortKey="totalSolved" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} />
                  <th className="px-5 py-4 whitespace-nowrap">Year</th>
                  <th className="px-5 py-4">Branch</th>
                  <th className="px-5 py-4">Sec</th>
                  <th className="px-5 py-4 whitespace-nowrap">Roll No</th>
                  <SortTh
                    label={<div className="flex items-center gap-1.5"><img src={leetcodeIcon} className="w-4 h-4 object-contain" alt="LC" /><span className="text-slate-500">LeetCode</span></div>}
                    sortKey="leetcode" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                  <SortTh
                    label={<div className="flex items-center gap-1.5"><img src={codeforcesIcon} className="w-4 h-4 object-contain" alt="CF" /><span className="text-slate-500">Codeforces</span></div>}
                    sortKey="codeforces" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                  <SortTh
                    label={<div className="flex items-center gap-1.5"><img src={codechefIcon} className="w-4 h-4 object-contain opacity-80" alt="CC" /><span className="text-slate-500">CodeChef</span></div>}
                    sortKey="codechef" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                  <SortTh
                    label={<div className="flex items-center gap-1.5"><img src={gfgIcon} className="w-4 h-4 object-contain opacity-80" alt="GFG" /><span className="text-slate-500">GfG</span></div>}
                    sortKey="gfg" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                  <SortTh
                    label={<div className="flex items-center gap-1.5"><img src={githubIcon} className="w-4 h-4 object-contain opacity-80" alt="GH" /><span className="text-slate-500">GitHub</span></div>}
                    sortKey="github" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }}
                  />
                </tr>
              </thead>
              <tbody>
                {/* Pinned User Row */}
                {!isLoading && data?.userRank && (
                  <tr
                    onClick={() => navigate(`/profile/${data.userRank.student.id}`)}
                    className="group cursor-pointer transition-all duration-200 border-b-2 border-primary/30 bg-primary/[0.07] hover:bg-primary/[0.12]"
                  >
                    <td className="px-5 py-4 whitespace-nowrap relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                      <span className="text-[14px] font-black text-primary">#{data.userRank.rank}</span>
                      <span className="ml-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-wider">YOU</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-black text-[15px] text-white tracking-tight">{data.userRank.student.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[16px] font-black font-outfit text-primary">{data.userRank.student.totalSolved}</span>
                    </td>
                    <td className="px-5 py-4"><YearBadge year={data.userRank.student.year} /></td>
                    <td className="px-5 py-4">
                      <span className="text-[15px] font-medium text-slate-300">{(data.userRank.student.branch || '—').replace(/[\d\s]+[A-Z]$/i, '').trim() || data.userRank.student.branch || '—'}</span>
                    </td>
                    <td className="px-5 py-4"><SectionBadge section={data.userRank.student.section} /></td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[15px] text-slate-300 whitespace-nowrap tracking-tight">{data.userRank.student.rollNo || '—'}</span>
                    </td>
                    <td className="px-5 py-4"><PlatformCell value={data.userRank.student.leetcode.total} href={`https://leetcode.com/${data.userRank.student.leetcode.handle}`} color="#FFD700" active={sortBy === 'leetcode'} /></td>
                    <td className="px-5 py-4"><PlatformCell value={data.userRank.student.codeforces.rating} href={`https://codeforces.com/profile/${data.userRank.student.codeforces.handle}`} color="#339AF0" active={sortBy === 'codeforces'} suffix="pts" /></td>
                    <td className="px-5 py-4"><PlatformCell value={data.userRank.student.codechef.total} href={`https://www.codechef.com/users/${data.userRank.student.codechef.handle}`} color="#FF922B" active={sortBy === 'codechef'} /></td>
                    <td className="px-5 py-4"><PlatformCell value={data.userRank.student.gfg.total} href={`https://www.geeksforgeeks.org/user/${data.userRank.student.gfg.handle}/`} color="#51CF66" active={sortBy === 'gfg'} /></td>
                    <td className="px-5 py-4"><PlatformCell value={data.userRank.student.github.contributions} href={`https://github.com/${data.userRank.student.github.handle}`} color="#F8FAFC" active={sortBy === 'github'} /></td>
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
                        className={`group cursor-pointer transition-all duration-150 border-b border-white/[0.035] hover:bg-primary/[0.06] ${isEven ? 'bg-white/[0.01]' : ''}`}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-[14px] font-bold ${rank <= 3 ? 'text-primary' : 'text-slate-500'} group-hover:text-primary transition-colors`}>#{rank}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-bold text-[15px] text-slate-100 tracking-tight group-hover:text-white transition-colors">{student.name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[16px] font-black font-outfit ${sortBy === 'totalSolved' ? 'text-primary' : 'text-slate-100'}`}>
                            {student.totalSolved}
                          </span>
                        </td>
                        <td className="px-5 py-4"><YearBadge year={student.year} /></td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] font-medium text-slate-100">
                            {(student.branch || '—').replace(/[\d\s]+[A-Z]$/i, '').trim() || student.branch || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4"><SectionBadge section={student.section} /></td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-[15px] text-slate-100 whitespace-nowrap tracking-tight">{student.rollNo || '—'}</span>
                        </td>
                        <td className="px-5 py-4"><PlatformCell value={student.leetcode.total} href={`https://leetcode.com/${student.leetcode.handle}`} color="#FFD700" active={sortBy === 'leetcode'} /></td>
                        <td className="px-5 py-4"><PlatformCell value={student.codeforces.rating} href={`https://codeforces.com/profile/${student.codeforces.handle}`} color="#339AF0" active={sortBy === 'codeforces'} suffix="pts" /></td>
                        <td className="px-5 py-4"><PlatformCell value={student.codechef.total} href={`https://www.codechef.com/users/${student.codechef.handle}`} color="#FF922B" active={sortBy === 'codechef'} /></td>
                        <td className="px-5 py-4"><PlatformCell value={student.gfg.total} href={`https://www.geeksforgeeks.org/user/${student.gfg.handle}/`} color="#51CF66" active={sortBy === 'gfg'} /></td>
                        <td className="px-5 py-4"><PlatformCell value={student.github.contributions} href={`https://github.com/${student.github.handle}`} color="#F8FAFC" active={sortBy === 'github'} /></td>
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
