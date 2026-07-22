import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBorrowings, returnBook } from '../store/borrowingSlice';
import { FiBookOpen, FiClock, FiCheckCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function MyBorrowings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: borrowings, loading } = useSelector((state) => state.borrowings);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserBorrowings(user._id));
    }
  }, [dispatch, user?._id]);

  const handleReturn = (borrowingId) => {
    dispatch(returnBook(borrowingId)).then(() => {
      dispatch(fetchUserBorrowings(user._id));
    });
  };

  const activeBorrowings = borrowings.filter((b) => b.status === 'BORROWED');
  const returnedBorrowings = borrowings.filter((b) => b.status !== 'BORROWED');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BORROWED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
            <FiClock /> Active
          </span>
        );
      case 'RETURNED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            <FiCheckCircle /> Returned
          </span>
        );
      case 'LATE':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            <FiAlertTriangle /> Late
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Borrowings</h1>
        <p className="text-gray-500 mt-1">Track your borrowed and returned books</p>
      </div>

      {/* Active Borrowings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Borrowings ({activeBorrowings.length})
        </h2>
        {activeBorrowings.length === 0 ? (
          <EmptyState
            icon={FiBookOpen}
            title="No active borrowings"
            description="You haven't borrowed any books yet. Browse the library to find your next read!"
          />
        ) : (
          <div className="space-y-4">
            {activeBorrowings.map((borrowing) => (
              <div
                key={borrowing._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-16 bg-gradient-to-br from-primary-200 to-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiBookOpen className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {borrowing.bookId?.title || 'Unknown Book'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      by {borrowing.bookId?.author || 'Unknown Author'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <FiClock />
                      <span>
                        Borrowed: {new Date(borrowing.borrowDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(borrowing.status)}
                  <button
                    onClick={() => handleReturn(borrowing._id)}
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    <FiRefreshCw /> Return
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {returnedBorrowings.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            History ({returnedBorrowings.length})
          </h2>
          <div className="space-y-3">
            {returnedBorrowings.map((borrowing) => (
              <div
                key={borrowing._id}
                className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <FiBookOpen className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {borrowing.bookId?.title || 'Unknown Book'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>Borrowed: {new Date(borrowing.borrowDate).toLocaleDateString()}</span>
                      {borrowing.returnDate && (
                        <span>Returned: {new Date(borrowing.returnDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                {getStatusBadge(borrowing.status)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
