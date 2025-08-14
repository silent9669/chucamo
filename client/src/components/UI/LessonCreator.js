import React, { useState, useEffect } from 'react';
import { X, Youtube, Play, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import lessonAPI from '../../services/lessonAPI';

const LessonCreator = ({ isOpen, onClose, onLessonCreated, editingLesson = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    pdfUrl: '',
    type: 'general',
    thumbnail: '📚'
  });
  const [loading, setLoading] = useState(false);
  const [youtubePreview, setYoutubePreview] = useState('');
  const [pdfPreview, setPdfPreview] = useState('');
  const [errors, setErrors] = useState({});

  // Thumbnail options
  const thumbnailOptions = [
    '📚', '📐', '✍️', '🔺', '📖', '🎯', '💡', '🚀', '⭐', '🎓',
    '📝', '🔢', '📊', '🎨', '🔬', '🌍', '💻', '📱', '🎵', '🎬'
  ];

  // Type options
  const typeOptions = [
    { value: 'reading-writing', label: 'Reading & Writing' },
    { value: 'math', label: 'Math' },
    { value: 'instruction', label: 'Instruction' },
    { value: 'general', label: 'General' }
  ];

  useEffect(() => {
    if (editingLesson) {
      setFormData({
        title: editingLesson.title || '',
        description: editingLesson.description || '',
        youtubeUrl: editingLesson.youtubeUrl || '',
        pdfUrl: editingLesson.pdfUrl || '',
        type: editingLesson.type || 'general',
        thumbnail: editingLesson.thumbnail || '📚'
      });
      if (editingLesson.youtubeUrl) {
        generateYoutubePreview(editingLesson.youtubeUrl);
      }
      if (editingLesson.pdfUrl) {
        generatePDFPreview(editingLesson.pdfUrl);
      }
    }
  }, [editingLesson]);

  const generateYoutubePreview = (url) => {
    if (!url) {
      setYoutubePreview('');
      return;
    }

    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
    }
    
    if (videoId) {
      setYoutubePreview(`https://www.youtube.com/embed/${videoId}`);
    } else {
      setYoutubePreview('');
    }
  };

  const generatePDFPreview = (url) => {
    if (!url) {
      setPdfPreview('');
      return;
    }

    let fileId = '';
    
    if (url.includes('drive.google.com/file/d/')) {
      fileId = url.split('/file/d/')[1]?.split('/')[0];
    } else if (url.includes('drive.google.com/open?id=')) {
      fileId = url.split('open?id=')[1];
    } else if (url.includes('docs.google.com/document/d/')) {
      fileId = url.split('/document/d/')[1]?.split('/')[0];
    }
    
    if (fileId) {
      setPdfPreview(`https://drive.google.com/file/d/${fileId}/preview`);
    } else {
      setPdfPreview('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Generate YouTube preview when URL changes
    if (name === 'youtubeUrl') {
      generateYoutubePreview(value);
    }
    
    // Generate PDF preview when URL changes
    if (name === 'pdfUrl') {
      generatePDFPreview(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (formData.youtubeUrl && !youtubePreview) {
      newErrors.youtubeUrl = 'Please provide a valid YouTube URL';
    }
    if (formData.pdfUrl && !pdfPreview) {
      newErrors.pdfUrl = 'Please provide a valid Google Drive URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const lessonData = {
        ...formData
      };

      let response;
      if (editingLesson) {
        response = await lessonAPI.updateLesson(editingLesson._id, lessonData);
        toast.success('Lesson updated successfully!');
      } else {
        response = await lessonAPI.createLesson(lessonData);
        toast.success('Lesson created successfully!');
      }

      onLessonCreated(response.data);
      handleClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save lesson';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      pdfUrl: '',
      type: 'general',
      thumbnail: '📚'
    });
    setYoutubePreview('');
    setPdfPreview('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter lesson title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter lesson description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Video URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.youtubeUrl ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                {errors.youtubeUrl && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.youtubeUrl}
                  </p>
                )}
                {youtubePreview && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid YouTube URL detected
                  </p>
                )}
              </div>

              {/* PDF URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF Document URL (Google Drive)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="pdfUrl"
                    value={formData.pdfUrl}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.pdfUrl ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                {errors.pdfUrl && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.pdfUrl}
                  </p>
                )}
                {pdfPreview && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid Google Drive URL detected
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Supports Google Drive file links and Google Docs
                </p>
              </div>

                             {/* Type */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Type *
                 </label>
                 <select
                   name="type"
                   value={formData.type}
                   onChange={handleInputChange}
                   className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                     errors.type ? 'border-red-500' : 'border-gray-300'
                   }`}
                 >
                   {typeOptions.map(option => (
                     <option key={option.value} value={option.value}>
                       {option.label}
                     </option>
                   ))}
                 </select>
                 {errors.type && (
                   <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                     <AlertCircle className="w-4 h-4" />
                     {errors.type}
                   </p>
                 )}
               </div>

              

              

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {thumbnailOptions.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, thumbnail: emoji }))}
                      className={`w-10 h-10 text-xl rounded-lg border-2 flex items-center justify-center transition-colors ${
                        formData.thumbnail === emoji
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Media Previews */}
            <div className="space-y-6">
              {/* YouTube Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Preview
                </label>
                {youtubePreview ? (
                  <div className="relative">
                    <iframe
                      width="100%"
                      height="315"
                      src={youtubePreview}
                      title="YouTube video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg border border-gray-200"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                      LIVE
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                    <Youtube className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      {formData.youtubeUrl ? 'Invalid YouTube URL' : 'Enter a YouTube URL to see preview'}
                    </p>
                    {formData.youtubeUrl && !youtubePreview && (
                      <p className="text-red-500 text-sm mt-2">
                        Please check the URL format
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* PDF Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Preview
                </label>
                {pdfPreview ? (
                  <div className="relative">
                    <iframe
                      src={pdfPreview}
                      width="100%"
                      height="400"
                      title="PDF document preview"
                      frameBorder="0"
                      className="rounded-lg border border-gray-200"
                    />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      PDF
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      {formData.pdfUrl ? 'Invalid Google Drive URL' : 'Enter a Google Drive URL to see preview'}
                    </p>
                    {formData.pdfUrl && !pdfPreview && (
                      <p className="text-red-500 text-sm mt-2">
                        Please check the URL format
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Lesson Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Preview
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{formData.thumbnail}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {formData.title || 'Lesson Title'}
                      </h4>
                                             <p className="text-sm text-gray-500">
                         {formData.type || 'Type'}
                       </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.description || 'Lesson description will appear here...'}
                  </p>
                                     <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                     {formData.youtubeUrl && <span>🎥 Video</span>}
                     {formData.pdfUrl && <span>📄 PDF</span>}
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {editingLesson ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonCreator;
