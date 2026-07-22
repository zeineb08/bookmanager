import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiUsers, FiShield, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      toast.success('User role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success('User deleted');
        fetchUsers();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-500 mt-1">View and manage library users</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Joined</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className={`text-sm px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
