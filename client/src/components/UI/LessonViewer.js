import React from 'react';
import { X, Youtube, FileText, Play, Download } from 'lucide-react';

const LessonViewer = ({ isOpen, onClose, lesson }) => {
  if (!isOpen || !lesson) return null;

  const generateYouTubeEmbed = (url) => {
    if (!url) return '';
    
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return '';
  };

  const generatePDFEmbed = (url) => {
    if (!url) return '';
    
    let fileId = '';
    
    if (url.includes('drive.google.com/file/d/')) {
      fileId = url.split('/file/d/')[1]?.split('/')[0];
    } else if (url.includes('drive.google.com/open?id=')) {
      fileId = url.split('open?id=')[1];
    } else if (url.includes('docs.google.com/document/d/')) {
      fileId = url.split('/document/d/')[1]?.split('/')[0];
    }
    
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    return '';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'reading-writing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'math':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'instruction':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'reading-writing':
        return 'Reading & Writing';
      case 'math':
        return 'Math';
      case 'instruction':
        return 'Instruction';
      default:
        return 'General';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{lesson.thumbnail}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(lesson.type)}`}>
                    {getTypeLabel(lesson.type)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

                 {/* Content */}
         <div className="p-6 space-y-8">

          {/* Video Section */}
          {lesson.youtubeUrl && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Video Lesson</h3>
              </div>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="400"
                  src={generateYouTubeEmbed(lesson.youtubeUrl)}
                  title="YouTube video lesson"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  LIVE
                </div>
              </div>
            </div>
          )}

          {/* PDF Section */}
          {lesson.pdfUrl && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Document Materials</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">PDF Document</h4>
                    <p className="text-sm text-gray-500">Scroll down to view the document below</p>
                  </div>
                  <a
                    href={lesson.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
                
                {/* PDF Embed */}
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    src={generatePDFEmbed(lesson.pdfUrl)}
                    width="100%"
                    height="600"
                    title="PDF document"
                    frameBorder="0"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* No Media Message */}
          {!lesson.youtubeUrl && !lesson.pdfUrl && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Media Content</h3>
              <p className="text-gray-600">This lesson doesn't contain any video or document materials yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Lesson created on {new Date(lesson.createdAt).toLocaleDateString()}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
