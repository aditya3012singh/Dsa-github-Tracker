import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';

interface RankHistoryEntry {
    rank: number;
    score: number;
    createdAt: string;
}

interface RankEvolutionChartProps {
    data: RankHistoryEntry[];
}

const RankEvolutionChart: React.FC<RankEvolutionChartProps> = ({ data }) => {
    if (!data || data.length < 2) {
        return (
            <div className="glass-card p-8 bg-black/30 border-white/[0.05] flex items-center justify-center text-slate-500 text-sm italic">
                Not enough historical data to show progress chart yet. Check back tomorrow!
            </div>
        );
    }

    // Format data for the chart
    const formattedData = data.map(entry => ({
        displayDate: new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rank: entry.rank,
        score: entry.score
    }));

    // Find min/max for Y axis padding
    const ranks = data.map(d => d.rank);
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);

    // Padding for the chart (Inverted Y-axis)
    const yDomain = [Math.max(1, minRank - 5), maxRank + 5];

    return (
        <div className="glass-card p-6 bg-black/30 border-white/[0.05] h-[350px] w-full relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex flex-col">
                    <h3 className="text-lg font-outfit font-bold text-white tracking-tight">Rank Evolution</h3>
                    <span className="text-[10px] text-text-dim uppercase tracking-widest font-black">Daily snapshots over the last 30 days</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Rank</span>
                    </div>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData}>
                        <defs>
                            <linearGradient id="colorRank" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                            dy={15}
                        />
                        <YAxis
                            reversed={true} // Rank 1 at the top
                            domain={yDomain}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                            width={35}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ color: '#3b82f6' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}
                            cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="rank"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRank)"
                            animationDuration={2000}
                            dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: '#0f172a' }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6', className: 'shadow-[0_0_15px_#3b82f6]' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RankEvolutionChart;
