import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBooks } from '../store/bookSlice';
import { fetchUserBorrowings } from '../store/borrowingSlice';
import { FiBook, FiBookOpen, FiClock, FiTrendingUp, FiSearch, FiArrowRight } from 'react-icons/fi';
import { BookCardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: books, loading: booksLoading } = useSelector((state) => state.books);
  const { items: borrowings, loading: borrowLoading } = useSelector((state) => state.borrowings);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchBooks({ limit: 6 }));
    if (user?._id) {
      dispatch(fetchUserBorrowings(user._id));
    }
  }, [dispatch, user?._id]);

  const activeBorrowings = borrowings.filter((b) => b.status === 'BORROWED');
  const returnedBorrowings = borrowings.filter((b) => b.status === 'RETURNED' || b.status === 'LATE');

  const statsCards = [
    {
      title: 'Books in Library',
      value: books.length || 0,
      icon: FiBook,
      color: 'bg-blue-500',
      link: '/books',
    },
    {
      title: 'Currently Borrowed',
      value: activeBorrowings.length,
      icon: FiBookOpen,
      color: 'bg-amber-500',
      link: '/my-borrowings',
    },
    {
      title: 'Returned Books',
      value: returnedBorrowings.length,
      icon: FiClock,
      color: 'bg-green-500',
      link: '/my-borrowings',
    },
    {
      title: 'Member Since',
      value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      icon: FiTrendingUp,
      color: 'bg-purple-500',
      link: '/profile',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your library dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Link key={index} to={stat.link} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="text-white text-xl" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search books by title, author, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm.trim()) {
              window.location.href = `/books?search=${searchTerm}`;
            }
          }}
        />
      </div>

      {/* Recent Books */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Books</h2>
          <Link
            to="/books"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            View All <FiArrowRight />
          </Link>
        </div>

        {booksLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <EmptyState
            icon={FiBook}
            title="No books available"
            description="Check back later for new additions to our library."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <Link
                key={book._id}
                to={`/books/${book._id}`}
                className="group bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiBook className="text-white text-2xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                      {book.category}
                    </span>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <FiBookOpen />
                      <span>
                        {book.availableCopies} / {book.totalCopies} available
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Active Borrowings Summary */}
      {activeBorrowings.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Currently Borrowed</h2>
            <Link
              to="/my-borrowings"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {activeBorrowings.slice(0, 3).map((borrowing) => (
              <div
                key={borrowing._id}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FiBookOpen className="text-amber-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {borrowing.bookId?.title || 'Unknown Book'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Borrowed: {new Date(borrowing.borrowDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
