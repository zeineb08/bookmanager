import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/authSlice';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiShield,
  FiSave,
  FiLock,
} from 'react-icons/fi';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const { data } = await api.patch(`/users/${user._id}`, { name });
      dispatch(updateUser(data));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await api.patch(`/users/${user._id}`, {
        password: newPassword,
        currentPassword: currentPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      {/* Profile Info */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FiMail className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FiShield className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm font-medium text-gray-900">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FiCalendar className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm font-medium text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FiUser className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">User ID</p>
              <p className="text-sm font-medium text-gray-900 text-xs truncate">
                {user?._id}
              </p>
            </div>
          </div>
        </div>

        {/* Update Name Form */}
        <form onSubmit={handleUpdateProfile}>
          <h3 className="font-semibold text-gray-900 mb-3">Update Name</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field flex-1"
              placeholder="Your full name"
            />
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <FiSave /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiLock /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword}
            className="btn-primary"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
