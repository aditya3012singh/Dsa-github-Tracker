import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import logoImg from '../../assets/image.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const controlNavbar = () => {
    if (typeof window !== 'undefined') {
      if (window.scrollY > lastScrollY && window.scrollY > 80) {
        // Scrolling down
        setShow(false);
      } else {
        // Scrolling up
        setShow(true);
      }
      setLastScrollY(window.scrollY);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[1000] h-16 sm:h-[80px] flex items-center justify-between px-3 sm:px-6 lg:px-10 border-b transition-all duration-500 ${lastScrollY > 20
        ? 'bg-[#050810]/80 backdrop-blur-xl border-white/10 shadow-2xl'
        : 'bg-transparent border-transparent'
      } ${show ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 text-white no-underline group min-w-0">
          <div className="h-8 sm:h-12 w-auto bg-transparent rounded-lg flex items-center justify-center transition-all overflow-hidden py-0.5">
            <img src={logoImg} alt="Logo" className="h-full w-auto object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-outfit font-black text-sm sm:text-lg tracking-tight leading-none truncate">KIET DSA Tracker</span>
            <span className="hidden sm:block text-[10px] text-white uppercase tracking-widest font-bold truncate">DSA Performance Tracker</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* <NavLink to="/" icon={<LayoutGrid size={18} />} label="Leaderboard" /> */}

        {token ? (
          <>
            <NavLink to="/profile" icon={<User size={18} />} label={user.name || 'Profile'} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 text-error/70 hover:text-error hover:bg-error/5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </>
        ) : (
          <Link to="/login" className="bg-primary text-white no-underline px-4 sm:px-8 py-2 sm:py-2.5 rounded-full hover:bg-primary/80 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label }: any) => (
  <Link to={to} className="flex items-center gap-1 sm:gap-2 no-underline text-white hover:text-white hover:bg-white/5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider">
    {icon}
    <span className="hidden md:inline">{label}</span>
  </Link>
);

export default Navbar;
