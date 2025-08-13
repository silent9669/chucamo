# Vocabulary Learning System

This document describes the new vocabulary learning functionality implemented in the Chucamo application.

## Overview

The vocabulary system allows administrators to create and manage vocabulary sets with words, definitions, and images. Users can then study these vocabulary sets using an interactive flashcard interface similar to the provided code layout.

## Features

### Admin Management
- **Create Vocabulary Sets**: Admins can create new vocabulary sets with title, description, difficulty, and tags
- **Add Words**: Each set can contain multiple words with:
  - Word and definition
  - Image URL (displayed on the definition side of flashcards)
  - Part of speech (noun, verb, adjective, etc.)
  - Category (abstract, descriptive, sensory, etc.)
  - Example sentences
  - Difficulty level
- **Edit and Delete**: Full CRUD operations for both sets and individual words
- **Word Management**: Visual interface showing all words in a set with edit/delete options

### User Experience
- **Browse Sets**: Users can view all available vocabulary sets with difficulty indicators and word counts
- **Interactive Study**: Flashcard-based learning with:
  - Swipe gestures (left for "Need Review", right for "Got It!")
  - Card flipping to reveal definitions with images
  - Progress tracking
  - Session statistics
- **Study Modes**: 
  - Sequential learning through all words
  - Shuffle mode for randomized practice
  - Review mode for words that need more practice

## Technical Implementation

### Backend
- **Model**: `Vocabulary.js` - Mongoose schema for vocabulary sets and words
- **Routes**: `vocabulary.js` - RESTful API endpoints for CRUD operations
- **Authentication**: Admin-only access for management operations
- **Database**: MongoDB with embedded word documents

### Frontend
- **Components**: 
  - `VocabularyStudy.js` - Main study interface based on provided code layout
  - `DailyVocabManagement.js` - Admin interface for managing vocabulary
  - `VocabSets.js` - User interface for browsing available sets
  - `DailyVocab.js` - Main vocabulary page showing available sets
- **API Service**: `vocabularyAPI.js` - Client-side service for API calls
- **Routing**: New routes for vocabulary study and management

### Key Features
- **Image Integration**: Definition side of flashcards displays relevant images
- **Swipe Gestures**: Touch and mouse support for intuitive navigation
- **Progress Tracking**: Real-time progress bars and session statistics
- **Responsive Design**: Mobile-friendly interface with touch support
- **Performance**: Optimized card transitions and state management

## Usage

### For Administrators
1. Navigate to Admin → Daily Vocabulary Management
2. Create new vocabulary sets with descriptive information
3. Add words with definitions, images, and metadata
4. Organize words by type, category, and difficulty
5. Activate/deactivate sets as needed

### For Users
1. Access vocabulary through Study Plan → Daily Vocabulary
2. Browse available vocabulary sets
3. Click "Start Learning" to begin studying
4. Use swipe gestures or buttons to rate understanding
5. Review session statistics and words that need practice

## API Endpoints

### Public Endpoints
- `GET /api/vocabulary/sets` - Get all active vocabulary sets
- `GET /api/vocabulary/sets/:id` - Get specific vocabulary set with words

### Admin Endpoints (Require Authentication)
- `POST /api/vocabulary/sets` - Create new vocabulary set
- `PUT /api/vocabulary/sets/:id` - Update vocabulary set
- `DELETE /api/vocabulary/sets/:id` - Delete vocabulary set
- `POST /api/vocabulary/sets/:id/words` - Add word to set
- `PUT /api/vocabulary/sets/:setId/words/:wordId` - Update word
- `DELETE /api/vocabulary/sets/:setId/words/:wordId` - Delete word
- `GET /api/vocabulary/admin/sets` - Get all sets for admin management

## Data Structure

### Vocabulary Set
```javascript
{
  title: String,
  description: String,
  difficulty: 'easy' | 'medium' | 'hard',
  date: Date,
  isActive: Boolean,
  words: [VocabularyWord],
  createdBy: ObjectId,
  tags: [String],
  studyCount: Number,
  averageScore: Number
}
```

### Vocabulary Word
```javascript
{
  word: String,
  definition: String,
  image: String, // URL to image
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | ...,
  category: 'abstract' | 'descriptive' | 'sensory' | ...,
  example: String,
  difficulty: 'easy' | 'medium' | 'hard',
  order: Number
}
```

## Future Enhancements

- **Spaced Repetition**: Implement intelligent review scheduling
- **Audio Support**: Add pronunciation for words
- **Gamification**: Points, badges, and leaderboards
- **Social Features**: Share progress and compete with friends
- **Analytics**: Detailed learning analytics and insights
- **Offline Support**: Download sets for offline study
- **Custom Sets**: Allow users to create personal vocabulary sets

## Testing

Run the test script to verify functionality:
```bash
cd server
node scripts/testVocabulary.js
```

## Notes

- Images are stored as URLs (consider implementing image upload for production)
- The system is designed to be scalable for large vocabulary sets
- All admin operations require proper authentication and authorization
- The flashcard interface is optimized for both desktop and mobile devices
