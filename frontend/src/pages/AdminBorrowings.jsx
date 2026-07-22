import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiBookOpen, FiClock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function AdminBorrowings() {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const fetchBorrowings = async () => {
    try {
      const { data } = await api.get('/borrowings');
      setBorrowings(data);
    } catch (err) {
      console.error('Failed to fetch borrowings');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (borrowingId) => {
    try {
      await api.patch(`/borrowings/${borrowingId}/return`);
      fetchBorrowings();
    } catch (err) {
      console.error('Failed to return book');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BORROWED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium w-fit">
            <FiClock /> Active
          </span>
        );
      case 'RETURNED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium w-fit">
            <FiCheckCircle /> Returned
          </span>
        );
      case 'LATE':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium w-fit">
            <FiAlertTriangle /> Late
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Borrowings</h1>
        <p className="text-gray-500 mt-1">Monitor all library borrowing activity</p>
      </div>

      <div className="card overflow-hidden">
        {borrowings.length === 0 ? (
          <EmptyState
            icon={FiBookOpen}
            title="No borrowings yet"
            description="There are no borrowing records in the system yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Book</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Borrow Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Return Date</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {borrowings.map((borrowing) => (
                  <tr key={borrowing._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 bg-gradient-to-br from-primary-200 to-primary-400 rounded flex items-center justify-center flex-shrink-0">
                          <FiBookOpen className="text-white text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {borrowing.bookId?.title || 'Unknown Book'}
                          </p>
                          <p className="text-xs text-gray-400">{borrowing.bookId?.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {borrowing.userId?.name || 'Unknown User'}
                      <p className="text-xs text-gray-400">{borrowing.userId?.email}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(borrowing.borrowDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {borrowing.returnDate
                        ? new Date(borrowing.returnDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="p-4 text-center">{getStatusBadge(borrowing.status)}</td>
                    <td className="p-4 text-right">
                      {borrowing.status === 'BORROWED' && (
                        <button
                          onClick={() => handleReturn(borrowing._id)}
                          className="btn-primary text-sm"
                        >
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
