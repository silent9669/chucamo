import React, { useState } from 'react';
import { FiUpload, FiX, FiLink, FiPlay, FiSave } from 'react-icons/fi';

// Direct HTML elements to completely eliminate typing issues
const DirectInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    defaultValue={value || ''}
    onBlur={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        onChange(e.target.value);
      }
    }}
    placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
);

const DirectTextarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    defaultValue={value || ''}
    onBlur={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
    style={{ minHeight: `${rows * 1.5}rem` }}
  />
);

const StudyPlanManagement = () => {
  const [studyPlanContent, setStudyPlanContent] = useState({
    title: 'SAT Study Plan',
    description: 'Comprehensive study materials and resources for SAT preparation',
    guidelines: 'Follow the structured study plan to maximize your SAT score. Complete each section thoroughly before moving to the next.',
    files: [
      { id: 1, name: 'SAT_Math_Formula_Sheet.pdf', size: '245 KB' },
      { id: 2, name: 'Reading_Comprehension_Strategies.pdf', size: '180 KB' },
      { id: 3, name: 'Writing_Grammar_Rules.pdf', size: '320 KB' }
    ],
    externalLinks: [
      { id: 1, title: 'Khan Academy SAT Prep', url: 'https://www.khanacademy.org/sat' },
      { id: 2, title: 'College Board Practice Tests', url: 'https://collegereadiness.collegeboard.org/sat/practice' },
      { id: 3, title: 'SAT Study Guide', url: 'https://www.princetonreview.com/college/sat-study-guide' }
    ],
    videos: [
      { id: 1, title: 'SAT Math Strategies', url: 'https://www.youtube.com/watch?v=example1' },
      { id: 2, title: 'Reading Comprehension Tips', url: 'https://www.youtube.com/watch?v=example2' },
      { id: 3, title: 'Writing Section Overview', url: 'https://www.youtube.com/watch?v=example3' }
    ]
  });

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setStudyPlanContent(prev => ({
      ...prev,
      files: [...prev.files, ...files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
        file: file
      }))]
    }));
  };

  const removeFile = (fileId) => {
    setStudyPlanContent(prev => ({
      ...prev,
      files: prev.files.filter(file => file.id !== fileId)
    }));
  };

  const addExternalLink = () => {
    setStudyPlanContent(prev => ({
      ...prev,
      externalLinks: [...prev.externalLinks, { id: Date.now(), title: '', url: '' }]
    }));
  };

  const updateExternalLink = (id, field, value) => {
    setStudyPlanContent(prev => ({
      ...prev,
      externalLinks: prev.externalLinks.map(link => 
        link.id === id ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeExternalLink = (id) => {
    setStudyPlanContent(prev => ({
      ...prev,
      externalLinks: prev.externalLinks.filter(link => link.id !== id)
    }));
  };

  const addVideo = () => {
    setStudyPlanContent(prev => ({
      ...prev,
      videos: [...prev.videos, { id: Date.now(), title: '', url: '' }]
    }));
  };

  const updateVideo = (id, field, value) => {
    setStudyPlanContent(prev => ({
      ...prev,
      videos: prev.videos.map(video => 
        video.id === id ? { ...video, [field]: value } : video
      )
    }));
  };

  const removeVideo = (id) => {
    setStudyPlanContent(prev => ({
      ...prev,
      videos: prev.videos.filter(video => video.id !== id)
    }));
  };

  const saveStudyPlanContent = () => {
    // Here you would typically save to your backend
    console.log('Saving study plan content:', studyPlanContent);
    alert('Study plan content saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Study Plan Content Management</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveStudyPlanContent}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <FiSave size={16} />
                Save Content
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Study Plan Content Management</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Title
                  </label>
                  <DirectInput
                    value={studyPlanContent.title}
                    onChange={(value) => setStudyPlanContent(prev => ({ ...prev, title: value }))}
                    placeholder="Enter content title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <DirectTextarea
                    value={studyPlanContent.description}
                    onChange={(value) => setStudyPlanContent(prev => ({ ...prev, description: value }))}
                    placeholder="Enter content description..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Study Guidelines</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guidelines
                </label>
                <DirectTextarea
                  value={studyPlanContent.guidelines}
                  onChange={(value) => setStudyPlanContent(prev => ({ ...prev, guidelines: value }))}
                  placeholder="Enter study guidelines and instructions..."
                  rows={8}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload IOT Files and Documents
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, DOCX, TXT, XLSX, XLS, PPT, PPTX
                  </p>
                </div>
                
                {studyPlanContent.files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                    {studyPlanContent.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FiUpload size={16} className="text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">({file.size})</span>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* External Links */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">External Links</h3>
                <button
                  onClick={addExternalLink}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  <FiLink size={14} />
                  Add Link
                </button>
              </div>
              <div className="space-y-3">
                {studyPlanContent.externalLinks.map(link => (
                  <div key={link.id} className="flex gap-2">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => updateExternalLink(link.id, 'title', e.target.value)}
                      placeholder="Link title"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateExternalLink(link.id, 'url', e.target.value)}
                      placeholder="URL"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeExternalLink(link.id)}
                      className="px-2 py-2 text-red-500 hover:text-red-700"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Videos */}
            <div className="bg-white border rounded-lg p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Videos</h3>
                <button
                  onClick={addVideo}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  <FiPlay size={14} />
                  Add Video
                </button>
              </div>
              <div className="space-y-3">
                {studyPlanContent.videos.map(video => (
                  <div key={video.id} className="flex gap-2">
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => updateVideo(video.id, 'title', e.target.value)}
                      placeholder="Video title"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="url"
                      value={video.url}
                      onChange={(e) => updateVideo(video.id, 'url', e.target.value)}
                      placeholder="Video URL (YouTube, Vimeo, etc.)"
                      className="flex-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeVideo(video.id)}
                      className="px-2 py-2 text-red-500 hover:text-red-700"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanManagement;
