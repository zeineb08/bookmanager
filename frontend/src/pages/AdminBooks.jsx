import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks, createBook, updateBook, deleteBook } from '../store/bookSlice';
import api from '../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiBook, FiX, FiSearch, FiCheck, FiUpload } from 'react-icons/fi';
import { BookCardSkeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';

const FORMATS = ['Physical', 'E-Book', 'Audio Book'];
const LANGUAGES = ['English', 'French', 'Arabic', 'Spanish', 'German', 'Other'];
const PREDEFINED_CATEGORIES = [
  'Programming', 'Technology', 'Science', 'Mathematics', 'History',
  'Biography', 'Fantasy', 'Romance', 'Mystery', 'Thriller',
  'Business', 'Psychology', 'Self Development', 'Education', 'Art', 'Health',
];

export default function AdminBooks() {
  const dispatch = useDispatch();
  const { items: books, loading } = useSelector((state) => state.books);

  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    authorId: '',
    description: '',
    ISBN: '',
    category: '',
    categories: [],
    language: 'English',
    format: 'Physical',
    publicationYear: '',
    coverImage: '',
    totalCopies: 1,
    status: 'Active',
  });

  // Authors & Categories data
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authorSearch, setAuthorSearch] = useState('');
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnSearched, setIsbnSearched] = useState(false);

  useEffect(() => {
    dispatch(fetchBooks({ limit: 100 }));
    fetchAuthors();
    fetchCategories();
  }, [dispatch]);

  const fetchAuthors = async () => {
    try {
      const { data } = await api.get('/authors');
      setAuthors(data);
    } catch (err) {
      console.error('Failed to fetch authors');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  // Filter authors based on search
  const filteredAuthors = authors.filter(a =>
    a.name.toLowerCase().includes(authorSearch.toLowerCase())
  );
  const showAddNewAuthor = authorSearch.trim() &&
    !authors.some(a => a.name.toLowerCase() === authorSearch.trim().toLowerCase());

  const handleSelectAuthor = (author) => {
    setFormData(prev => ({ ...prev, author: author.name, authorId: author._id }));
    setAuthorSearch(author.name);
    setShowAuthorDropdown(false);
  };

  const handleAddNewAuthor = async () => {
    try {
      const { data } = await api.post('/authors', { name: authorSearch.trim() });
      setAuthors(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, author: data.name, authorId: data._id }));
      setAuthorSearch(data.name);
      setShowAuthorDropdown(false);
      toast.success(`Author "${data.name}" created`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create author');
    }
  };

  const openCreateModal = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      authorId: '',
      description: '',
      ISBN: '',
      category: '',
      categories: [],
      language: 'English',
      format: 'Physical',
      publicationYear: '',
      coverImage: '',
      totalCopies: 1,
      status: 'Active',
    });
    setAuthorSearch('');
    setIsbnSearched(false);
    setShowModal(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      authorId: book.authorId || '',
      description: book.description,
      ISBN: book.ISBN,
      category: book.category || '',
      categories: book.categories || [],
      language: book.language || 'English',
      format: book.format || 'Physical',
      publicationYear: book.publicationYear?.toString() || '',
      coverImage: book.coverImage || '',
      totalCopies: book.totalCopies,
      status: book.status || 'Active',
    });
    setAuthorSearch(book.author);
    setIsbnSearched(!!book.ISBN);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.ISBN) {
      toast.error('Title, Author, and ISBN are required');
      return;
    }

    const data = {
      ...formData,
      publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined,
      totalCopies: parseInt(formData.totalCopies),
    };

    if (editingBook) {
      await dispatch(updateBook({ id: editingBook._id, ...data }));
    } else {
      await dispatch(createBook(data));
    }
    setShowModal(false);
    dispatch(fetchBooks({ limit: 100 }));
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      dispatch(deleteBook(id));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  // ISBN Search via Google Books API
  const handleIsbnSearch = async () => {
    if (!formData.ISBN.trim()) {
      toast.error('Please enter an ISBN first');
      return;
    }

    setIsbnLoading(true);
    setIsbnSearched(false);
    try {
      const isbn = formData.ISBN.replace(/-/g, '');
      const { data } = await api.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);

      if (data.totalItems === 0) {
        toast.error('No book found with this ISBN');
        setIsbnLoading(false);
        return;
      }

      const bookInfo = data.items[0].volumeInfo;
      const newData = {
        title: bookInfo.title || formData.title,
        author: bookInfo.authors?.[0] || formData.author,
        description: bookInfo.description?.replace(/<[^>]*>/g, '') || formData.description,
        publicationYear: bookInfo.publishedDate ? parseInt(bookInfo.publishedDate.substring(0, 4)) : formData.publicationYear,
        coverImage: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || formData.coverImage,
        categories: bookInfo.categories || formData.categories,
        category: bookInfo.categories?.[0] || formData.category,
      };

      setFormData(prev => ({ ...prev, ...newData }));
      setAuthorSearch(newData.author || authorSearch);
      setIsbnSearched(true);
      toast.success('Book info fetched from ISBN!');
    } catch (err) {
      toast.error('Failed to fetch book info. Try entering manually.');
    } finally {
      setIsbnLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Books</h1>
          <p className="text-gray-500 mt-1">Add, edit, or remove books from the library</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Book
        </button>
      </div>

      {/* Books Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <BookCardSkeleton />
        ) : books.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No books found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Book</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Author</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Category</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-600">Copies</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-gradient-to-br from-primary-200 to-primary-400 rounded flex items-center justify-center flex-shrink-0">
                          {book.coverImage ? (
                            <img src={book.coverImage} alt="" className="w-full h-full object-cover rounded" onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg class="text-white w-5 h-5" .../>'; }} />
                          ) : (
                            <FiBook className="text-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{book.title}</p>
                          <p className="text-xs text-gray-400">ISBN: {book.ISBN}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{book.author}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {book.category || (book.categories?.[0]) || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm text-gray-900">{book.totalCopies}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        book.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {book.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(book)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><FiEdit2 /></button>
                        <button onClick={() => handleDelete(book._id, book.title)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* ISBN Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">ISBN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="ISBN"
                    value={formData.ISBN}
                    onChange={handleChange}
                    className="input-field flex-1"
                    placeholder="978-0132350884"
                  />
                  <button
                    type="button"
                    onClick={handleIsbnSearch}
                    disabled={isbnLoading || !formData.ISBN.trim()}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                  >
                    {isbnLoading ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiSearch />
                    )}
                    Search Book
                  </button>
                </div>
                {isbnSearched && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FiCheck /> Book info fetched from ISBN database
                  </p>
                )}
              </div>

              {/* Cover Preview */}
              {formData.coverImage && (
                <div className="flex justify-center">
                  <div className="relative w-32 h-44 bg-gray-100 rounded-lg overflow-hidden shadow-md">
                    <img
                      src={formData.coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" required />
              </div>

              {/* Author - Searchable Dropdown */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Author *</label>
                <input
                  type="text"
                  value={authorSearch}
                  onChange={(e) => {
                    setAuthorSearch(e.target.value);
                    setShowAuthorDropdown(true);
                    setFormData(prev => ({ ...prev, author: e.target.value, authorId: '' }));
                  }}
                  onFocus={() => setShowAuthorDropdown(true)}
                  placeholder="Search or type author name..."
                  className="input-field"
                />
                {showAuthorDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredAuthors.map(author => (
                      <button
                        key={author._id}
                        type="button"
                        onClick={() => handleSelectAuthor(author)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FiBook className="text-gray-400 text-xs" />
                        {author.name}
                      </button>
                    ))}
                    {filteredAuthors.length === 0 && !showAddNewAuthor && (
                      <div className="px-4 py-3 text-sm text-gray-400">No authors found</div>
                    )}
                    {showAddNewAuthor && (
                      <button
                        type="button"
                        onClick={handleAddNewAuthor}
                        className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-blue-50 font-medium flex items-center gap-2 border-t border-gray-100"
                      >
                        <FiPlus /> Add "{authorSearch.trim()}" as new author
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Categories - Multi-select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categories / Genres</label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.categories.includes(cat)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {formData.categories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {formData.categories.join(', ')}
                  </p>
                )}
              </div>

              {/* Language & Format Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                  <select name="language" value={formData.language} onChange={handleChange} className="input-field">
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Publication Year</label>
                  <input type="number" name="publicationYear" value={formData.publicationYear} onChange={handleChange} className="input-field" placeholder="e.g. 2024" min="1000" max="2099" />
                </div>
              </div>

              {/* Format - Radio Buttons */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Book Format</label>
                <div className="flex gap-3">
                  {FORMATS.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, format: f }))}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.format === f
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Image URL</label>
                <div className="flex gap-2">
                  <input type="url" name="coverImage" value={formData.coverImage} onChange={handleChange} className="input-field flex-1" placeholder="https://..." />
                </div>
              </div>

              {/* Copies & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total Copies *</label>
                  <input type="number" name="totalCopies" value={formData.totalCopies} onChange={handleChange} className="input-field" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'Active' }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.status === 'Active'
                          ? 'bg-green-100 text-green-700 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                      }`}
                    >
                      Active ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'Inactive' }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.status === 'Inactive'
                          ? 'bg-red-100 text-red-700 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="input-field" rows={4} required />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingBook ? 'Update Book' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}