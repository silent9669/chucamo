import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiClock, FiPlay, FiSearch, FiEye } from 'react-icons/fi';
import { articlesAPI } from '../../services/api';
import logger from '../../utils/logger';

const Articles = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Library</h1>
        <p className="text-gray-600">
          Access your personalized library content and practice materials.
        </p>
      </div>

      <ArticlesList />
    </div>
  );
};

const ArticlesList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [error, setError] = useState(null);

  // Load articles from database on component mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await articlesAPI.getAll();
        if (response.data.success) {
          setArticles(response.data.articles);
          logger.debug(`Loaded ${response.data.articles.length} library content items from database`);
        } else {
          setError('Failed to load library content');
          logger.error('Failed to load library content:', response.data.message);
        }
      } catch (error) {
        setError('Failed to load library content');
        logger.error('Error fetching library content:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  // Calculate word count and reading time for an article (kept for potential future use)
  // eslint-disable-next-line no-unused-vars
  const getReadingStats = (readingPassage) => {
    if (!readingPassage) return { words: 0, characters: 0, readingTime: 0 };
    
    const text = readingPassage.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    const readingTime = Math.ceil(words.length / 200); // Assuming 200 words per minute
    
    return { words: words.length, characters, readingTime };
  };

  const filteredArticles = articles.filter(article => {
    if (searchTerm && !article.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (contentTypeFilter !== 'all' && article.contentType !== contentTypeFilter) {
      return false;
    }
    return true;
  });

  const ArticleCard = ({ article }) => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{article.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
              {article.difficulty || 'Medium'}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(article.isPublished ? 'published' : 'draft')}`}>
              {article.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        {article.thumbnail && (
          <div className="mb-4">
            <img 
              src={article.thumbnail} 
              alt={article.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <FiClock size={14} />
            {article.readingTime > 0 ? `${article.readingTime} min read` : 'N/A'}
          </span>
          <span className="flex items-center gap-1">
            <FiFileText size={14} />
            {article.wordCount} words
          </span>
          <span className="flex items-center gap-1">
            <FiEye size={14} />
            {article.views} views
          </span>

          <span className="text-xs text-gray-500">
            {formatDate(article.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {article.contentType || 'Articles'}
            </span>
            {article.featured && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Featured
              </span>
            )}
          </div>
          
          <Link
            to={`/library/${article._id}`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
          >
            <FiPlay size={14} />
            Read Content
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading library content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <FiFileText size={48} className="mx-auto mb-2" />
          <p className="text-lg font-semibold">Failed to load library content</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Type Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by content type:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setContentTypeFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              contentTypeFilter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setContentTypeFilter('articles')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              contentTypeFilter === 'articles'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Articles
          </button>
          <button
            onClick={() => setContentTypeFilter('books')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              contentTypeFilter === 'books'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Books
          </button>
                     <button
             onClick={() => setContentTypeFilter('novel')}
             className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
               contentTypeFilter === 'novel'
                 ? 'bg-green-600 text-white'
                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
             }`}
           >
             Novel
           </button>
          <button
            onClick={() => setContentTypeFilter('scientific research')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              contentTypeFilter === 'scientific research'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Scientific Research
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FiSearch size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Search library content:</span>
        </div>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search library content by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No library content found
          </h3>
          <p className="text-gray-600">
            No library content matches your current search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Articles; 