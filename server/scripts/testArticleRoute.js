const mongoose = require('mongoose');
require('dotenv').config();

const testArticleRoute = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    const Article = require('../models/Article');
    const User = require('../models/User');

    // Test the exact logic from the route
    const articleId = '6896e61bbbae3cf09f0a9a19';
    console.log(`\n🔍 Testing article retrieval for ID: ${articleId}`);
    
    try {
      // Step 1: Find article without population
      console.log('Step 1: Finding article...');
      let article = await Article.findById(articleId)
        .where({ isPublished: true, isActive: true });

      if (!article) {
        console.log('❌ Article not found');
        return;
      }

      console.log('✅ Article found:', article.title);

      // Step 2: Try to populate author
      console.log('Step 2: Populating author...');
      try {
        if (article.author) {
          console.log('Author ID:', article.author);
          await article.populate('author', 'firstName lastName username');
          console.log('✅ Author populated successfully');
          console.log('Author data:', article.author);
        } else {
          console.log('⚠️  No author field found');
        }
      } catch (populateError) {
        console.log('❌ Failed to populate author:', populateError.message);
        console.log('Error details:', populateError);
      }

      // Step 3: Try to increment views
      console.log('Step 3: Incrementing views...');
      try {
        article.views = (article.views || 0) + 1;
        await article.save();
        console.log('✅ Views incremented successfully');
      } catch (saveError) {
        console.log('❌ Failed to increment views:', saveError.message);
        console.log('Error details:', saveError);
      }

      // Step 4: Check final article state
      console.log('\n📋 Final article state:');
      console.log('Title:', article.title);
      console.log('Author:', article.author);
      console.log('Views:', article.views);
      console.log('Content Type:', article.contentType);
      console.log('Category:', article.category);

    } catch (error) {
      console.log('❌ Error in article retrieval:', error.message);
      console.log('Error details:', error);
    }

    console.log('\n✅ Article route test completed!');

  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

testArticleRoute();
