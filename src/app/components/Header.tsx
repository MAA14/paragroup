import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import svgPathsParadose from '../../imports/Header-1/svg-yvvrobp1t5';
import svgPathsParasoes from '../../imports/Header-2/svg-qlzkjys9tb';
import { LayoutDashboard, ShoppingCart, Package, FileText, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logout berhasil!');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, type: 'icon' },
    { path: '/paradose', label: 'Paradose', type: 'logo', logo: 'paradose' },
    { path: '/parasoes', label: 'Parasoes', type: 'logo', logo: 'parasoes' },
    { path: '/pos', label: 'POS', icon: ShoppingCart, type: 'icon' },
    { path: '/products', label: 'Products', icon: Package, type: 'icon' },
    { path: '/reports', label: 'Reports', icon: FileText, type: 'icon' },
  ];

  return (
    <header className="bg-[#f1f1f1] border-b border-[#e5e7eb]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <span className="font-bold text-[#101828] text-[24px]" style={{ fontFamily: 'DM Sans, sans-serif' }}>Inventory System</span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="flex gap-1">
              {navItems.map(({ path, label, icon: Icon, type, logo }) => (
                <Link
                  key={path}
                  to={path}
                  className={`h-10 px-4 rounded-lg flex items-center justify-center transition-colors ${
                    location.pathname === path
                      ? 'bg-[#101828] text-white'
                      : 'text-[#4a5565] hover:bg-gray-200'
                  }`}
                >
                  {type === 'logo' && logo === 'paradose' ? (
                    <div className="h-[22px] w-[59px]">
                      <svg className="size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 58.4609 21.1898">
                        <g>
                          <path d={svgPathsParadose.p28a018f0} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p8d2bd00} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p18bc3d80} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p2a4e8600} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p33538d80} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p8a17000} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p3f459a00} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p1bd87480} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p15a4b200} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParadose.p19981a80} fill={location.pathname === path ? "white" : "#4A5565"} />
                        </g>
                      </svg>
                    </div>
                  ) : type === 'logo' && logo === 'parasoes' ? (
                    <div className="h-[17px] w-[97px]">
                      <svg className="size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 97 16.7845">
                        <g>
                          <path d={svgPathsParasoes.pf065700} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParasoes.p74f2000} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParasoes.p2a934e80} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParasoes.p1d3dd200} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParasoes.p70a2a00} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParasoes.p23eb2ef0} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParasoes.p36298cf2} fill={location.pathname === path ? "white" : "#4A5565"} />
                          <path d={svgPathsParasoes.p64c2400} fill={location.pathname === path ? "white" : "#4A5565"} />
                        </g>
                      </svg>
                    </div>
                  ) : (
                    <>
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="hidden sm:inline ml-2 font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
                    </>
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3 border-l pl-4 border-gray-300">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{userProfile?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline" style={{ fontFamily: 'DM Sans, sans-serif' }}>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
