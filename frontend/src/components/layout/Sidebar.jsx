import { NavLink } from 'react-router-dom';
import { FiBook, FiGrid, FiUsers, FiUser, FiBarChart2, FiLogOut, FiBookOpen, FiLayers } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';

const memberLinks = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/books', icon: FiBook, label: 'Browse Books' },
  { to: '/my-borrowings', icon: FiBookOpen, label: 'My Borrowings' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', icon: FiBarChart2, label: 'Admin Dashboard' },
  { to: '/admin/books', icon: FiLayers, label: 'Manage Books' },
  { to: '/admin/users', icon: FiUsers, label: 'Manage Users' },
  { to: '/admin/borrowings', icon: FiBookOpen, label: 'Borrowings' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

export default function Sidebar({ isOpen, onClose, userRole }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const links = userRole === 'ADMIN' ? adminLinks : memberLinks;

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-full w-64 bg-dark-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-700">
        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <FiBook className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-xl font-bold">BookManager</h1>
          <p className="text-xs text-gray-400">Library System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <link.icon className="text-lg" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left text-gray-400 hover:text-red-400 hover:bg-gray-800"
        >
          <FiLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
