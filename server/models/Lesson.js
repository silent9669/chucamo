const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [200, 'Lesson title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Lesson description is required'],
    trim: true,
    maxlength: [2000, 'Lesson description cannot exceed 2000 characters']
  },
  youtubeUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty for non-video lessons
        // Basic YouTube URL validation
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(v);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  youtubeEmbedCode: {
    type: String,
    trim: true
  },
  pdfUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty for non-PDF lessons
        // Google Drive PDF URL validation
        const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/.+/;
        return googleDriveRegex.test(v);
      },
      message: 'Please provide a valid Google Drive URL'
    }
  },
  pdfEmbedCode: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['reading-writing', 'math', 'general'],
    default: 'general'
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },

  views: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String,
    default: '📚'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate embed codes
lessonSchema.pre('save', function(next) {
  if (this.youtubeUrl && this.isModified('youtubeUrl')) {
    this.youtubeEmbedCode = this.generateYouTubeEmbedCode(this.youtubeUrl);
  }
  if (this.pdfUrl && this.isModified('pdfUrl')) {
    this.pdfEmbedCode = this.generatePDFEmbedCode(this.pdfUrl);
  }
  next();
});

// Method to generate YouTube embed code from URL
lessonSchema.methods.generateYouTubeEmbedCode = function(url) {
  let videoId = '';
  
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v');
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1];
  }
  
  if (videoId) {
    return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  
  return '';
};

// Method to get video ID from URL
lessonSchema.methods.getVideoId = function() {
  if (!this.youtubeUrl) return null;
  
  if (this.youtubeUrl.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(this.youtubeUrl.split('?')[1]);
    return urlParams.get('v');
  } else if (this.youtubeUrl.includes('youtu.be/')) {
    return this.youtubeUrl.split('youtu.be/')[1];
  }
  
  return null;
};

// Method to generate PDF embed code from Google Drive URL
lessonSchema.methods.generatePDFEmbedCode = function(url) {
  if (!url) return '';
  
  let fileId = '';
  
  if (url.includes('drive.google.com/file/d/')) {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    fileId = url.split('/file/d/')[1]?.split('/')[0];
  } else if (url.includes('drive.google.com/open?id=')) {
    // Format: https://drive.google.com/open?id=FILE_ID
    fileId = url.split('open?id=')[1];
  } else if (url.includes('docs.google.com/document/d/')) {
    // Format: https://docs.google.com/document/d/FILE_ID/edit
    fileId = url.split('/document/d/')[1]?.split('/')[0];
  }
  
  if (fileId) {
    return `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="100%" height="600" frameborder="0"></iframe>`;
  }
  
  return '';
};

// Method to get PDF file ID from URL
lessonSchema.methods.getPDFFileId = function() {
  if (!this.pdfUrl) return null;
  
  if (this.pdfUrl.includes('drive.google.com/file/d/')) {
    return this.pdfUrl.split('/file/d/')[1]?.split('/')[0];
  } else if (this.pdfUrl.includes('drive.google.com/open?id=')) {
    return this.pdfUrl.split('open?id=')[1];
  } else if (this.pdfUrl.includes('docs.google.com/document/d/')) {
    return this.pdfUrl.split('/document/d/')[1]?.split('/')[0];
  }
  
  return null;
};

// Index for better search performance
lessonSchema.index({ title: 'text', description: 'text', tags: 'text' });
lessonSchema.index({ type: 1, status: 1 });
lessonSchema.index({ createdBy: 1 });

// Add pagination plugin
lessonSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Lesson', lessonSchema);
