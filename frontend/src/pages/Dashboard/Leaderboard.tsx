import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLeaderboardQuery, useSyncAllMutation, useGetOnlineStudentsQuery } from '../../store/apiSlice';
import { Search, RefreshCw, Zap, CheckCircle } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  DropdownSelect,
  SortTh,
  PlatformCell,
  HighlightCard,
  HighlightCardSkeleton,
  Pagination,
  SkeletonRow,
  LeaderboardRow,
  YearBadge,
  SectionBadge,
  COL_WIDTHS
} from './components/LeaderboardComponents';
import { BRANCHES } from '../../constants/branches';

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
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const limit = 100; // Optimal for virtualization

  const parentRef = useRef<HTMLDivElement>(null);

const { data, isLoading, isFetching, error, refetch } =
  useGetLeaderboardQuery({
    page,
    limit,
    search: debouncedSearch,
    sortBy,
    order,
    year: yearFilter,
    section: sectionFilter,
    branch: branchFilter,
  });

const {
  data: onlineData,
  isLoading: isOnlineLoading,
  isFetching: isOnlineFetching,
} = useGetOnlineStudentsQuery(undefined, {
  skip: !showOnlineOnly,
});

// Only fetch Top 3 separately when we're NOT already on page 1
const isOnPageOne = page === 1 && !showOnlineOnly;

const {
  data: topThreeData,
  isLoading: isTopThreeLoading,
} = useGetLeaderboardQuery(
  {
    page: 1,
    limit: 3,
    search: debouncedSearch,
    sortBy,
    order,
    year: yearFilter,
    section: sectionFilter,
    branch: branchFilter,
  },
  {
    skip: isOnPageOne,
  }
);

  const [syncAll, { isLoading: isSyncing }] = useSyncAllMutation();
  const [syncDone, setSyncDone] = useState(false);

  const handleSyncAll = async () => {
    try {
      await syncAll(undefined).unwrap();
      setSyncDone(true);
      setTimeout(() => { setSyncDone(false); refetch(); }, 3000);
    } catch (e) {
      console.error('[sync-all] failed', e);
    }
  };

  const rawStudents = useMemo(() => {
    return showOnlineOnly ? (onlineData?.data || []) : (data?.data || []);
  }, [showOnlineOnly, onlineData, data]);

  const students = useMemo(() => {
    if (!showOnlineOnly) return rawStudents;

    let filtered = [...rawStudents];
    if (debouncedSearch) {
      filtered = filtered.filter((s: any) =>
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    if (yearFilter !== 'All') {
      filtered = filtered.filter((s: any) => s.year === parseInt(yearFilter));
    }

    if (sectionFilter !== 'All') {
      filtered = filtered.filter((s: any) => s.section?.toUpperCase() === sectionFilter.toUpperCase());
    }

    if (branchFilter !== 'All') {
      filtered = filtered.filter((s: any) => s.branch?.toLowerCase().includes(branchFilter.toLowerCase()));
    }

    filtered.sort((a: any, b: any) => {
      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case 'leetcode':
          valA = a.leetcode?.total || 0;
          valB = b.leetcode?.total || 0;
          break;
        case 'codeforces':
          valA = a.codeforces?.rating || 0;
          valB = b.codeforces?.rating || 0;
          break;
        case 'codechef':
          valA = a.codechef?.rating || 0;
          valB = b.codechef?.rating || 0;
          break;
        case 'gfg':
          valA = a.gfg?.total || 0;
          valB = b.gfg?.total || 0;
          break;
        case 'github':
          valA = a.github?.contributions || 0;
          valB = b.github?.contributions || 0;
          break;
        case 'totalSolved':
        default:
          valA = a.totalSolved || 0;
          valB = b.totalSolved || 0;
      }

      return order === 'desc' ? valB - valA : valA - valB;
    });

    return filtered;
  }, [showOnlineOnly, rawStudents, debouncedSearch, yearFilter, sectionFilter, branchFilter, sortBy, order]);

  const topThree = useMemo(() => {
    if (isOnPageOne) {
      return data?.data?.slice(0, 3) || [];
    }

    return topThreeData?.data || [];
  }, [isOnPageOne, data, topThreeData]);


  const virtualizer = useVirtualizer({
    count: students.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();

  if (error) return (
    <div className="flex items-center justify-center p-12 text-red-400 bg-red-400/10 border border-red-400/20 rounded-2xl mt-32 mx-8">
      Oops! Something went wrong while loading the leaderboard.
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-8 animate-fade-in pt-[100px]">
      {/* ── Page Header + Filters ── */}
      <header className="flex flex-col items-center gap-5 text-center px-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1 max-w-full">
          <h1 className="text-[1.8rem] md:text-[2.5rem] font-black font-outfit text-white leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            Leaderboard<span className="text-primary">.</span>
          </h1>
          <p className="text-[10px] md:text-sm text-text-dim uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold mt-1 px-2">
            KIET Deemed to be University — DSA Rankings
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full px-2">
          <DropdownSelect label="Year" value={yearFilter} onChange={(v: string) => { setYearFilter(v); setPage(1); }} options={[{ value: 'All', label: 'All' }, { value: '1', label: '1st Yr' }, { value: '2', label: '2nd Yr' }, { value: '3', label: '3rd Yr' }, { value: '4', label: '4th Yr' }]} />
          <DropdownSelect label="Sec" value={sectionFilter} onChange={(v: any) => { setSectionFilter(v); setPage(1); }} options={['All', 'A', 'B', 'C', 'D', 'E'].map(s => ({ value: s, label: s }))} />
          <DropdownSelect label="Branch" value={branchFilter} onChange={(v: any) => { setBranchFilter(v); setPage(1); }} options={[{ value: 'All', label: 'All' }, ...BRANCHES.map(b => ({ value: b, label: b }))]} />
          <DropdownSelect label="Sort" value={sortBy} onChange={(v: string) => { setSortBy(v); setOrder('desc'); setPage(1); }} options={SORT_OPTIONS.map(o => ({ value: o.key, label: o.label }))} accent />
        </div>
      </header>

      {/* ── Top-3 Highlight Leaders ── */}
      {(isTopThreeLoading || topThree.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[98%] mx-auto w-full px-6 mb-8">
          {isTopThreeLoading ? (
            [...Array(3)].map((_, i: number) => <HighlightCardSkeleton key={i} />)
          ) : (
            topThree.map((s: any, i: number) => (
              <HighlightCard
                key={s.id}
                student={s}
                rank={i + 1}
                color={i === 0 ? '#FFD700' : i === 1 ? '#94a3b8' : '#cd7f32'}
                label={i === 0 ? 'Leader' : i === 1 ? 'Runner Up' : 'Third Place'}
              />
            ))
          )}
        </section>
      )}

      {/* ── Main List Area ── */}
      <div className="flex flex-col gap-4 max-w-[98%] mx-auto w-full px-2">
        <div className="flex items-center justify-end gap-2 md:gap-3 px-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 md:py-2.5 pl-10 md:pl-11 pr-4 text-white text-[13px] md:text-[14px] focus:border-primary/40 outline-none transition-all placeholder:text-slate-600"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowOnlineOnly(!showOnlineOnly); setPage(1); }}
            className={`p-2 md:p-2.5 rounded-xl border transition-all flex items-center gap-2 text-[12px] font-semibold ${showOnlineOnly ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/[0.03] border-white/5 text-slate-400 hover:border-primary/40 hover:text-primary'}`}
            title="Toggle Online Users"
          >
            <span className={`w-2 h-2 rounded-full ${showOnlineOnly ? 'bg-primary animate-pulse' : 'bg-slate-600'}`} />
            <span className="hidden sm:inline">Online Only</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleSyncAll} disabled={isSyncing}
            className={`p-2 md:p-2.5 rounded-xl border transition-all flex items-center gap-2 ${syncDone ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/[0.03] border-white/5 text-slate-400 hover:border-primary/40 hover:text-primary'}`}
          >
            {syncDone ? <CheckCircle size={17} /> : isSyncing ? <Zap className="animate-pulse" size={17} /> : <RefreshCw className={(showOnlineOnly ? isOnlineFetching : isFetching) ? 'animate-spin' : ''} size={17} />}
          </motion.button>
        </div>

        <div className="glass-card rounded-2xl border border-white/[0.06] bg-black/40 overflow-hidden relative">
          {/* ── Unified Master Scroll Container (Handles both X and Y) ── */}
          <div
            ref={parentRef}
            className="overflow-auto max-h-[750px] scrollbar-hide relative w-full group/table select-none"
          >
            <div className="min-w-[1200px] md:min-w-full relative flex flex-col">

              {/* 1. Sticky Header + Pinned User Row */}
              <div className="sticky top-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
                <table className="w-full border-collapse text-left text-sm table-fixed border-spacing-0">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.15em] font-black bg-white/[0.025] text-slate-500">
                      <th className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.rank}`}>Rank</th>
                      <th className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.student}`}>Student</th>
                      <SortTh label="Total" sortKey="totalSolved" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} className={`${COL_WIDTHS.total} text-center justify-center`} />
                      <th className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.year}`}>Year</th>
                      <th className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.branch}`}>Branch</th>
                      <th className={`px-4 py-3 md:px-5 md:py-4 text-center ${COL_WIDTHS.sec}`}>Sec</th>
                      <th className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.id}`}>ID</th>
                      <SortTh label="LeetCode" sortKey="leetcode" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} className={COL_WIDTHS.platform} />
                      <SortTh label="Codeforces" sortKey="codeforces" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} className={COL_WIDTHS.platform} />
                      <SortTh label="CodeChef" sortKey="codechef" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} className={COL_WIDTHS.platform} />
                      <SortTh label="GfG" sortKey="gfg" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} className={COL_WIDTHS.platform} />
                      <SortTh label="GitHub" sortKey="github" sortBy={sortBy} order={order} onSort={(k: any) => { setSortBy(k); setOrder('desc'); }} className={COL_WIDTHS.platform} />
                    </tr>
                  </thead>
                  {data?.userRank && (
                    <tbody className="border-b-2 border-primary/30">
                      <LeaderboardRow
                        student={data.userRank.student}
                        rank={data.userRank.rank}
                        navigate={navigate}
                        sortBy={sortBy}
                        isPinned={true}
                      />
                    </tbody>
                  )}
                </table>
              </div>

              <div className="relative z-10 w-full">
                {(showOnlineOnly ? isOnlineLoading : isLoading) ? (
                  <div className="p-4 flex flex-col gap-2 w-full">{[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : (
                  <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
                    {virtualItems.map((virtualItem) => (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="border-b border-white/[0.035]"
                      >
                        <table className="w-full border-collapse text-left text-sm table-fixed border-spacing-0">
                          <tbody>
                            <LeaderboardRow
                              student={students[virtualItem.index]}
                              rank={(page - 1) * limit + virtualItem.index + 1}
                              index={virtualItem.index}
                              navigate={navigate}
                              sortBy={sortBy}
                            />
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Horizontal Scroll Hint Fade Gradient (Appears on master scroll) */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0c] to-transparent pointer-events-none md:hidden z-50 rounded-r-2xl" />
        </div>

        {!showOnlineOnly && (
          <Pagination page={page} total={data?.total || 0} limit={limit} setPage={setPage} />
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
