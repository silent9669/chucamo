const mongoose = require('mongoose');
require('dotenv').config();

const checkArticleStructure = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    const Article = require('../models/Article');

    // Get all articles
    const allArticles = await Article.find({});
    console.log(`📚 Total articles in database: ${allArticles.length}`);

    if (allArticles.length === 0) {
      console.log('❌ No articles found in database');
      return;
    }

    // Check each article's structure
    console.log('\n🔍 Checking article structure...');
    allArticles.forEach((article, index) => {
      console.log(`\n--- Article ${index + 1} ---`);
      console.log(`ID: ${article._id}`);
      console.log(`Title: ${article.title}`);
      console.log(`Author: ${article.author}`);
      console.log(`Content Type: ${article.contentType || 'MISSING'}`);
      console.log(`Category: ${article.category || 'MISSING'}`);
      console.log(`Is Published: ${article.isPublished}`);
      console.log(`Is Active: ${article.isActive}`);
      console.log(`Views: ${article.views || 0}`);
      
      // Check for potential issues
      const issues = [];
      if (!article.contentType) issues.push('Missing contentType field');
      if (!article.category) issues.push('Missing category field');
      if (!article.author) issues.push('Missing author field');
      if (typeof article.views !== 'number') issues.push('Views field is not a number');
      
      if (issues.length > 0) {
        console.log(`⚠️  Issues found: ${issues.join(', ')}`);
      } else {
        console.log('✅ No structural issues found');
      }
    });

    // Check for articles with specific ID that was failing
    const failingId = '6896e61bbbae3cf09f0a9a19';
    console.log(`\n🔍 Checking specific failing article ID: ${failingId}`);
    
    try {
      const failingArticle = await Article.findById(failingId);
      if (failingArticle) {
        console.log('✅ Article found with failing ID');
        console.log(`Title: ${failingArticle.title}`);
        console.log(`Author: ${failingArticle.author}`);
        console.log(`Content Type: ${failingArticle.contentType || 'MISSING'}`);
        console.log(`Category: ${failingArticle.category || 'MISSING'}`);
      } else {
        console.log('❌ Article with failing ID not found');
      }
    } catch (error) {
      console.log(`❌ Error checking failing article: ${error.message}`);
    }

    console.log('\n✅ Article structure check completed!');

  } catch (error) {
    console.error('❌ Error checking article structure:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

checkArticleStructure();
