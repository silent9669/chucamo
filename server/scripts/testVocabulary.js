const mongoose = require('mongoose');
const VocabularySet = require('../models/Vocabulary');
require('dotenv').config();

async function testVocabulary() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chucamo');
    console.log('Connected to MongoDB');

    // Create a sample vocabulary set
    const sampleSet = new VocabularySet({
      title: 'Sample SAT Vocabulary',
      description: 'Essential words for SAT preparation',
      difficulty: 'medium',
      date: new Date(),
      tags: ['SAT', 'college', 'academic'],
      createdBy: '507f1f77bcf86cd799439011', // Sample ObjectId
      words: [
        {
          word: 'Serendipity',
          definition: 'The occurrence of events by chance in a happy or beneficial way',
          image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&auto=format',
          type: 'noun',
          category: 'abstract',
          example: 'Finding that book was pure serendipity.',
          difficulty: 'medium'
        },
        {
          word: 'Ephemeral',
          definition: 'Lasting for a very short time; transitory',
          image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&auto=format',
          type: 'adjective',
          category: 'descriptive',
          example: 'The beauty of cherry blossoms is ephemeral.',
          difficulty: 'medium'
        }
      ]
    });

    // Save the vocabulary set
    const savedSet = await sampleSet.save();
    console.log('Sample vocabulary set created:', savedSet._id);
    console.log('Title:', savedSet.title);
    console.log('Word count:', savedSet.wordCount);

    // Test finding the set
    const foundSet = await VocabularySet.findById(savedSet._id);
    console.log('Found set:', foundSet.title);

    // Clean up
    await VocabularySet.findByIdAndDelete(savedSet._id);
    console.log('Test vocabulary set cleaned up');

    console.log('Vocabulary functionality test completed successfully!');
  } catch (error) {
    console.error('Error testing vocabulary:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testVocabulary();
