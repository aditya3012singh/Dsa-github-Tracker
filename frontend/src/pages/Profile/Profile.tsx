import { useParams } from 'react-router-dom';
import { useGetStudentQuery, useTriggerFetchMutation } from '../../store/apiSlice';
import { 
  Github, Code, LayoutGrid, Trophy, RefreshCw, 
  User as UserIcon, BookOpen, Star, Zap, ExternalLink 
} from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  const studentId = id || loggedInUser.id;
  const { data: studentData, isLoading } = useGetStudentQuery(studentId, { skip: !studentId });
  const [triggerFetch, { isLoading: isFetching }] = useTriggerFetchMutation();

  if (!token && !id) return <div className="p-20 text-center text-text-dim text-lg">Please login to view your profile.</div>;
  if (isLoading) return <div className="p-20 text-center text-text-dim text-lg flex items-center justify-center gap-3">
    <RefreshCw className="animate-spin text-primary" size={24} />
    Loading profile data...
  </div>;

  const student = studentData?.data;

  if (!student) return <div className="p-20 text-center text-error bg-error/10 border border-error/20 rounded-2xl m-8">Student data not found in leaderboard.</div>;

  return (
    <div className="flex flex-col gap-10 pb-16 animate-fade-in pt-[100px] px-6 max-w-[1400px] mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
        {/* Profile Card */}
        <section className="flex flex-col gap-6">
          <div className="glass-card p-12 text-center sticky top-[90px]">
            <div className="mb-6 relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_hsl(var(--primary-glow))]">
                <UserIcon size={48} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-outfit font-bold mb-1 text-white">{student.name}</h2>
            <p className="text-text-dim font-medium mb-8 text-sm uppercase tracking-wider">{student.rollNo}</p>
            
            <div className="flex flex-col gap-4 text-left mb-8">
              <DetailItem icon={<BookOpen size={18}/>} label="Branch" value={student.branch} />
              <DetailItem icon={<Star size={18}/>} label="Year" value={`${student.year}${getOrdinal(student.year)} Year`} />
            </div>

            {student.updatedAt && (
              <div className="flex items-center justify-center gap-2 mb-8 text-[11px] text-text-dim/60 font-mono">
                <Star size={10} />
                <span>Last updated {new Date(student.updatedAt).toLocaleString()}</span>
              </div>
            )}

            <button 
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl font-bold border transition-all ${
                isFetching ? 'bg-primary/20 border-primary/40 text-primary cursor-not-allowed' : 
                'bg-transparent border-primary text-primary hover:bg-primary hover:text-white cursor-pointer'
              }`}
              onClick={async () => {
                try {
                  await triggerFetch(student.id).unwrap();
                  alert('Sync started! Data will update in a few minutes.');
                } catch (err) {
                  console.error('Sync failed:', err);
                }
              }}
              disabled={isFetching}
            >
              <RefreshCw className={`${isFetching ? 'animate-spin' : ''}`} size={18} />
              <span>{isFetching ? 'Syncing...' : 'Sync All Stats'}</span>
            </button>
          </div>
        </section>

        {/* Stats Content */}
        <section className="flex flex-col gap-8">
          {/* Top Score Card */}
          <div className="glass-card p-10 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Total Questions Solved</span>
                <span className="text-7xl font-extrabold font-outfit text-white leading-none">
                  {student.totalSolved}
                </span>
              </div>
              <Zap size={64} className="text-primary drop-shadow-[0_0_20px_hsl(var(--primary-glow))]" />
            </div>
          </div>

          {/* Detailed Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PlatformCard 
              name="LeetCode" 
              icon={<img src="https://img.icons8.com/?size=100&id=9L16NypUzu38&format=png&color=FFFFFF" alt="LeetCode" className="w-8 h-8 object-contain" />} 
              color="#FFA116"
              handle={student.leetcode.handle}
              stats={[
                { label: 'Total Solved', value: student.leetcode.total },
                { label: 'Easy', value: student.leetcode.easy },
                { label: 'Medium', value: student.leetcode.medium },
                { label: 'Hard', value: student.leetcode.hard },
              ]}
            />
            <PlatformCard 
              name="GitHub" 
              icon={<img src="https://img.icons8.com/?size=100&id=efFfwotdkiU5&format=png&color=FFFFFF" alt="GitHub" className="w-8 h-8 object-contain" />} 
              color="#eaebed"
              handle={student.github.handle}
              stats={[
                { label: 'Contributions', value: student.github.contributions },
                { label: 'Repositories', value: student.github.repositories || 0 },
                { label: 'Followers', value: student.github.followers || 0 },
                { label: 'Following', value: student.github.following || 0 },
              ]}
            />
            <PlatformCard 
              name="Codeforces" 
              icon={<img src="https://img.icons8.com/?size=100&id=jldAN67IAsrW&format=png&color=FFFFFF" alt="Codeforces" className="w-8 h-8 object-contain" />} 
              color="#1890ff"
              handle={student.codeforces.handle}
              stats={[
                { label: 'Rating', value: student.codeforces.rating },
                { label: 'Max Rating', value: student.codeforces.maxRating },
              ]}
            />
            <PlatformCard 
              name="CodeChef" 
              icon={<img src="https://img.icons8.com/?size=100&id=4z2zrIWYmGqx&format=png&color=FFFFFF" alt="CodeChef" className="w-8 h-8 object-contain" />} 
              color="#CD7F32"
              handle={student.codechef.handle}
              stats={[
                { label: 'Rating', value: student.codechef.rating },
                { label: 'Solved', value: student.codechef.total },
              ]}
            />
            <PlatformCard 
              name="GfG" 
              icon={<img src="https://img.icons8.com/?size=100&id=AbQBhN9v62Ob&format=png&color=FFFFFF" alt="GfG" className="w-8 h-8 object-contain" />} 
              color="#00ff00"
              handle={student.gfg.handle}
              stats={[
                { label: 'Total Solved', value: student.gfg.total },
              ]}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-4">
    <span className="text-primary">{icon}</span>
    <div className="flex flex-col">
      <span className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">{label}</span>
      <span className="font-bold text-sm text-white">{value}</span>
    </div>
  </div>
);

const PlatformCard = ({ name, icon, color, stats, handle }: any) => {
  const getUrl = () => {
    if (!handle) return '#';
    switch (name) {
      case 'LeetCode': return `https://leetcode.com/${handle}`;
      case 'GitHub': return `https://github.com/${handle}`;
      case 'Codeforces': return `https://codeforces.com/profile/${handle}`;
      case 'CodeChef': return `https://www.codechef.com/users/${handle}`;
      case 'GfG': return `https://www.geeksforgeeks.org/user/${handle}/`;
      default: return '#';
    }
  };

  return (
    <a 
      href={getUrl()} 
      target="_blank" 
      rel="noreferrer"
      className="relative glass-card p-10 flex flex-col gap-8 hover:border-white/20 transition-all group no-underline overflow-hidden"
    >
      {/* Background Glow */}
      <div 
        className="absolute -right-8 -top-8 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full"
        style={{ background: color }}
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5 group-hover:border-white/10 transition-colors"
            style={{ color }}
          >
            {icon}
          </div>
          <div className="flex flex-col">
            <h3 className="text-xl font-outfit font-bold text-white tracking-tight">{name}</h3>
            <span className="text-[11px] text-text-dim font-mono">@{handle || 'not-linked'}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center text-text-dim group-hover:text-white group-hover:bg-white/10 transition-all">
          <ExternalLink size={18} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-6 gap-x-8 relative z-10">
        {stats.map((s: any, i: number) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] text-text-dim/60 uppercase tracking-[0.2em] font-bold mb-1">{s.label}</span>
            <span className="text-2xl font-black font-outfit text-slate-100 group-hover:text-white transition-colors">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </a>
  );
};

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

export default Profile;
