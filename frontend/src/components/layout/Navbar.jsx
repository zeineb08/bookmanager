import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiBell, FiUser, FiLogOut, FiBookOpen, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/authSlice';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Navbar({ onMenuClick, user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;
    // Load notifications from localStorage
    const saved = JSON.parse(localStorage.getItem(`notifications_${user._id}`) || '[]');
    setNotifications(saved);
    setUnreadCount(saved.filter(n => !n.read).length);
  }, [user?._id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addNotification = (type, message) => {
    const newNotif = {
      id: Date.now().toString(),
      type,
      message,
      time: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotif, ...notifications].slice(0, 50);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    if (user?._id) {
      localStorage.setItem(`notifications_${user._id}`, JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    if (user?._id) {
      localStorage.setItem(`notifications_${user._id}`, JSON.stringify(updated));
    }
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    if (user?._id) {
      localStorage.setItem(`notifications_${user._id}`, JSON.stringify(updated));
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    if (user?._id) {
      localStorage.removeItem(`notifications_${user._id}`);
    }
    setShowNotifications(false);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const getTimeAgo = (time) => {
    const seconds = Math.floor((new Date() - new Date(time)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Expose addNotification to the window so other components can use it
  window.addNotification = addNotification;

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <FiMenu className="text-2xl" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </h2>
            <p className="text-sm text-gray-500">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Library Member'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div className="flex items-center justify-between p-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notif.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'borrow' ? 'bg-green-100' :
                            notif.type === 'return' ? 'bg-blue-100' :
                            notif.type === 'late' ? 'bg-red-100' :
                            'bg-gray-100'
                          }`}>
                            <FiBookOpen className={`text-sm ${
                              notif.type === 'borrow' ? 'text-green-600' :
                              notif.type === 'return' ? 'text-blue-600' :
                              notif.type === 'late' ? 'text-red-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{getTimeAgo(notif.time)}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={clearNotifications}
                      className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
                    >
                      Clear all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
            >
              <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <FiChevronDown className="text-gray-400 text-sm hidden sm:block" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                    user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user?.role}
                  </span>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <FiUser className="text-gray-400" />
                    My Profile
                  </button>
                  {user?.role !== 'ADMIN' && (
                    <button
                      onClick={() => { navigate('/my-borrowings'); setShowUserMenu(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <FiBookOpen className="text-gray-400" />
                      My Borrowings
                    </button>
                  )}
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <FiSettings className="text-gray-400" />
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiLogOut className="text-red-400" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}