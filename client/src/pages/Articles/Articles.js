import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiClock, FiPlay, FiSearch } from 'react-icons/fi';

const Articles = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Articles</h1>
        <p className="text-gray-600">
          Access your personalized articles and practice materials.
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

  // Load articles from localStorage on component mount
  useEffect(() => {
    const savedArticles = localStorage.getItem('articles');
    if (savedArticles) {
      try {
        const parsedArticles = JSON.parse(savedArticles);
        setArticles(parsedArticles);
        console.log(`Loaded ${parsedArticles.length} articles from localStorage`);
      } catch (error) {
        console.error('Error parsing articles from localStorage:', error);
        setArticles([]);
      }
    } else {
      console.log('No articles found in localStorage');
    }
    setLoading(false);
  }, []);

  // Save articles to localStorage whenever articles change
  useEffect(() => {
    if (articles.length > 0) {
      localStorage.setItem('articles', JSON.stringify(articles));
      console.log(`Saved ${articles.length} articles to localStorage`);
    }
  }, [articles]);

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

  // Calculate word count and reading time for an article
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
    return true;
  });

  const ArticleCard = ({ article }) => {
    const readingStats = getReadingStats(article.readingPassage);
    
    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{article.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
              {article.difficulty || 'Unknown'}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(article.status)}`}>
              {article.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        {article.thumbnail && (
          <div className="mb-4">
            <img 
              src={article.thumbnail.url} 
              alt={article.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <FiClock size={14} />
            {readingStats.readingTime > 0 ? `${readingStats.readingTime} min read` : 'N/A'}
          </span>
          <span className="flex items-center gap-1">
            <FiFileText size={14} />
            {readingStats.words} words
          </span>
          <span className="text-xs text-gray-500">
            Created: {article.created}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              Article
            </span>
          </div>
          
          <Link
            to={`/articles/${article.id}`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
          >
            <FiPlay size={14} />
            Read Article
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FiSearch size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Search articles:</span>
        </div>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search articles by name..."
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
            No articles found
          </h3>
          <p className="text-gray-600">
            No articles match your current search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Articles; 