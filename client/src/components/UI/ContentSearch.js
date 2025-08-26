import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiEye, FiFileText, FiBookOpen } from 'react-icons/fi';
import { testsAPI } from '../../services/api';
import logger from '../../utils/logger';

const ContentSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allTests, setAllTests] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    title: true,
    description: true,
    section: true,
    question: true,
    passage: true,
    explanation: true,
    option: true
  });
  const [sortBy, setSortBy] = useState('relevance'); // relevance, testName, matchCount

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 ContentSearch modal opened');
      console.log('📊 Current state:', {
        allTestsCount: allTests.length,
        searchTerm,
        searchResultsCount: searchResults.length,
        activeFilters,
        sortBy
      });
    }
  }, [isOpen, allTests.length, searchTerm, searchResults.length, activeFilters, sortBy]);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load all tests for searching with optimization
  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true);
        
        // Check if we already have tests loaded
        if (allTests.length > 0) {
          console.log('✅ Tests already loaded, skipping API call');
          setLoading(false);
          return;
        }
        
        console.log('🔍 Loading tests for content search...');
        
        // Load tests in batches for better performance
        const response = await testsAPI.getAll({ limit: 1000 });
        const tests = response.data.tests || [];
        
        console.log(`📚 Loaded ${tests.length} tests from API`);
        
        // Pre-process tests for faster searching
        const processedTests = tests.map(test => {
          try {
            return {
              ...test,
              searchIndex: {
                title: test.title?.toLowerCase() || '',
                description: test.description?.toLowerCase() || '',
                sections: test.sections?.map(section => ({
                  ...section,
                  name: section.name?.toLowerCase() || '',
                  questions: section.questions?.map(question => ({
                    ...question,
                    question: question.question?.toLowerCase() || '',
                    explanation: question.explanation?.toLowerCase() || '',
                    passage: question.passage?.toLowerCase() || '',
                    options: question.options?.map(option => ({
                      ...option,
                      content: option.content?.toLowerCase() || ''
                    })) || []
                  })) || []
                })) || []
              }
            };
          } catch (error) {
            console.error('❌ Error processing test for search index:', error, test);
            return test; // Return original test if processing fails
          }
        });
        
        console.log('✅ Search index created successfully');
        setAllTests(processedTests);
      } catch (error) {
        console.error('❌ Error loading tests for search:', error);
        logger.error('Error loading tests for search:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadTests();
    }
  }, [isOpen, allTests.length]);

  // Perform search when debounced search term changes
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 Performing search for:', debouncedSearchTerm);
    
    // Define performSearch inline to avoid dependency issues
    const performSearch = (term) => {
      if (!term.trim() || allTests.length === 0) {
        setSearchResults([]);
        return;
      }

      console.log('🔍 Starting search with:', { term, allTestsLength: allTests.length, activeFilters });
      
      const lowerTerm = term.toLowerCase();
      const results = [];

      allTests.forEach((test, testIndex) => {
        const testMatches = [];
        
        try {
          // Use pre-processed search index for faster searching
          const searchIndex = test.searchIndex;
          
          if (!searchIndex) {
            console.warn('⚠️ No search index for test:', test.title);
            return;
          }
          
          // Search in test title (only if filter is active)
          if (activeFilters.title && searchIndex.title && searchIndex.title.includes(lowerTerm)) {
            testMatches.push({
              type: 'title',
              field: 'title',
              content: test.title,
              testId: test._id,
              testTitle: test.title,
              section: null,
              question: null
            });
          }

          // Search in test description (only if filter is active)
          if (activeFilters.description && searchIndex.description && searchIndex.description.includes(lowerTerm)) {
            testMatches.push({
              type: 'description',
              field: 'description',
              content: test.description,
              testId: test._id,
              testTitle: test.title,
              section: null,
              question: null
            });
          }

          // Search in sections and questions using pre-processed index
          if (searchIndex.sections) {
            searchIndex.sections.forEach((sectionIndex, sectionIndexIdx) => {
              const section = test.sections[sectionIndexIdx];
              
                        // Search in section name (only if filter is active)
          if (activeFilters.section && sectionIndex.name && sectionIndex.name.includes(lowerTerm)) {
            testMatches.push({
              type: 'section',
              field: 'sectionName',
              content: section.name,
              testId: test._id,
              testTitle: test.title,
              section: section.name,
              question: null,
              sectionIndex: sectionIndexIdx + 1
            });
          }

              // Search in questions
              if (sectionIndex.questions) {
                sectionIndex.questions.forEach((questionIndex, questionIndexIdx) => {
                  const question = section.questions[questionIndexIdx];
                  
                  // Search in question content (only if filter is active)
                  if (activeFilters.question && questionIndex.question && questionIndex.question.includes(lowerTerm)) {
                    testMatches.push({
                      type: 'question',
                      field: 'question',
                      content: question.question,
                      testId: test._id,
                      testTitle: test.title,
                      section: section.name,
                      question: `Question ${questionIndexIdx + 1}`,
                      questionNumber: questionIndexIdx + 1,
                      sectionIndex: sectionIndexIdx + 1
                    });
                  }

                  // Search in question explanation (only if filter is active)
                  if (activeFilters.explanation && questionIndex.explanation && questionIndex.explanation.includes(lowerTerm)) {
                    testMatches.push({
                      type: 'explanation',
                      field: 'explanation',
                      content: question.explanation,
                      testId: test._id,
                      testTitle: test.title,
                      section: section.name,
                      question: `Question ${questionIndexIdx + 1}`,
                      questionNumber: questionIndexIdx + 1,
                      sectionIndex: sectionIndexIdx + 1
                    });
                  }

                  // Search in reading passage (only if filter is active)
                  if (activeFilters.passage && questionIndex.passage && questionIndex.passage.includes(lowerTerm)) {
                    testMatches.push({
                      type: 'passage',
                      field: 'passage',
                      content: question.passage,
                      testId: test._id,
                      testTitle: test.title,
                      section: section.name,
                      question: `Question ${questionIndexIdx + 1}`,
                      questionNumber: questionIndexIdx + 1,
                      sectionIndex: sectionIndexIdx + 1
                    });
                  }

                  // Search in question options (only if filter is active)
                  if (activeFilters.option && questionIndex.options) {
                    questionIndex.options.forEach((optionIndex, optionIndexIdx) => {
                      if (optionIndex.content && optionIndex.content.includes(lowerTerm)) {
                        const option = question.options[optionIndexIdx];
                        testMatches.push({
                          type: 'option',
                          field: 'option',
                          content: option.content,
                          testId: test._id,
                          testTitle: test.title,
                          section: section.name,
                          question: `Question ${questionIndexIdx + 1}, Option ${optionIndexIdx + 1}`,
                          questionNumber: questionIndexIdx + 1,
                          sectionIndex: sectionIndexIdx + 1
                        });
                      }
                    });
                  }
                });
              }
            });
          }

          // Add test to results if it has matches
          if (testMatches.length > 0) {
            results.push({
              test: test,
              matches: testMatches
            });
          }
        } catch (error) {
          console.error('❌ Error processing test during search:', error, test);
        }
      });

      console.log(`✅ Search completed. Found ${results.length} tests with matches`);
      
      // Sort results based on selected sorting option
      const sortedResults = sortSearchResults(results, sortBy);
      setSearchResults(sortedResults);
    };

    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, allTests, activeFilters, sortBy]);

  const sortSearchResults = (results, sortOption) => {
    console.log('🔄 Sorting results by:', sortOption);
    
    switch (sortOption) {
      case 'testName':
        return results.sort((a, b) => a.test.title.localeCompare(b.test.title));
      case 'matchCount':
        return results.sort((a, b) => b.matches.length - a.matches.length);
      case 'relevance':
      default:
        // Sort by relevance (more matches first, then alphabetically)
        return results.sort((a, b) => {
          if (b.matches.length !== a.matches.length) {
            return b.matches.length - a.matches.length;
          }
          return a.test.title.localeCompare(b.test.title);
        });
    }
  };



  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;

    try {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 px-1 rounded font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch (error) {
      console.error('❌ Error highlighting text:', error);
      return text;
    }
  };

  const getFieldIcon = (type) => {
    switch (type) {
      case 'title':
        return <FiFileText className="h-4 w-4 text-blue-600" />;
      case 'description':
        return <FiFileText className="h-4 w-4 text-green-600" />;
      case 'section':
        return <FiBookOpen className="h-4 w-4 text-purple-600" />;
      case 'question':
        return <FiFileText className="h-4 w-4 text-orange-600" />;
      case 'passage':
        return <FiBookOpen className="h-4 w-4 text-indigo-600" />;
      case 'explanation':
        return <FiFileText className="h-4 w-4 text-teal-600" />;
      case 'option':
        return <FiFileText className="h-4 w-4 text-gray-600" />;
      default:
        return <FiFileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFieldLabel = (type) => {
    switch (type) {
      case 'title':
        return 'Test Title';
      case 'description':
        return 'Test Description';
      case 'section':
        return 'Section Name';
      case 'question':
        return 'Question';
      case 'passage':
        return 'Reading Passage';
      case 'explanation':
        return 'Explanation';
      case 'option':
        return 'Answer Option';
      default:
        return 'Content';
    }
  };

  const handleViewTest = (testId) => {
    console.log('🔗 Navigating to test:', testId);
    navigate(`/test-details/${testId}`);
    onClose();
  };

  const handleClose = () => {
    console.log('❌ Closing ContentSearch modal');
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  // Get search suggestions using pre-processed index
  const getSearchSuggestions = () => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    try {
      const suggestions = new Set();
      const lowerTerm = searchTerm.toLowerCase();
      
      allTests.forEach(test => {
        const searchIndex = test.searchIndex;
        
        if (!searchIndex) return;
        
        // Add test title suggestions
        if (searchIndex.title && searchIndex.title.includes(lowerTerm)) {
          suggestions.add(test.title);
        }
        
        // Add section name suggestions
        if (searchIndex.sections) {
          searchIndex.sections.forEach(sectionIndex => {
            if (sectionIndex.name && sectionIndex.name.includes(lowerTerm)) {
              const section = test.sections.find(s => s.name.toLowerCase() === sectionIndex.name);
              if (section) {
                suggestions.add(section.name);
              }
            }
          });
        }
      });
      
      return Array.from(suggestions).slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
      console.error('❌ Error getting search suggestions:', error);
      return [];
    }
  };

  const suggestions = getSearchSuggestions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FiSearch className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Content Search</h2>
              {searchTerm && (
                <p className="text-sm text-gray-600 mt-1">
                  Searching for: <span className="font-medium text-blue-600">"{searchTerm}"</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for test names, reading passages, questions, or answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Suggestions:</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(suggestion)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters and Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Test count info */}
            <div className="text-xs text-gray-500 mb-2">
              Loaded {allTests.length} test{allTests.length !== 1 ? 's' : ''} for searching
            </div>
            
            {/* Warning when no filters are active */}
            {!Object.values(activeFilters).some(Boolean) && (
              <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                <div className="text-sm text-yellow-800">
                  ⚠️ No search filters are active. Please enable at least one filter to search.
                </div>
              </div>
            )}
            
            {/* Content Type Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Search in:</span>
              {Object.entries(activeFilters).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 capitalize">
                    {key === 'passage' ? 'Reading Passages' : key}
                  </span>
                </label>
              ))}
              <button
                onClick={() => setActiveFilters({
                  title: true,
                  description: true,
                  section: true,
                  question: true,
                  passage: true,
                  explanation: true,
                  option: true
                })}
                className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
              >
                Reset All
              </button>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="testName">Test Name</option>
                <option value="matchCount">Match Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 300px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <div className="text-gray-600 mb-2">
                  {searchTerm ? `Searching for "${searchTerm}"...` : 'Loading tests...'}
                </div>
                <div className="text-sm text-gray-500">
                  {allTests.length > 0 ? `Loaded ${allTests.length} tests` : 'Preparing search index...'}
                </div>
              </div>
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="text-center py-8">
              <FiSearch className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No results found for "{searchTerm}"</p>
              <p className="text-sm text-gray-500 mt-2">
                Try searching for different terms or check your filter settings
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Active filters:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(activeFilters).map(([key, isActive]) => (
                    <span
                      key={key}
                      className={`px-2 py-1 rounded text-xs ${
                        isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {key === 'passage' ? 'Reading Passages' : key}: {isActive ? 'ON' : 'OFF'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : searchTerm && searchResults.length > 0 ? (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Found {searchResults.length} test{searchResults.length !== 1 ? 's' : ''} with {searchResults.reduce((total, result) => total + result.matches.length, 0)} match{searchResults.reduce((total, result) => total + result.matches.length, 0) !== 1 ? 'es' : ''} for <span className="font-medium text-blue-600">"{searchTerm}"</span>
                {searchResults.length > 50 && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Showing first 50 results for performance)
                  </span>
                )}
              </div>

              {/* Search Statistics */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="text-sm font-medium text-blue-900 mb-2">Search Breakdown:</div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {Object.entries(activeFilters).map(([key, isActive]) => {
                    if (!isActive) return null;
                    const count = searchResults.reduce((total, result) => 
                      total + result.matches.filter(match => match.type === key).length, 0
                    );
                    return (
                      <div key={key} className="flex items-center space-x-1">
                        <span className="text-blue-700 capitalize">
                          {key === 'passage' ? 'Reading Passages' : key}:
                        </span>
                        <span className="font-medium text-blue-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {searchResults.slice(0, 50).map((result, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* Test Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {highlightText(result.test.title, searchTerm)}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="capitalize">{result.test.type}</span>
                        <span>•</span>
                        <span>{result.test.totalQuestions || 0} questions</span>
                        <span>•</span>
                        <span>{result.test.totalTime || 0} minutes</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewTest(result.test._id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiEye className="h-4 w-4" />
                      <span>View Test</span>
                    </button>
                  </div>

                  {/* Matches */}
                  <div className="space-y-3">
                    {result.matches.map((match, matchIndex) => (
                      <div key={matchIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getFieldIcon(match.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {getFieldLabel(match.type)}
                              </span>
                              {match.section && (
                                <span className="text-xs text-gray-600">
                                  Section: {match.section}
                                  {match.sectionIndex && (
                                    <span className="text-blue-600 font-medium ml-1">
                                      (S{match.sectionIndex})
                                    </span>
                                  )}
                                </span>
                              )}
                              {match.questionNumber && (
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                  Q{match.questionNumber}
                                  {match.sectionIndex && ` (S${match.sectionIndex})`}
                                </span>
                              )}
                              {match.question && !match.questionNumber && (
                                <span className="text-xs text-gray-600">
                                  {match.question}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-800 leading-relaxed">
                              {highlightText(match.content, searchTerm)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiSearch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>Start typing to search through your test content</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">Search Tips:</p>
                <ul className="text-xs text-gray-600 space-y-1 text-left">
                  <li>• Search for specific topics like "climate change" or "quadratic equations"</li>
                  <li>• Use the filters to focus on specific content types</li>
                  <li>• Try different search terms if no results are found</li>
                  <li>• Use Ctrl+K (or Cmd+K) to quickly open this search</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentSearch;
