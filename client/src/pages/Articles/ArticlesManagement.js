import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiEdit, FiTrash2, FiPlay } from 'react-icons/fi';
import KaTeXEditor from '../../components/UI/KaTeXEditor';
import { Link } from 'react-router-dom';
import logger from '../../utils/logger';
import { articlesAPI } from '../../services/api';

const ArticlesManagement = () => {
  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState({
    id: null,
    title: '',
    description: '',
    readingPassage: '',
    thumbnail: null,
    images: [],
    testType: 'article',
    contentType: 'articles'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load articles from database on component mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await articlesAPI.getAll();
        if (response.data.success) {
          setArticles(response.data.articles);
          logger.debug(`📚 Loaded ${response.data.articles.length} library content items from database`);
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

  const handleSaveArticle = async () => {
    if (!currentArticle.title.trim() || !currentArticle.description.trim()) {
      alert('Please fill in the title and description');
      return;
    }

    try {
      const articleData = {
        title: currentArticle.title,
        description: currentArticle.description,
        content: currentArticle.readingPassage || '',
        readingPassage: currentArticle.readingPassage || '',
        difficulty: 'medium',
        category: 'general',
        isPublished: true,
        isActive: true,
        thumbnail: currentArticle.thumbnail?.url || null,
        images: currentArticle.images.map(img => img.url) || [],
        contentType: currentArticle.contentType,
        tags: ['article']
      };

      logger.debug('💾 Saving article:', articleData.title);

      if (isEditing && currentArticle._id) {
        // Update existing article
        const response = await articlesAPI.update(currentArticle._id, articleData);
        if (response.data.success) {
          setArticles(prev => prev.map(article => 
            article._id === currentArticle._id ? response.data.article : article
          ));
          logger.debug('📝 Updated article in database');
        } else {
          throw new Error(response.data.message || 'Failed to update article');
        }
      } else {
        // Create new article
        const response = await articlesAPI.create(articleData);
        if (response.data.success) {
          setArticles(prev => [...prev, response.data.article]);
          logger.debug('➕ Added new article to database');
        } else {
          throw new Error(response.data.message || 'Failed to create article');
        }
      }

      // Reset form
      setCurrentArticle({
        id: null,
        title: '',
        description: '',
        readingPassage: '',
        thumbnail: null,
        images: [],
        testType: 'article',
        contentType: 'articles'
      });
      setIsEditing(false);
      setShowEditor(false);
      
      logger.debug('✅ Article saved successfully!');
      alert('Article saved successfully!');
    } catch (error) {
      logger.error('Error saving article:', error);
      alert(`Error saving article: ${error.message}`);
    }
  };

  const handleEditArticle = (article) => {
    setCurrentArticle({
      id: article._id,
      _id: article._id,
      title: article.title,
      description: article.description,
      readingPassage: article.content || article.readingPassage || '',
      thumbnail: article.thumbnail ? { url: article.thumbnail } : null,
      images: article.images ? article.images.map((url, index) => ({ 
        id: index, 
        url: url 
      })) : [],
      testType: 'article',
      contentType: article.contentType || 'articles'
    });
    setIsEditing(true);
    setShowEditor(true);
  };

  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        const response = await articlesAPI.delete(articleId);
        if (response.data.success) {
          setArticles(prev => prev.filter(article => article._id !== articleId));
          logger.debug('🗑️ Deleted article from database');
        } else {
          throw new Error(response.data.message || 'Failed to delete article');
        }
      } catch (error) {
        logger.error('Error deleting article:', error);
        alert(`Error deleting article: ${error.message}`);
      }
    }
  };

  const handleThumbnailUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const thumbnail = {
          id: Date.now(),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type,
          url: e.target.result // Store as base64
        };
        setCurrentArticle(prev => ({ ...prev, thumbnail }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setCurrentArticle(prev => ({ ...prev, thumbnail: null }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type,
          url: e.target.result // Store as base64
        };
        setCurrentArticle(prev => ({ ...prev, images: [...prev.images, newImage] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setCurrentArticle(prev => ({ 
      ...prev,
      images: prev.images.filter(img => img.id !== imageId) 
    }));
  };

  const handleNewArticle = () => {
    setCurrentArticle({
      id: null,
      title: '',
      description: '',
      readingPassage: '',
      thumbnail: null,
      images: [],
      testType: 'article',
      contentType: 'articles'
    });
    setIsEditing(false);
    setShowEditor(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
                  <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
        <p className="text-gray-600">Create and manage your library content</p>
        </div>
        <button
          onClick={handleNewArticle}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <FiPlus size={16} />
          New Article
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Library Content List */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Library Content List</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading library content...</p>
            ) : error ? (
              <p className="text-red-500 text-center py-8">{error}</p>
            ) : articles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No library content created yet</p>
            ) : (
              articles.map((article) => (
                <div key={article._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{article.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditArticle(article)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="px-2 py-1 rounded bg-green-100 text-green-800">
                      published
                    </span>
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {article.contentType || 'Articles'}
                    </span>
                    <span>{article.wordCount || 0} words</span>
                    <span>{article.readingTime || 0} min read</span>
                  </div>
                  <div className="mt-2">
                    <Link
                      to={`/library/${article._id}`}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <FiPlay size={14} />
                      Read Content
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Article Editor */}
        {showEditor && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditing ? 'Edit Library Content' : 'Create New Library Content'}
            </h2>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={currentArticle.title}
                  onChange={(e) => setCurrentArticle(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={currentArticle.description}
                  onChange={(e) => setCurrentArticle(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter article description"
                />
              </div>

              {/* Reading Passage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reading Passage</label>
                <KaTeXEditor
                  value={currentArticle.readingPassage}
                  onChange={(value) => setCurrentArticle(prev => ({ ...prev, readingPassage: value }))}
                  placeholder="Enter the main reading passage content..."
                  rows={8}
                />
              </div>

              {/* Content Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                                 <select
                   value={currentArticle.contentType}
                   onChange={(e) => setCurrentArticle(prev => ({ ...prev, contentType: e.target.value }))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 >
                   <option value="articles">Articles</option>
                   <option value="books">Books</option>
                   <option value="novel">Novel</option>
                   <option value="scientific research">Scientific Research</option>
                 </select>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
                {currentArticle.thumbnail ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={currentArticle.thumbnail.url}
                      alt="Thumbnail"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={removeThumbnail}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="w-full"
                  />
                )}
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full mb-2"
                />
                {currentArticle.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {currentArticle.images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveArticle}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FiSave size={16} />
                  Save Article
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesManagement;
