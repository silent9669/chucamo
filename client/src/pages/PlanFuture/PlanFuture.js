import React from 'react';
import { Calendar, Target, TrendingUp } from 'lucide-react';

const PlanFuture = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Plan Your Future
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Set your academic goals, track your progress, and plan your path to success
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Coming Soon
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              We're working hard to bring you an amazing future planning experience. 
              This feature will help you set goals, track progress, and achieve your dreams.
            </p>
          </div>

          {/* Feature Preview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Goal Setting</h3>
              <p className="text-sm text-gray-600">Define your academic and career objectives</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-sm text-gray-600">Monitor your advancement toward goals</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Timeline Planning</h3>
              <p className="text-sm text-gray-600">Create realistic timelines for achievement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanFuture;
