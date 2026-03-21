import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trophy, ChevronDown, Check } from 'lucide-react';

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
      <div className="relative group/sel w-[160px] md:w-[180px]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between text-left px-5 py-3 outline-none cursor-pointer text-[13px] font-bold transition-all border shadow-lg rounded-xl ${
            accent
              ? 'bg-primary/10 border-primary/30 text-primary hover:border-primary hover:bg-primary/20'
              : 'bg-white/[0.03] border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
          }`}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
              accent ? 'text-primary' : 'text-text-dim'
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
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center justify-between group ${
                    value === opt.value
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

export const SortTh = ({ label, sortKey, sortBy, order, onSort }: any) => {
  const active = sortBy === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-6 py-5 whitespace-nowrap cursor-pointer select-none transition-all text-[11px] uppercase tracking-[0.2em] font-black ${
        active ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
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

export const PlatformCell = ({ value, href, color, active, suffix = '' }: any) => {
  const isZero = !value || value === 0;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-center gap-1 no-underline transition-all rounded-full px-4 py-1.5 min-w-[3.5rem] mt-1 ${
        active && !isZero
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
};

export const HighlightCard = ({ student, rank, color }: any) => {
  const navigate = useNavigate();
  const section = student.section || '—';
  const yearSection = student.year ? `${student.year} - ${section}` : '—';

  return (
    <div
      onClick={() => navigate(`/profile/${student.id}`)}
      className="relative bg-black/30  border rounded-[32px] p-8 flex flex-col gap-8 cursor-pointer group hover:border-white/20 transition-all overflow-hidden shadow-2xl"
      style={{ borderColor: `${color}30` }}
    >
      {/* Dynamic Background Glow */}
      <div
        className="absolute -right-10 -top-10 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full"
        style={{ background: color }}
      />

      {/* Header Row: Name & Badge */}
      <div className="flex items-center justify-between relative z-10 mb-2">
        <h3 className="text-xl font-black font-outfit text-white tracking-tight group-hover:text-primary transition-colors duration-300">
          {student.name}
        </h3>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 shadow-xl relative group-hover:scale-110 transition-transform duration-500"
          style={{ boxShadow: `0 0 25px ${color}20` }}
        >
          <Trophy size={28} style={{ color }} className='relative z-10 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]'/>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-50" />
        </div>
      </div>

      {/* Data Row: 4 Boxes */}
      <div className="grid bg grid-cols-2 lg:grid-cols-4 gap-2.5 relative z-10">
        <DataBox label="Rank" value={rank} />
        <DataBox label="Total" value={student.totalSolved} />
        <DataBox label="Rating" value={student.score?.toFixed(0) || 0} />
        <DataBox label="Yr-Sec" value={yearSection} />
      </div>
    </div>
  );
};

export const HighlightCardSkeleton = () => (
  <div className="relative bg-black/30 border border-white/10 rounded-[32px] p-8 flex flex-col gap-8 overflow-hidden animate-pulse">
    <div className="flex items-center justify-between relative z-10 mb-2">
      <div className="h-7 w-40 rounded-lg bg-white/10" />
      <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10" />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 relative z-10">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="bg-black/20 border border-white/[0.04] rounded-[20px] py-6 px-2 flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-14 rounded bg-white/10" />
          <div className="h-7 w-16 rounded bg-white/10" />
        </div>
      ))}
    </div>
  </div>
);

export const DataBox = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-black/20 border border-white/[0.04] rounded-[20px] py-6 px-2 flex flex-col items-center justify-center gap-1.5 group-hover:border-white/10 transition-colors">
    <span className="text-[12px] text-text-dim/70 uppercase tracking-[0.15em] font-black">{label}</span>
    <span className="text-2xl font-black font-outfit text-white tracking-tight">{value}</span>
  </div>
);

export const Pagination = ({ page, total, limit, setPage }: any) => (
  <footer className="flex justify-center items-center gap-6 py-8">
    <button
      disabled={page === 1}
      onClick={() => setPage((p: number) => p - 1)}
      className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-white hover:border-primary hover:bg-primary/10 disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
    >
      <ChevronLeft size={20} />
    </button>
    <span className="text-text-dim text-sm font-bold uppercase tracking-widest">
      Page {page} <span className="mx-2 opacity-30">/</span> {Math.max(1, Math.ceil(total / limit))}
    </span>
    <button
      disabled={page * limit >= total}
      onClick={() => setPage((p: number) => p + 1)}
      className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-white hover:border-primary hover:bg-primary/10 disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
    >
      <ChevronRight size={20} />
    </button>
  </footer>
);

export const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(11)].map((_, i) => (
      <td key={i} className="px-5 py-6 border-b border-white/[0.04]">
        <div className="h-4 bg-white/5 rounded w-full max-w-[80px]" />
      </td>
    ))}
  </tr>
);
