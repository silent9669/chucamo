import React from 'react';

const PetHouse = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pet House
          </h1>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Coming Soon
            </h2>
            <p className="text-lg text-gray-600">
              This feature is under development. Check back later!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetHouse;
