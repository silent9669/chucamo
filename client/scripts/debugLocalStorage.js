// Debug localStorage data structure
console.log('🔍 Debugging localStorage data structure...');

// Get all localStorage keys
const allKeys = Object.keys(localStorage);
console.log('All localStorage keys:', allKeys);

// Look for test completion related keys
const testKeys = allKeys.filter(key => key.includes('test_completion') || key.includes('test') || key.includes('completion'));
console.log('Test-related keys:', testKeys);

// Check each test key
testKeys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    console.log(`\n🔍 Key: ${key}`);
    console.log('Data structure:', {
      hasAnsweredQuestions: !!data.answeredQuestions,
      answeredQuestionsType: Array.isArray(data.answeredQuestions) ? 'Array' : typeof data.answeredQuestions,
      answeredQuestionsLength: data.answeredQuestions?.length || 0,
      sampleAnsweredQuestion: data.answeredQuestions?.[0],
      fullData: data
    });
  } catch (error) {
    console.log(`\n❌ Error parsing key ${key}:`, error);
  }
});

// Also check for any other potential test data
const otherTestKeys = allKeys.filter(key => 
  key.includes('test') || 
  key.includes('question') || 
  key.includes('answer') ||
  key.includes('result')
);
console.log('\nOther potential test-related keys:', otherTestKeys);

otherTestKeys.forEach(key => {
  try {
    const data = localStorage.getItem(key);
    if (data && data.length > 100) {
      console.log(`\n🔍 Key: ${key} (truncated)`);
      console.log('Data preview:', data.substring(0, 200) + '...');
    } else {
      console.log(`\n🔍 Key: ${key}`);
      console.log('Data:', data);
    }
  } catch (error) {
    console.log(`\n❌ Error reading key ${key}:`, error);
  }
});
