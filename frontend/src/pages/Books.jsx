import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchBooks, fetchCategories } from '../store/bookSlice';
import { FiBook, FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BookCardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

export default function Books() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: books, categories, loading, total, page, totalPages } = useSelector((state) => state.books);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    params.page = currentPage;
    params.limit = 12;
    dispatch(fetchBooks(params));
  }, [dispatch, search, category, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat === category ? '' : cat);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Library</h1>
          <p className="text-gray-500 mt-1">Discover books from our collection</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2 sm:self-start"
        >
          <FiFilter />
          Filters
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-2xl">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, or category..."
          className="input-field pl-12 pr-4 py-3"
        />
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Categories</h3>
            {(search || category) && (
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:underline">
                Clear all filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && books.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {books.length} of {total} books
          {search && <span> matching "<strong>{search}</strong>"</span>}
          {category && <span> in <strong>{category}</strong></span>}
        </p>
      )}

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={FiBook}
          title="No books found"
          description={search || category ? 'Try adjusting your search or filters' : 'No books available in the library yet'}
          action={
            (search || category) && (
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <Link
                key={book._id}
                to={`/books/${book._id}`}
                className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {/* Book Cover */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="text-primary-600"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="48" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg></div>`;
                      }}
                    />
                  ) : (
                    <FiBook className="text-4xl text-primary-400" />
                  )}
                  {book.availableCopies === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold bg-red-500 px-3 py-1 rounded-full text-sm">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{book.author}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {book.category}
                  </span>
                  <span className="text-xs text-gray-400">{book.publicationYear}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm">
                    <span className={`font-medium ${book.availableCopies > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {book.availableCopies}
                    </span>
                    <span className="text-gray-400">/ {book.totalCopies} available</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary flex items-center gap-1 disabled:opacity-50"
              >
                <FiChevronLeft /> Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === p
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary flex items-center gap-1 disabled:opacity-50"
              >
                Next <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
