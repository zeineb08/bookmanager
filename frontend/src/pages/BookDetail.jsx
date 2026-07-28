import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchBookById } from '../store/bookSlice';
import { borrowBook, returnBook } from '../store/borrowingSlice';
import { fetchUserBorrowings } from '../store/borrowingSlice';
import api from '../utils/api';
import {
  FiBook,
  FiArrowLeft,
  FiStar,
  FiClock,
  FiBookOpen,
  FiUser,
  FiCalendar,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import Spinner from '../components/common/Spinner';

export default function BookDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentBook: book, loading } = useSelector((state) => state.books);
  const { user } = useSelector((state) => state.auth);
  const { loading: borrowLoading } = useSelector((state) => state.borrowings);

  const [reviews, setReviews] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    dispatch(fetchBookById(id));
    fetchReviews();
    dispatch(fetchUserBorrowings(user._id));
  }, [dispatch, id, user._id]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/book/${id}`);
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews');
    }
  };

  const { items: userBorrowings } = useSelector((state) => state.borrowings);
  const activeBorrowing = userBorrowings.find(
    (b) => b.bookId?._id === id && b.status === 'BORROWED'
  );

  const isAvailable = book?.availableCopies > 0;

  const handleBorrow = () => {
    dispatch(borrowBook(id)).then(() => {
      dispatch(fetchBookById(id));
      dispatch(fetchUserBorrowings(user._id));
    });
  };

  const handleReturn = () => {
    if (activeBorrowing) {
      dispatch(returnBook(activeBorrowing._id)).then(() => {
        dispatch(fetchBookById(id));
        dispatch(fetchUserBorrowings(user._id));
      });
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) return;

    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookId: id,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      console.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Book not found</h2>
        <Link to="/books" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/books"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <FiArrowLeft /> Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Book Cover & Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4 overflow-hidden p-2 min-h-[16rem]">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-auto object-contain rounded max-h-[500px]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <FiBook className="text-6xl text-primary-400" />
              )}
            </div>

            <button
              onClick={activeBorrowing ? handleReturn : handleBorrow}
              disabled={(!isAvailable && !activeBorrowing) || borrowLoading}
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeBorrowing
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : isAvailable
                    ? 'btn-primary'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {activeBorrowing ? (
                <>
                  <FiCheck /> Return Book
                </>
              ) : isAvailable ? (
                <>
                  <FiBookOpen /> Borrow This Book
                </>
              ) : (
                'Currently Unavailable'
              )}
            </button>

            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FiBook className="text-gray-400" />
                <span>ISBN: {book.ISBN}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-400" />
                <span>Published: {book.publicationYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiBookOpen className="text-gray-400" />
                <span>
                  {book.availableCopies} of {book.totalCopies} copies available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Book Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
                <p className="text-gray-500 mt-1">by {book.author}</p>
              </div>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {book.category}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`${star <= Math.round(reviews.averageRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                      }`}
                  />
                ))}
                <span className="ml-1 text-sm text-gray-500">
                  ({reviews.totalReviews} reviews)
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{book.description}</p>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Reviews ({reviews.totalReviews})
            </h2>

            {/* Review Form */}
            {user && (
              <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Write a Review</h3>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview((prev) => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <FiStar
                        className={`text-xl ${star <= newReview.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview((prev) => ({ ...prev, comment: e.target.value }))
                  }
                  placeholder="Share your thoughts about this book..."
                  className="input-field mb-3"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={submittingReview || !newReview.comment.trim()}
                  className="btn-primary"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {/* Reviews List */}
            {reviews.reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiUser className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {review.userId?.name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`text-sm ${star <= review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
