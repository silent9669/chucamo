import React, { useRef, useState } from 'react';
import { FiUpload, FiX, FiEye } from 'react-icons/fi';

const ImageUpload = ({ images, onImagesChange, onImageRemove }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('image', file);

          // Upload to server
          const response = await fetch('/api/upload/question-image', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          
          return {
            id: Date.now() + Math.random(),
            url: result.url || result.path,
            name: file.name,
            serverPath: result.path || result.url
          };
        } catch (error) {
          console.error('Error uploading image:', error);
          // Fallback to blob URL if upload fails
          return {
            id: Date.now() + Math.random(),
            url: URL.createObjectURL(file),
            name: file.name,
            isBlob: true
          };
        }
      });

      const newImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error('Error handling image upload:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
    if (onImageRemove) {
      onImageRemove(imageId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FiUpload className="w-8 h-8 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="text-center text-sm text-gray-600">
          Uploading images...
        </div>
      )}

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  console.error('Image failed to load:', image);
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200"
                  title="Remove image"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {image.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 