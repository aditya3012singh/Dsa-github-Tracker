import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trophy, ChevronDown, Check, Linkedin } from 'lucide-react';
import { apiSlice } from '../../../store/apiSlice';

/* ── Custom Dropdown Component ── */
export const DropdownSelect = ({ label, value, onChange, options, accent = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((o: any) => o.value === value)?.label || 'Select...';

  return (
    <div className="flex flex-col gap-1.5 items-start" ref={dropdownRef}>
      <span className="text-[10px] uppercase font-black text-text-dim/60 ml-1 tracking-[0.1em]">{label}</span>
      <div className="relative group/sel w-[140px] md:w-[180px]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between text-left px-5 py-3 outline-none cursor-pointer text-[13px] font-bold transition-all border shadow-lg rounded-xl ${accent
            ? 'bg-primary/10 border-primary/30 text-primary hover:border-primary hover:bg-primary/20'
            : 'bg-white/[0.03] border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
            }`}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${accent ? 'text-primary' : 'text-text-dim'
              }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full mt-2 w-full bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
              {options.map((opt: any) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center justify-between group ${value === opt.value
                    ? 'bg-primary/20 text-primary'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  {opt.label}
                  {value === opt.value && <Check size={14} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const SortTh = ({ label, sortKey, sortBy, order, onSort, className = '' }: any) => {
  const active = sortBy === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-5 py-4 whitespace-nowrap cursor-pointer select-none transition-all text-[11px] uppercase tracking-[0.2em] font-black ${className} ${active ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
        }`}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {active && (
          <span className="text-[10px] opacity-80 bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center">
            {order === 'desc' ? '↓' : '↑'}
          </span>
        )}
      </div>
    </th>
  );
};

export const PlatformCell = React.memo(({ value, href, color, active, suffix = '' }: any) => {
  const isZero = !value || value === 0;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-center gap-1 no-underline transition-all rounded-full px-4 py-1.5 min-w-[3.5rem] mt-1 ${active && !isZero
        ? 'font-black text-[15px] shadow-lg scale-110 z-10 relative'
        : 'font-bold text-[14px] hover:scale-110 hover:shadow-xl hover:z-10'
        }`}
      style={{
        color: isZero ? '#8b949e' : color,
        backgroundColor: isZero ? 'rgba(255,255,255,0.03)' : `${color}20`,
        boxShadow: active && !isZero ? `0 4px 15px ${color}25` : 'none',
        border: `1px solid ${isZero ? 'transparent' : `${color}30`}`
      }}
    >
      <span>
        {value ?? 0}
      </span>
      {suffix && <span className="text-[9px] font-black opacity-80 uppercase ml-0.5 tracking-wider">{suffix}</span>}
    </a>
  );
});

/* Badge Components */
export const YearBadge = React.memo(({ year }: { year: number | null }) =>
  year ? (
    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
      Year {year}
    </span>
  ) : <span className="text-slate-600">—</span>
);

export const SectionBadge = React.memo(({ section }: { section: string | null }) =>
  section ? (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-black bg-white/[0.06] text-slate-200 border border-white/10">
      {section}
    </span>
  ) : <span className="text-slate-600">—</span>
);

/* Micro-Interactions: Magnetic Hover Wrapper */
const Magnetic = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -5 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  >
    {children}
  </motion.div>
);


/* Table Cell Widths (shared across header and rows) */
export const COL_WIDTHS = {
  rank: 'w-[60px] md:w-[80px]',
  student: 'w-[180px] md:w-[350px]',
  total: 'w-[80px] md:w-[100px]',
  year: 'w-[80px] md:w-[100px]',
  branch: 'w-[130px] md:w-[180px]',
  sec: 'w-[60px] md:w-[80px]',
  id: 'w-[100px] md:w-[120px]',
  platform: 'w-[100px] md:w-[120px]'
};
export const LeaderboardRow = React.memo(({ student, rank, index, navigate, sortBy, isPinned }: any) => {
  // const prefetchProfile = apiSlice.usePrefetch('getStudent');
  const isEven = index % 2 === 0;


  const isRecentUpdate = useMemo(() => {
    if (!student.updatedAt) return false;
    const updated = new Date(student.updatedAt).getTime();
    const now = new Date().getTime();
    return (now - updated) < 5 * 60 * 1000; // 5 minutes
  }, [student.updatedAt]);

  return (
    <tr
      onClick={() => navigate(`/profile/${student.id}`)}
      // onMouseEnter={() => prefetchProfile(student.id)}
      className={`group cursor-pointer transition-all duration-150 border-b border-white/[0.035] ${isPinned ? 'border-b-2 border-primary/30 bg-primary/[0.1] backdrop-blur-md sticky top-0 z-30' : `hover:bg-primary/[0.06] ${isEven ? 'bg-white/[0.01]' : ''}`}`}
    >
      <td className={`px-4 py-3 md:px-5 md:py-4 whitespace-nowrap ${COL_WIDTHS.rank} relative`}>
        <div className="flex items-center gap-3">
          <span className={`text-[13px] font-bold ${rank <= 3 ? 'text-primary' : 'text-slate-400'}`}>
            #{rank}
          </span>
          {student.rankChange !== 0 && (
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${student.rankChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {student.rankChange > 0 ? '▲' : '▼'}{Math.abs(student.rankChange)}
            </span>
          )}
          {rank <= 3 && <Trophy size={14} className="text-primary opacity-60" />}
        </div>
      </td>
      <td className={`px-4 py-3 md:px-5 md:py-4 whitespace-nowrap ${COL_WIDTHS.student}`}>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="text-[13px] md:text-[14px] font-bold text-white group-hover:text-primary transition-colors">
              {student.name}
            </span>
            {isRecentUpdate && (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
            )}
            {student.linkedIn && (
              <a
                href={student.linkedIn}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="LinkedIn Profile"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0A66C2] hover:text-[#0A66C2]/80 flex-shrink-0"
              >
                <Linkedin size={13} />
              </a>
            )}
          </div>
          <span className="text-[9px] md:text-[10px] text-slate-500 font-medium tracking-wider">
            {student.libraryId}
          </span>
        </div>
      </td>
      <td className={`px-4 py-3 md:px-5 md:py-4 text-center ${COL_WIDTHS.total}`}>
        <span className={`text-[15px] md:text-[16px] font-black font-outfit ${sortBy === 'totalSolved' ? 'text-primary' : 'text-slate-100'}`}>
          {student.totalSolved}
        </span>
      </td>
      <td className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.year}`}><YearBadge year={student.year} /></td>
      <td className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.branch}`}>
        <span className="text-[12px] md:text-[13px] font-medium text-slate-400">
          {(student.branch || '—').replace(/[\d\s]+[A-Z]$/i, '').trim() || student.branch || '—'}
        </span>
      </td>
      <td className={`px-4 py-3 md:px-5 md:py-4 text-center ${COL_WIDTHS.sec}`}><SectionBadge section={student.section} /></td>
      <td className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.id}`}>
        <span className="font-mono text-[12px] md:text-[13px] text-slate-500 whitespace-nowrap tracking-tight">{student.libraryId || '—'}</span>
      </td>
      <td className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.platform}`}><PlatformCell value={student.leetcode.total} href={`https://leetcode.com/${student.leetcode.handle}`} color="#FFD700" active={sortBy === 'leetcode'} /></td>
      <td className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.platform}`}><PlatformCell value={student.codeforces.rating} href={`https://codeforces.com/profile/${student.codeforces.handle}`} color="#339AF0" active={sortBy === 'codeforces'} suffix="pts" /></td>
      <td className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.platform}`}><PlatformCell value={student.codechef.total} href={`https://www.codechef.com/users/${student.codechef.handle}`} color="#FF922B" active={sortBy === 'codechef'} /></td>
      <td className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.platform}`}><PlatformCell value={student.gfg.total} href={`https://www.geeksforgeeks.org/user/${student.gfg.handle}/`} color="#51CF66" active={sortBy === 'gfg'} /></td>
      <td className={`px-4 py-3 md:px-5 md:py-4 ${COL_WIDTHS.platform}`}><PlatformCell value={student.github.contributions} href={`https://github.com/${student.github.handle}`} color="#F8FAFC" active={sortBy === 'github'} /></td>
    </tr>
  );
});

export const HighlightCard = ({ student, rank, color, label }: any) => {
  const navigate = useNavigate();
  const section = student.section || '—';
  const yearSection = student.year ? `${student.year} - ${section}` : '—';

  return (
    <Magnetic>
      <div
        onClick={() => navigate(`/profile/${student.id}`)}
        className="relative h-full glass-card p-5 md:p-8 flex flex-col justify-between gap-6 md:gap-8 cursor-pointer group overflow-hidden"
        style={{ borderColor: `${color}30` }}
      >
        {/* Dynamic Background Glow */}
        <div
          className="absolute -right-10 -top-10 w-32 h-32 md:w-40 md:h-40 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full"
          style={{ background: color }}
        />

        {/* Header Row: Name & Badge */}
        <div className="flex items-center justify-between relative z-10 mb-1">
          <div className="flex flex-col gap-0.5">
            {label && <span className="text-[9px] uppercase font-black text-primary tracking-widest mb-0.5">{label}</span>}
            <h3 className="text-lg md:text-xl font-black font-outfit text-white tracking-tight group-hover:text-primary transition-colors duration-300">
              {student.name}
            </h3>
          </div>
          <div
            className="w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 shadow-xl relative group-hover:scale-110 transition-transform duration-500"
            style={{ boxShadow: `0 0 25px ${color}20` }}
          >
            <Trophy size={20} style={{ color }} className='md:hidden relative z-10 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]' />
            <Trophy size={28} style={{ color }} className='hidden md:block relative z-10 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]' />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-50" />
          </div>
        </div>

        {/* Data Row: 4 Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 relative z-10">
          <DataBox label="Rank" value={rank} />
          <DataBox label="Total" value={student.totalSolved} />
          <DataBox label="Rating" value={student.score?.toFixed(0) || 0} />
          <DataBox label="Yr-Sec" value={yearSection} />
        </div>
      </div>
    </Magnetic>
  );
};

export const HighlightCardSkeleton = () => (
  <div className="relative bg-white/[0.02] border border-white/5 rounded-[32px] p-8 flex flex-col gap-8 overflow-hidden shimmer">
    <div className="flex items-center justify-between relative z-10 mb-2">
      <div className="h-7 w-40 rounded-lg bg-white/5" />
      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10" />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 relative z-10">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="bg-white/5 border border-white/[0.04] rounded-[20px] py-6 px-2 flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-14 rounded bg-white/10" />
          <div className="h-7 w-16 rounded bg-white/10" />
        </div>
      ))}
    </div>
  </div>
);

export const DataBox = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl md:rounded-[20px] py-4 md:py-6 px-1 md:px-2 flex flex-col items-center justify-center gap-1 group-hover:border-white/10 transition-colors">
    <span className="text-[10px] md:text-[12px] text-text-dim/70 uppercase tracking-[0.1em] md:tracking-[0.15em] font-black">{label}</span>
    <span className="text-xl md:text-2xl font-black font-outfit text-white tracking-tight">{value}</span>
  </div>
);

export const Pagination = ({ page, total, limit, setPage }: any) => (
  <footer className="flex justify-center items-center gap-6 py-8">
    <button
      disabled={page === 1}
      onClick={() => setPage((p: number) => p - 1)}
      className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-primary hover:bg-primary/10 disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
    >
      <ChevronLeft size={20} />
    </button>
    <span className="text-text-dim text-sm font-bold uppercase tracking-widest bg-white/[0.03] px-6 py-2.5 rounded-full border border-white/5">
      Page {page} <span className="mx-2 opacity-30">/</span> {Math.max(1, Math.ceil(total / limit))}
    </span>
    <button
      disabled={page * limit >= total}
      onClick={() => setPage((p: number) => p + 1)}
      className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-primary hover:bg-primary/10 disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
    >
      <ChevronRight size={20} />
    </button>
  </footer>
);

export const SkeletonRow = () => (
  <tr className="shimmer">
    {[...Array(12)].map((_, i) => (
      <td key={i} className="px-5 py-6 border-b border-white/[0.04]">
        <div className="h-4 bg-white/5 rounded w-full max-w-[80px]" />
      </td>
    ))}
  </tr>
);
