const mongoose = require('mongoose');
require('dotenv').config();
const Article = require('../models/Article');
const User = require('../models/User');

// Sample articles to migrate to database
const sampleArticles = [
  {
    title: "SAT Math Strategies: Mastering Algebra",
    description: "Learn essential algebra strategies to improve your SAT Math score. This comprehensive guide covers key concepts, common pitfalls, and proven techniques.",
    content: `
      <h2>Introduction to SAT Algebra</h2>
      <p>Algebra is a fundamental component of the SAT Math section, accounting for approximately 35% of the questions. Understanding algebraic concepts and strategies is crucial for achieving a high score.</p>
      
      <h3>Key Algebraic Concepts</h3>
      <ul>
        <li><strong>Linear Equations:</strong> Master solving for variables in equations like 2x + 3 = 7</li>
        <li><strong>Systems of Equations:</strong> Learn substitution and elimination methods</li>
        <li><strong>Quadratic Equations:</strong> Understand factoring, completing the square, and the quadratic formula</li>
        <li><strong>Functions:</strong> Grasp function notation and transformations</li>
      </ul>
      
      <h3>Common Pitfalls to Avoid</h3>
      <p>Many students make these common mistakes:</p>
      <ul>
        <li>Forgetting to distribute negative signs</li>
        <li>Making arithmetic errors when solving equations</li>
        <li>Not checking their answers by plugging them back into the original equation</li>
        <li>Confusing similar-looking problems</li>
      </ul>
      
      <h3>Proven Strategies</h3>
      <p>Here are some effective strategies for algebra problems:</p>
      <ol>
        <li><strong>Read carefully:</strong> Identify what the question is asking for</li>
        <li><strong>Write down your work:</strong> Show all steps to avoid careless errors</li>
        <li><strong>Use the answer choices:</strong> Sometimes plugging in answers is faster than solving</li>
        <li><strong>Check your work:</strong> Always verify your answer makes sense</li>
      </ol>
      
      <h3>Practice Problems</h3>
      <p>Try these sample problems to test your understanding:</p>
      <p><strong>Problem 1:</strong> If 3x + 2y = 12 and x - y = 2, what is the value of x?</p>
      <p><strong>Problem 2:</strong> If f(x) = 2x² - 3x + 1, what is f(2)?</p>
      
      <h3>Conclusion</h3>
      <p>Mastering algebra is essential for SAT success. Practice regularly, learn from your mistakes, and develop a systematic approach to solving problems. Remember, consistency and understanding are more important than memorization.</p>
    `,
    difficulty: 'medium',
    category: 'math',
    tags: ['algebra', 'math', 'strategies', 'SAT'],
    featured: true
  },
  {
    title: "Reading Comprehension: Active Reading Techniques",
    description: "Discover proven active reading techniques that will help you understand and retain information better on the SAT Reading section.",
    content: `
      <h2>What is Active Reading?</h2>
      <p>Active reading is a technique that involves engaging with the text as you read, rather than passively absorbing information. This approach is particularly valuable for the SAT Reading section, where you need to quickly understand and analyze complex passages.</p>
      
      <h3>Key Active Reading Strategies</h3>
      <ul>
        <li><strong>Preview the Text:</strong> Read the title, headings, and first/last sentences of paragraphs</li>
        <li><strong>Ask Questions:</strong> Formulate questions about what you expect to learn</li>
        <li><strong>Make Predictions:</strong> Guess what will happen next based on context clues</li>
        <li><strong>Visualize:</strong> Create mental images of what you're reading</li>
        <li><strong>Summarize:</strong> Restate main ideas in your own words</li>
      </ul>
      
      <h3>Annotation Techniques</h3>
      <p>Effective annotation can significantly improve your comprehension:</p>
      <ul>
        <li><strong>Underline key ideas:</strong> Mark main points and supporting details</li>
        <li><strong>Circle important words:</strong> Highlight vocabulary and key terms</li>
        <li><strong>Write margin notes:</strong> Jot down questions, connections, or summaries</li>
        <li><strong>Use symbols:</strong> Create a system of symbols for different types of information</li>
      </ul>
      
      <h3>Question Types and Strategies</h3>
      <p>Different question types require different approaches:</p>
      <ul>
        <li><strong>Main Idea:</strong> Look for the central theme that connects all paragraphs</li>
        <li><strong>Detail Questions:</strong> Scan for specific information mentioned in the question</li>
        <li><strong>Inference Questions:</strong> Use context clues and logical reasoning</li>
        <li><strong>Vocabulary in Context:</strong> Use surrounding sentences to determine meaning</li>
      </ul>
      
      <h3>Time Management Tips</h3>
      <p>With limited time, efficiency is crucial:</p>
      <ol>
        <li>Spend 2-3 minutes previewing the passage</li>
        <li>Read actively, annotating as you go</li>
        <li>Answer questions in order, referring back to the text</li>
        <li>Use process of elimination for difficult questions</li>
        <li>Don't spend too much time on any single question</li>
      </ol>
      
      <h3>Practice Exercise</h3>
      <p>Try this exercise with any reading passage:</p>
      <ol>
        <li>Read the title and predict what the passage will be about</li>
        <li>Skim the first and last sentences of each paragraph</li>
        <li>Read the passage actively, underlining key points</li>
        <li>Write a one-sentence summary of each paragraph</li>
        <li>Create a brief outline of the main ideas</li>
      </ol>
      
      <h3>Conclusion</h3>
      <p>Active reading is a skill that improves with practice. The more you engage with texts actively, the better you'll become at understanding and analyzing complex passages. Remember, the goal is not just to read, but to comprehend and retain information effectively.</p>
    `,
    difficulty: 'medium',
    category: 'reading',
    tags: ['reading', 'comprehension', 'strategies', 'SAT'],
    featured: true
  },
  {
    title: "Writing and Language: Grammar Rules You Must Know",
    description: "Master the essential grammar rules that appear most frequently on the SAT Writing and Language section.",
    content: `
      <h2>Essential Grammar Rules for the SAT</h2>
      <p>The SAT Writing and Language section tests your knowledge of standard English conventions. While there are many grammar rules, some appear more frequently than others. Focus on mastering these key areas.</p>
      
      <h3>1. Subject-Verb Agreement</h3>
      <p>The verb must agree with its subject in number (singular or plural).</p>
      <ul>
        <li><strong>Correct:</strong> The student studies hard. (singular subject, singular verb)</li>
        <li><strong>Correct:</strong> The students study hard. (plural subject, plural verb)</li>
        <li><strong>Incorrect:</strong> The student study hard.</li>
      </ul>
      
      <h3>2. Pronoun Agreement</h3>
      <p>Pronouns must agree with their antecedents in number and gender.</p>
      <ul>
        <li><strong>Correct:</strong> Each student must bring his or her own book.</li>
        <li><strong>Correct:</strong> All students must bring their own books.</li>
        <li><strong>Incorrect:</strong> Each student must bring their own book.</li>
      </ul>
      
      <h3>3. Parallel Structure</h3>
      <p>Items in a series must be in the same grammatical form.</p>
      <ul>
        <li><strong>Correct:</strong> I like reading, writing, and studying.</li>
        <li><strong>Incorrect:</strong> I like reading, to write, and studying.</li>
      </ul>
      
      <h3>4. Comma Usage</h3>
      <p>Use commas to separate items in a series, set off introductory elements, and separate independent clauses joined by coordinating conjunctions.</p>
      <ul>
        <li><strong>Series:</strong> I bought apples, oranges, and bananas.</li>
        <li><strong>Introductory:</strong> After the movie, we went to dinner.</li>
        <li><strong>Independent clauses:</strong> I studied hard, and I passed the test.</li>
      </ul>
      
      <h3>5. Apostrophe Usage</h3>
      <p>Apostrophes indicate possession or contractions.</p>
      <ul>
        <li><strong>Possession:</strong> The student's book (singular), The students' books (plural)</li>
        <li><strong>Contractions:</strong> It's (it is), They're (they are), You're (you are)</li>
        <li><strong>Common mistake:</strong> Its vs. It's (Its = possession, It's = it is)</li>
      </ul>
      
      <h3>6. Sentence Structure</h3>
      <p>Avoid sentence fragments and run-on sentences.</p>
      <ul>
        <li><strong>Fragment:</strong> Because I was tired. (incomplete thought)</li>
        <li><strong>Run-on:</strong> I was tired I went to bed. (missing punctuation)</li>
        <li><strong>Correct:</strong> Because I was tired, I went to bed.</li>
      </ul>
      
      <h3>7. Modifier Placement</h3>
      <p>Place modifiers close to the words they modify to avoid confusion.</p>
      <ul>
        <li><strong>Misplaced:</strong> I found a book in the library that was interesting.</li>
        <li><strong>Correct:</strong> I found an interesting book in the library.</li>
      </ul>
      
      <h3>Common SAT Grammar Questions</h3>
      <p>Be prepared for these question types:</p>
      <ul>
        <li>Which choice best maintains the sentence structure established in the passage?</li>
        <li>Which choice provides the most logical transition?</li>
        <li>Which choice most effectively combines the sentences?</li>
        <li>Which choice best introduces the paragraph?</li>
      </ul>
      
      <h3>Study Tips</h3>
      <ol>
        <li>Practice identifying errors in sample passages</li>
        <li>Learn to recognize correct vs. incorrect usage</li>
        <li>Pay attention to context clues</li>
        <li>Read widely to develop an ear for correct grammar</li>
        <li>Use process of elimination on difficult questions</li>
      </ol>
      
      <h3>Conclusion</h3>
      <p>Grammar rules may seem overwhelming, but focusing on the most common patterns will significantly improve your SAT Writing and Language score. Practice regularly, and remember that understanding the rules is more important than memorizing them.</p>
    `,
    difficulty: 'medium',
    category: 'writing',
    tags: ['grammar', 'writing', 'rules', 'SAT'],
    featured: false
  },
  {
    title: "Test Day Strategies: Maximizing Your Performance",
    description: "Learn essential strategies for test day that will help you stay calm, focused, and perform at your best on the SAT.",
    content: `
      <h2>Preparing for Test Day</h2>
      <p>Success on the SAT isn't just about what you know—it's also about how you approach the test day itself. Proper preparation and mindset can make a significant difference in your performance.</p>
      
      <h3>The Night Before</h3>
      <ul>
        <li><strong>Get adequate sleep:</strong> Aim for 7-9 hours of quality sleep</li>
        <li><strong>Prepare your materials:</strong> Pack your ID, admission ticket, pencils, calculator, and snacks</li>
        <li><strong>Plan your route:</strong> Know how to get to the test center and how long it takes</li>
        <li><strong>Set multiple alarms:</strong> Ensure you wake up on time</li>
        <li><strong>Avoid cramming:</strong> Light review is fine, but don't study intensely</li>
      </ul>
      
      <h3>Test Day Morning</h3>
      <ul>
        <li><strong>Eat a healthy breakfast:</strong> Include protein and complex carbohydrates</li>
        <li><strong>Arrive early:</strong> Plan to arrive 30 minutes before the test starts</li>
        <li><strong>Dress comfortably:</strong> Wear layers in case the room temperature varies</li>
        <li><strong>Stay hydrated:</strong> Drink water but not too much to avoid frequent bathroom breaks</li>
      </ul>
      
      <h3>During the Test</h3>
      <p>These strategies will help you maintain focus and perform well:</p>
      <ul>
        <li><strong>Read instructions carefully:</strong> Don't skip or skim the directions</li>
        <li><strong>Manage your time:</strong> Keep track of time and pace yourself</li>
        <li><strong>Answer easy questions first:</strong> Build confidence and save time for difficult ones</li>
        <li><strong>Use process of elimination:</strong> Cross out obviously wrong answers</li>
        <li><strong>Show your work:</strong> Write down your reasoning, especially for math problems</li>
        <li><strong>Stay calm:</strong> If you get stuck, take a deep breath and move on</li>
      </ul>
      
      <h3>Section-Specific Strategies</h3>
      <p><strong>Reading Section:</strong></p>
      <ul>
        <li>Preview questions before reading the passage</li>
        <li>Read actively and annotate key information</li>
        <li>Answer questions in order, referring back to the text</li>
      </ul>
      
      <p><strong>Writing and Language Section:</strong></p>
      <ul>
        <li>Read the entire sentence or paragraph for context</li>
        <li>Look for grammatical errors and style issues</li>
        <li>Consider the most concise and clear option</li>
      </ul>
      
      <p><strong>Math Section:</strong></p>
      <ul>
        <li>Show all your work to avoid careless errors</li>
        <li>Use your calculator strategically</li>
        <li>Check your answers when possible</li>
        <li>Draw diagrams for geometry problems</li>
      </ul>
      
      <h3>Mental Strategies</h3>
      <ul>
        <li><strong>Stay positive:</strong> Believe in your preparation and abilities</li>
        <li><strong>Focus on the present:</strong> Don't worry about previous sections</li>
        <li><strong>Take breaks:</strong> Use the provided breaks to stretch and refresh</li>
        <li><strong>Stay hydrated and nourished:</strong> Eat snacks during breaks</li>
      </ul>
      
      <h3>Common Mistakes to Avoid</h3>
      <ul>
        <li>Rushing through questions without reading carefully</li>
        <li>Spending too much time on difficult questions</li>
        <li>Not using all the time available</li>
        <li>Forgetting to transfer answers to the answer sheet</li>
        <li>Letting anxiety affect your performance</li>
      </ul>
      
      <h3>After the Test</h3>
      <ul>
        <li>Don't discuss specific questions with other students</li>
        <li>Take time to relax and decompress</li>
        <li>Reflect on what went well and what you could improve</li>
        <li>Plan your next steps based on how you think you performed</li>
      </ul>
      
      <h3>Conclusion</h3>
      <p>Test day success comes from a combination of thorough preparation and smart test-taking strategies. Remember that the SAT is designed to be challenging, but with the right approach, you can perform at your best. Trust in your preparation and stay focused on doing your best on each question.</p>
    `,
    difficulty: 'easy',
    category: 'strategies',
    tags: ['test day', 'strategies', 'performance', 'SAT'],
    featured: true
  }
];

async function migrateArticles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user to assign as author
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`Using admin user: ${adminUser.username} as author`);

    // Check if articles already exist
    const existingArticles = await Article.countDocuments();
    if (existingArticles > 0) {
      console.log(`${existingArticles} articles already exist in the database.`);
      console.log('Skipping migration to avoid duplicates.');
      process.exit(0);
    }

    // Create articles with the admin user as author
    const articlesWithAuthor = sampleArticles.map(article => ({
      ...article,
      author: adminUser._id
    }));

    const createdArticles = await Article.insertMany(articlesWithAuthor);
    console.log(`Successfully migrated ${createdArticles.length} articles to the database:`);
    
    createdArticles.forEach(article => {
      console.log(`- ${article.title}`);
    });

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateArticles();
