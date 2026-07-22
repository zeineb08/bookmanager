import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  FiBook,
  FiUsers,
  FiBookOpen,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { StatsCardSkeleton } from '../components/common/Skeleton';
import Spinner from '../components/common/Spinner';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const statsCards = [
    { title: 'Total Books', value: stats?.totalBooks || 0, icon: FiBook, color: 'bg-blue-500' },
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: FiUsers, color: 'bg-green-500' },
    { title: 'Active Borrowings', value: stats?.activeBorrowings || 0, icon: FiBookOpen, color: 'bg-amber-500' },
    { title: 'Returned Books', value: stats?.returnedBooks || 0, icon: FiCheckCircle, color: 'bg-teal-500' },
    { title: 'Late Returns', value: stats?.lateReturns || 0, icon: FiAlertTriangle, color: 'bg-red-500' },
  ];

  const categoryData = stats?.booksByCategory?.map((c) => ({
    name: c.category,
    value: c.count,
  })) || [];

  const mostBorrowedData = stats?.mostBorrowed?.map((b) => ({
    name: b.title?.length > 20 ? b.title.substring(0, 20) + '...' : b.title,
    count: b.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of library statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="text-white text-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Books by Category */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Books by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Most Borrowed Books */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Borrowed Books</h2>
          {mostBorrowedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mostBorrowedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
          {stats?.recentUsers?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <FiUsers className="text-primary-600 text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent users</p>
          )}
        </div>

        {/* Recent Borrowings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Borrowings</h2>
          {stats?.recentBorrowings?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentBorrowings.map((borrowing) => (
                <div key={borrowing._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <FiBookOpen className="text-amber-600 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {borrowing.bookId?.title || 'Unknown Book'}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {borrowing.userId?.name || 'Unknown User'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    borrowing.status === 'BORROWED' ? 'bg-amber-100 text-amber-700' :
                    borrowing.status === 'LATE' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {borrowing.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent borrowings</p>
          )}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-sm text-blue-600 font-medium">Monthly Borrowings</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{stats?.monthlyBorrowings || 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-sm text-green-600 font-medium">Monthly Returns</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{stats?.monthlyReturns || 0}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <p className="text-sm text-purple-600 font-medium">Active Now</p>
            <p className="text-3xl font-bold text-purple-700 mt-1">{stats?.activeBorrowings || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
