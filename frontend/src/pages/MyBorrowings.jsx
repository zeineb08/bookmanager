import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUserBorrowings, returnBook } from '../store/borrowingSlice';
import { FiBookOpen, FiClock, FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function MyBorrowings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: borrowings, loading } = useSelector((state) => state.borrowings);

  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

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
  const returnedBorrowingsRaw = borrowings.filter((b) => b.status !== 'BORROWED');

  const groupedHistory = returnedBorrowingsRaw.reduce((acc, curr) => {
    const bookId = curr.bookId?._id;
    if (!bookId) return acc;
    
    if (!acc[bookId]) {
      acc[bookId] = { ...curr, count: 1 };
    } else {
      acc[bookId].count += 1;
      if (new Date(curr.returnDate) > new Date(acc[bookId].returnDate)) {
        acc[bookId].borrowDate = curr.borrowDate;
        acc[bookId].returnDate = curr.returnDate;
        acc[bookId].status = curr.status;
      }
    }
    return acc;
  }, {});
  
  const historyItems = Object.values(groupedHistory).sort((a, b) => 
    new Date(b.returnDate) - new Date(a.returnDate)
  );

  const totalActivePages = Math.ceil(activeBorrowings.length / ITEMS_PER_PAGE);
  const totalHistoryPages = Math.ceil(historyItems.length / ITEMS_PER_PAGE);

  const paginatedActiveBorrowings = activeBorrowings.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

  const paginatedHistoryItems = historyItems.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  );

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
            {paginatedActiveBorrowings.map((borrowing) => (
              <div
                key={borrowing._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4"
              >
                <div className="flex items-center gap-4">
                  <Link to={`/books/${borrowing.bookId?._id}`} className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-12 h-16 bg-gradient-to-br from-primary-200 to-primary-400 rounded-lg flex items-center justify-center overflow-hidden">
                      {borrowing.bookId?.coverImage ? (
                        <img 
                          src={borrowing.bookId.coverImage} 
                          alt={borrowing.bookId.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiBookOpen className="text-white text-xl" />
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link to={`/books/${borrowing.bookId?._id}`} className="hover:underline">
                      <h3 className="font-medium text-gray-900">
                        {borrowing.bookId?.title || 'Unknown Book'}
                      </h3>
                    </Link>
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
            
            {totalActivePages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Page {activePage} of {totalActivePages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="text-xl" />
                  </button>
                  <button
                    onClick={() => setActivePage((p) => Math.min(totalActivePages, p + 1))}
                    disabled={activePage === totalActivePages}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="text-xl" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History */}
      {historyItems.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Borrowing History ({historyItems.length} {historyItems.length === 1 ? "book" : "books"})
          </h2>
          <div className="space-y-3">
            {paginatedHistoryItems.map((borrowing) => (
              <div
                key={borrowing.bookId?._id || borrowing._id}
                className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <FiBookOpen className="text-gray-400" />
                  <div>
                    <Link to={`/books/${borrowing.bookId?._id}`} className="hover:underline">
                      <p className="font-medium text-gray-900 text-sm">
                        {borrowing.bookId?.title || 'Unknown Book'}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>Last Borrowed: {new Date(borrowing.borrowDate).toLocaleDateString()}</span>
                      {borrowing.returnDate && (
                        <span>Last Returned: {new Date(borrowing.returnDate).toLocaleDateString()}</span>
                      )}
                      {borrowing.count > 1 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                          Borrowed {borrowing.count} {borrowing.count === 1 ? "time" : "times"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {getStatusBadge(borrowing.status)}
              </div>
            ))}

            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2">
                <span className="text-sm text-gray-500">
                  Page {historyPage} of {totalHistoryPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="text-xl" />
                  </button>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage === totalHistoryPages}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="text-xl" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
