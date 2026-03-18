import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import logoImg from '../../assets/image.png';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] h-[80px] flex items-center justify-between px-10 bg-[#050810]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-3 text-white no-underline group">
          <div className="h-12 w-auto bg-transparent rounded-lg flex items-center justify-center transition-all overflow-hidden py-0.5">
            <img src={logoImg} alt="Logo" className="h-full w-auto object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-outfit font-black text-lg tracking-tight leading-none">KIET Deemed to be University</span>
            <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold">DSA Performance Tracker</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* <NavLink to="/" icon={<LayoutGrid size={18} />} label="Leaderboard" /> */}
        
        {token ? (
          <>
            <NavLink to="/profile" icon={<User size={18} />} label={user.name || 'Profile'} />
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 text-error/70 hover:text-error hover:bg-error/5 px-4 py-2.5 rounded-full transition-all text-xs font-bold uppercase tracking-wider"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </>
        ) : (
          <Link to="/login" className="bg-primary text-white no-underline px-8 py-2.5 rounded-full hover:bg-primary/80 transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label }: any) => (
  <Link to={to} className="flex items-center gap-2 no-underline text-text-dim hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-full transition-all text-xs font-bold uppercase tracking-wider">
    {icon}
    <span className="hidden md:inline">{label}</span>
  </Link>
);

export default Navbar;
