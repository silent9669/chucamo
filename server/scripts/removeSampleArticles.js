const mongoose = require('mongoose');
require('dotenv').config();
const Article = require('../models/Article');

async function removeSampleArticles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all articles
    const allArticles = await Article.find({});
    console.log(`Found ${allArticles.length} articles in the database`);

    if (allArticles.length === 0) {
      console.log('No articles found in the database.');
      process.exit(0);
    }

    // List all articles before deletion
    console.log('\nArticles to be deleted:');
    allArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (ID: ${article._id})`);
    });

    // Delete all articles
    const deleteResult = await Article.deleteMany({});
    console.log(`\nSuccessfully deleted ${deleteResult.deletedCount} articles from the database`);

    console.log('\nSample articles removal completed successfully!');
  } catch (error) {
    console.error('Error removing sample articles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

removeSampleArticles();
