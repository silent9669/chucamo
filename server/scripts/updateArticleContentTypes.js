const mongoose = require('mongoose');
require('dotenv').config();

const updateArticleContentTypes = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Get the Article model
    const Article = require('../models/Article');

    // Find all articles that don't have contentType field
    const articlesWithoutContentType = await Article.find({ contentType: { $exists: false } });
    console.log(`📚 Found ${articlesWithoutContentType.length} articles without contentType field`);

    if (articlesWithoutContentType.length === 0) {
      console.log('✅ All articles already have contentType field');
      return;
    }

    // Update all articles to have contentType field
    const updateResult = await Article.updateMany(
      { contentType: { $exists: false } },
      { $set: { contentType: 'articles' } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} articles with contentType field`);

    // Verify the update
    const updatedArticles = await Article.find({ contentType: 'articles' });
    console.log(`📊 Total articles with contentType 'articles': ${updatedArticles.length}`);

    // Show some statistics
    const allArticles = await Article.find({});
    const contentTypeStats = {};
    
    allArticles.forEach(article => {
      const type = article.contentType || 'unknown';
      contentTypeStats[type] = (contentTypeStats[type] || 0) + 1;
    });

    console.log('\n📈 Content Type Statistics:');
    Object.entries(contentTypeStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} articles`);
    });

    console.log('\n✅ Article content type update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating article content types:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

// Run the script
updateArticleContentTypes();
