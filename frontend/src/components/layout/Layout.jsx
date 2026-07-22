import { useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={user?.role}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
