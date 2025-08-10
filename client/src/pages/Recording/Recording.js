import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';

const Recording = () => {
  const [recordings, setRecordings] = useState([]);
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadRecordings = useCallback(async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRecordings([]);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading recordings:', error);
      toast.error('Failed to load recordings');
      setLoading(false);
    }
  }, []);

  const filterRecordings = useCallback(() => {
    let filtered = recordings;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(recording => recording.type === selectedType);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(recording =>
        recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecordings(filtered);
  }, [recordings, searchTerm, selectedType]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  useEffect(() => {
    filterRecordings();
  }, [filterRecordings]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recordings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recording Library</h1>
          <p className="text-gray-600">Access educational recordings</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search recordings, instructors, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Type */}
            <div className="flex items-center gap-3">
              <Filter className="text-gray-500 w-5 h-5" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Records</option>
                <option value="reading-writing">Reading & Writing</option>
                <option value="math">Math</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredRecordings.length} of {recordings.length} recordings
          </p>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings available</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No recordings available at the moment'
            }
          </p>
          {searchTerm || selectedType !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <p className="text-gray-500">Check back later for new content</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recording;
