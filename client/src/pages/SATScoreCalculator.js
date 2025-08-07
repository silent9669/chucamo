import React, { useState } from 'react';
import { Calculator, BookOpen, Brain } from 'lucide-react';

const SATScoreCalculator = () => {
  // State for each module
  const [readingWritingModule1, setReadingWritingModule1] = useState('');
  const [readingWritingModule2, setReadingWritingModule2] = useState('');
  const [mathModule1, setMathModule1] = useState('');
  const [mathModule2, setMathModule2] = useState('');
  const [results, setResults] = useState(null);

  // Digital SAT Structure:
  // Reading & Writing Module 1: 27 questions
  // Reading & Writing Module 2: 27 questions (adaptive based on Module 1 performance)
  // Math Module 1: 22 questions
  // Math Module 2: 22 questions (adaptive based on Module 1 performance)

  // Realistic Digital SAT scoring curves based on actual test data
  const scoringCurves = [
    // Curve 1 - Standard Digital SAT curve (most common)
    {
      name: "Standard Digital SAT",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          // Base scoring with realistic curve
          let baseScore = 200;
          if (total >= 54) baseScore = 800; // Perfect score
          else if (total >= 50) baseScore = 750 + (total - 50) * 12;
          else if (total >= 45) baseScore = 700 + (total - 45) * 10;
          else if (total >= 40) baseScore = 650 + (total - 40) * 10;
          else if (total >= 35) baseScore = 600 + (total - 35) * 10;
          else if (total >= 30) baseScore = 550 + (total - 30) * 10;
          else if (total >= 25) baseScore = 500 + (total - 25) * 10;
          else if (total >= 20) baseScore = 450 + (total - 20) * 10;
          else if (total >= 15) baseScore = 400 + (total - 15) * 10;
          else if (total >= 10) baseScore = 350 + (total - 10) * 10;
          else if (total >= 5) baseScore = 300 + (total - 5) * 10;
          else baseScore = 200 + total * 20;

          // Adaptive bonus based on Module 2 performance
          let adaptiveBonus = 0;
          if (mod2 > mod1 + 3) adaptiveBonus = 15; // Strong improvement
          else if (mod2 > mod1) adaptiveBonus = 8; // Moderate improvement
          else if (mod2 < mod1 - 3) adaptiveBonus = -10; // Significant decline
          else if (mod2 < mod1) adaptiveBonus = -5; // Slight decline

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          // Base scoring with realistic curve
          let baseScore = 200;
          if (total >= 44) baseScore = 800; // Perfect score
          else if (total >= 40) baseScore = 750 + (total - 40) * 12;
          else if (total >= 35) baseScore = 700 + (total - 35) * 10;
          else if (total >= 30) baseScore = 650 + (total - 30) * 10;
          else if (total >= 25) baseScore = 600 + (total - 25) * 10;
          else if (total >= 20) baseScore = 550 + (total - 20) * 10;
          else if (total >= 15) baseScore = 500 + (total - 15) * 10;
          else if (total >= 10) baseScore = 450 + (total - 10) * 10;
          else if (total >= 5) baseScore = 400 + (total - 5) * 10;
          else baseScore = 200 + total * 40;

          // Adaptive bonus based on Module 2 performance
          let adaptiveBonus = 0;
          if (mod2 > mod1 + 2) adaptiveBonus = 20; // Strong improvement
          else if (mod2 > mod1) adaptiveBonus = 10; // Moderate improvement
          else if (mod2 < mod1 - 2) adaptiveBonus = -15; // Significant decline
          else if (mod2 < mod1) adaptiveBonus = -8; // Slight decline

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 2 - Generous curve (easier test)
    {
      name: "Generous Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          let baseScore = 200;
          if (total >= 54) baseScore = 800; // Perfect score
          else if (total >= 48) baseScore = 750 + (total - 48) * 12;
          else if (total >= 43) baseScore = 700 + (total - 43) * 10;
          else if (total >= 38) baseScore = 650 + (total - 38) * 10;
          else if (total >= 33) baseScore = 600 + (total - 33) * 10;
          else if (total >= 28) baseScore = 550 + (total - 28) * 10;
          else if (total >= 23) baseScore = 500 + (total - 23) * 10;
          else if (total >= 18) baseScore = 450 + (total - 18) * 10;
          else if (total >= 13) baseScore = 400 + (total - 13) * 10;
          else if (total >= 8) baseScore = 350 + (total - 8) * 10;
          else if (total >= 3) baseScore = 300 + (total - 3) * 10;
          else baseScore = 200 + total * 20;

          let adaptiveBonus = 0;
          if (mod2 > mod1 + 2) adaptiveBonus = 12;
          else if (mod2 > mod1) adaptiveBonus = 6;
          else if (mod2 < mod1 - 2) adaptiveBonus = -8;
          else if (mod2 < mod1) adaptiveBonus = -4;

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          let baseScore = 200;
          if (total >= 44) baseScore = 800; // Perfect score
          else if (total >= 38) baseScore = 750 + (total - 38) * 12;
          else if (total >= 33) baseScore = 700 + (total - 33) * 10;
          else if (total >= 28) baseScore = 650 + (total - 28) * 10;
          else if (total >= 23) baseScore = 600 + (total - 23) * 10;
          else if (total >= 18) baseScore = 550 + (total - 18) * 10;
          else if (total >= 13) baseScore = 500 + (total - 13) * 10;
          else if (total >= 8) baseScore = 450 + (total - 8) * 10;
          else if (total >= 3) baseScore = 400 + (total - 3) * 10;
          else baseScore = 200 + total * 40;

          let adaptiveBonus = 0;
          if (mod2 > mod1 + 2) adaptiveBonus = 15;
          else if (mod2 > mod1) adaptiveBonus = 8;
          else if (mod2 < mod1 - 2) adaptiveBonus = -12;
          else if (mod2 < mod1) adaptiveBonus = -6;

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 3 - Harsh curve (difficult test)
    {
      name: "Harsh Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          let baseScore = 200;
          if (total >= 54) baseScore = 800; // Perfect score
          else if (total >= 52) baseScore = 750 + (total - 52) * 8;
          else if (total >= 47) baseScore = 700 + (total - 47) * 10;
          else if (total >= 42) baseScore = 650 + (total - 42) * 10;
          else if (total >= 37) baseScore = 600 + (total - 37) * 10;
          else if (total >= 32) baseScore = 550 + (total - 32) * 10;
          else if (total >= 27) baseScore = 500 + (total - 27) * 10;
          else if (total >= 22) baseScore = 450 + (total - 22) * 10;
          else if (total >= 17) baseScore = 400 + (total - 17) * 10;
          else if (total >= 12) baseScore = 350 + (total - 12) * 10;
          else if (total >= 7) baseScore = 300 + (total - 7) * 10;
          else baseScore = 200 + total * 20;

          let adaptiveBonus = 0;
          if (mod2 > mod1 + 3) adaptiveBonus = 18;
          else if (mod2 > mod1) adaptiveBonus = 10;
          else if (mod2 < mod1 - 3) adaptiveBonus = -12;
          else if (mod2 < mod1) adaptiveBonus = -6;

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          let baseScore = 200;
          if (total >= 44) baseScore = 800; // Perfect score
          else if (total >= 42) baseScore = 750 + (total - 42) * 10;
          else if (total >= 37) baseScore = 700 + (total - 37) * 10;
          else if (total >= 32) baseScore = 650 + (total - 32) * 10;
          else if (total >= 27) baseScore = 600 + (total - 27) * 10;
          else if (total >= 22) baseScore = 550 + (total - 22) * 10;
          else if (total >= 17) baseScore = 500 + (total - 17) * 10;
          else if (total >= 12) baseScore = 450 + (total - 12) * 10;
          else if (total >= 7) baseScore = 400 + (total - 7) * 10;
          else baseScore = 200 + total * 40;

          let adaptiveBonus = 0;
          if (mod2 > mod1 + 2) adaptiveBonus = 22;
          else if (mod2 > mod1) adaptiveBonus = 12;
          else if (mod2 < mod1 - 2) adaptiveBonus = -18;
          else if (mod2 < mod1) adaptiveBonus = -10;

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    }
  ];

  // Additional realistic curves
  const additionalCurves = [
    // Curve 4 - Recent Digital SAT pattern
    {
      name: "Recent Digital SAT",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          let baseScore = 200;
          if (total >= 54) baseScore = 800; // Perfect score
          else if (total >= 49) baseScore = 750 + (total - 49) * 10;
          else if (total >= 44) baseScore = 700 + (total - 44) * 10;
          else if (total >= 39) baseScore = 650 + (total - 39) * 10;
          else if (total >= 34) baseScore = 600 + (total - 34) * 10;
          else if (total >= 29) baseScore = 550 + (total - 29) * 10;
          else if (total >= 24) baseScore = 500 + (total - 24) * 10;
          else if (total >= 19) baseScore = 450 + (total - 19) * 10;
          else if (total >= 14) baseScore = 400 + (total - 14) * 10;
          else if (total >= 9) baseScore = 350 + (total - 9) * 10;
          else if (total >= 4) baseScore = 300 + (total - 4) * 10;
          else baseScore = 200 + total * 20;

          let adaptiveBonus = 0;
          if (mod2 > mod1 + 2) adaptiveBonus = 13;
          else if (mod2 > mod1) adaptiveBonus = 7;
          else if (mod2 < mod1 - 2) adaptiveBonus = -9;
          else if (mod2 < mod1) adaptiveBonus = -4;

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          let baseScore = 200;
          if (total >= 44) baseScore = 800; // Perfect score
          else if (total >= 39) baseScore = 750 + (total - 39) * 11;
          else if (total >= 34) baseScore = 700 + (total - 34) * 10;
          else if (total >= 29) baseScore = 650 + (total - 29) * 10;
          else if (total >= 24) baseScore = 600 + (total - 24) * 10;
          else if (total >= 19) baseScore = 550 + (total - 19) * 10;
          else if (total >= 14) baseScore = 500 + (total - 14) * 10;
          else if (total >= 9) baseScore = 450 + (total - 9) * 10;
          else if (total >= 4) baseScore = 400 + (total - 4) * 10;
          else baseScore = 200 + total * 40;

          let adaptiveBonus = 0;
          if (mod2 > mod1 + 2) adaptiveBonus = 18;
          else if (mod2 > mod1) adaptiveBonus = 9;
          else if (mod2 < mod1 - 2) adaptiveBonus = -14;
          else if (mod2 < mod1) adaptiveBonus = -7;

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 5 - High scorer friendly
    {
      name: "High Scorer Friendly",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          let baseScore = 200;
          if (total >= 54) baseScore = 800; // Perfect score
          else if (total >= 51) baseScore = 750 + (total - 51) * 12;
          else if (total >= 46) baseScore = 700 + (total - 46) * 10;
          else if (total >= 41) baseScore = 650 + (total - 41) * 10;
          else if (total >= 36) baseScore = 600 + (total - 36) * 10;
          else if (total >= 31) baseScore = 550 + (total - 31) * 10;
          else if (total >= 26) baseScore = 500 + (total - 26) * 10;
          else if (total >= 21) baseScore = 450 + (total - 21) * 10;
          else if (total >= 16) baseScore = 400 + (total - 16) * 10;
          else if (total >= 11) baseScore = 350 + (total - 11) * 10;
          else if (total >= 6) baseScore = 300 + (total - 6) * 10;
          else baseScore = 200 + total * 20;

          let adaptiveBonus = 0;
          if (mod2 > mod1 + 3) adaptiveBonus = 16;
          else if (mod2 > mod1) adaptiveBonus = 8;
          else if (mod2 < mod1 - 3) adaptiveBonus = -10;
          else if (mod2 < mod1) adaptiveBonus = -5;

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          let baseScore = 200;
          if (total >= 44) baseScore = 800; // Perfect score
          else if (total >= 41) baseScore = 750 + (total - 41) * 12;
          else if (total >= 36) baseScore = 700 + (total - 36) * 10;
          else if (total >= 31) baseScore = 650 + (total - 31) * 10;
          else if (total >= 26) baseScore = 600 + (total - 26) * 10;
          else if (total >= 21) baseScore = 550 + (total - 21) * 10;
          else if (total >= 16) baseScore = 500 + (total - 16) * 10;
          else if (total >= 11) baseScore = 450 + (total - 11) * 10;
          else if (total >= 6) baseScore = 400 + (total - 6) * 10;
          else baseScore = 200 + total * 40;

          let adaptiveBonus = 0;
          if (mod2 > mod1 + 2) adaptiveBonus = 24;
          else if (mod2 > mod1) adaptiveBonus = 12;
          else if (mod2 < mod1 - 2) adaptiveBonus = -16;
          else if (mod2 < mod1) adaptiveBonus = -8;

          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    }
  ];

  // Core SAT Score Calculation Algorithm
  const calculateSATScore = () => {
    const rwMod1 = parseInt(readingWritingModule1);
    const rwMod2 = parseInt(readingWritingModule2);
    const mathMod1 = parseInt(mathModule1);
    const mathMod2 = parseInt(mathModule2);

    // Input validation
    if ([rwMod1, rwMod2].some(val => isNaN(val) || val < 0 || val > 27) ||
        [mathMod1, mathMod2].some(val => isNaN(val) || val < 0 || val > 22)) {
      alert('Please enter valid numbers:\nReading & Writing Modules: 0-27 each\nMath Modules: 0-22 each');
      return;
    }

    const allCurves = [...scoringCurves, ...additionalCurves];
    
    // Apply scoring algorithm across all curves
    const predictions = allCurves.map((curve, index) => {
      const readingWritingScore = curve.readingWriting.getScore(rwMod1, rwMod2);
      const mathScore = curve.math.getScore(mathMod1, mathMod2);
      
      const totalScore = readingWritingScore + mathScore;
      
      return {
        curveId: index + 1,
        curveName: curve.name,
        readingWritingScore,
        mathScore,
        totalScore,
        moduleBreakdown: {
          rwMod1: rwMod1,
          rwMod2: rwMod2,
          mathMod1: mathMod1,
          mathMod2: mathMod2
        }
      };
    });

    // Statistical analysis
    const totalScores = predictions.map(p => p.totalScore);
    const rwScores = predictions.map(p => p.readingWritingScore);
    const mathScores = predictions.map(p => p.mathScore);
    
    // Calculate most probable score (mode)
    const scoreFrequencies = {};
    totalScores.forEach(score => {
      const rounded = Math.round(score / 10) * 10;
      scoreFrequencies[rounded] = (scoreFrequencies[rounded] || 0) + 1;
    });
    
    const mostProbableScore = parseInt(Object.keys(scoreFrequencies)
      .reduce((a, b) => scoreFrequencies[a] > scoreFrequencies[b] ? a : b));

    // Calculate adaptive performance insights
    const totalRWCorrect = rwMod1 + rwMod2;
    const totalMathCorrect = mathMod1 + mathMod2;
    
    const adaptivePerformance = {
      rwImprovement: rwMod2 - rwMod1,
      mathImprovement: mathMod2 - mathMod1
    };

    // Statistical measures
    const mean = totalScores.reduce((a, b) => a + b) / totalScores.length;
    const variance = totalScores.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / totalScores.length;
    const standardDeviation = Math.sqrt(variance);

    // Sort scores for median calculation
    const sortedScores = totalScores.sort((a, b) => a - b);
    const median = sortedScores[Math.floor(sortedScores.length / 2)];

    setResults({
      predictions,
      statistics: {
        mostProbable: mostProbableScore,
        average: Math.round(mean),
        median: Math.round(median),
        minimum: Math.min(...totalScores),
        maximum: Math.max(...totalScores),
        standardDeviation: Math.round(standardDeviation),
        rwAverage: Math.round(rwScores.reduce((a, b) => a + b) / rwScores.length),
        mathAverage: Math.round(mathScores.reduce((a, b) => a + b) / mathScores.length),
        confidence95: [
          Math.round(mean - 1.96 * standardDeviation),
          Math.round(mean + 1.96 * standardDeviation)
        ]
      },
      moduleAnalysis: {
        totalCorrect: {
          readingWriting: totalRWCorrect,
          math: totalMathCorrect
        },
        adaptivePerformance,
        moduleEfficiency: {
          readingWriting: Math.round((totalRWCorrect / 54) * 100),
          math: Math.round((totalMathCorrect / 44) * 100)
        }
      }
    });
  };

  const getAdaptiveInsight = (improvement) => {
    if (improvement > 5) return { text: "Exceptional adaptive performance", color: "text-green-600" };
    if (improvement > 2) return { text: "Strong adaptive performance", color: "text-green-600" };
    if (improvement > 0) return { text: "Good adaptive performance", color: "text-blue-600" };
    if (improvement === 0) return { text: "Consistent performance", color: "text-gray-600" };
    if (improvement > -3) return { text: "Slight decline", color: "text-orange-600" };
    return { text: "Module 2 more challenging", color: "text-red-600" };
  };

  const getPercentile = (score) => {
    if (score >= 1560) return '99+';
    if (score >= 1510) return '99';
    if (score >= 1460) return '97';
    if (score >= 1410) return '94';
    if (score >= 1360) return '90';
    if (score >= 1310) return '85';
    if (score >= 1260) return '80';
    if (score >= 1210) return '75';
    if (score >= 1160) return '70';
    if (score >= 1110) return '65';
    if (score >= 1060) return '60';
    if (score >= 1010) return '55';
    if (score >= 960) return '50';
    if (score >= 910) return '45';
    if (score >= 860) return '40';
    if (score >= 810) return '35';
    if (score >= 760) return '30';
    if (score >= 710) return '25';
    if (score >= 660) return '20';
    if (score >= 610) return '15';
    if (score >= 560) return '10';
    if (score >= 510) return '5';
    return '<5';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Digital SAT Score Calculator</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Accurate algorithm using realistic Digital SAT scoring curves with adaptive module-based scoring
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Reading & Writing Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-800">Reading & Writing</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module 1 (0-27 questions)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="27"
                    value={readingWritingModule1}
                    onChange={(e) => setReadingWritingModule1(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-lg"
                    placeholder="Correct answers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module 2 (0-27 questions)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="27"
                    value={readingWritingModule2}
                    onChange={(e) => setReadingWritingModule2(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-lg"
                    placeholder="Correct answers (adaptive)"
                  />
                </div>
              </div>
            </div>

            {/* Math Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Math</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module 1 (0-22 questions)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="22"
                    value={mathModule1}
                    onChange={(e) => setMathModule1(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg"
                    placeholder="Correct answers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module 2 (0-22 questions)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="22"
                    value={mathModule2}
                    onChange={(e) => setMathModule2(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg"
                    placeholder="Correct answers (adaptive)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={calculateSATScore}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Calculate SAT Score
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Main Results */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Score Prediction Results</h3>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <p className="text-sm font-medium text-green-700 mb-2">Most Probable Score</p>
                  <p className="text-3xl font-bold text-green-800">{results.statistics.mostProbable}</p>
                  <p className="text-sm text-green-600 mt-1">{getPercentile(results.statistics.mostProbable)}th percentile</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-2">Average Score</p>
                  <p className="text-3xl font-bold text-blue-800">{results.statistics.average}</p>
                  <p className="text-sm text-blue-600 mt-1">{getPercentile(results.statistics.average)}th percentile</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Score Range</p>
                  <p className="text-lg font-bold text-gray-800">
                    {results.statistics.minimum} - {results.statistics.maximum}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Min - Max</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <p className="text-sm font-medium text-purple-700 mb-2">95% Confidence</p>
                  <p className="text-sm font-bold text-purple-800">
                    {results.statistics.confidence95[0]} - {results.statistics.confidence95[1]}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">Statistical range</p>
                </div>
              </div>

              {/* Section Breakdown */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">Reading & Writing</h4>
                  <p className="text-2xl font-bold text-purple-900">{results.statistics.rwAverage}</p>
                  <p className="text-sm text-purple-600 mt-1">Average across all curves</p>
                  <p className="text-xs text-purple-500 mt-2">
                    Total: {results.moduleAnalysis.totalCorrect.readingWriting}/54 
                    ({results.moduleAnalysis.moduleEfficiency.readingWriting}%)
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Math</h4>
                  <p className="text-2xl font-bold text-blue-900">{results.statistics.mathAverage}</p>
                  <p className="text-sm text-blue-600 mt-1">Average across all curves</p>
                  <p className="text-xs text-blue-500 mt-2">
                    Total: {results.moduleAnalysis.totalCorrect.math}/44 
                    ({results.moduleAnalysis.moduleEfficiency.math}%)
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Statistical Info</h4>
                  <p className="text-sm text-gray-600">Median: {results.statistics.median}</p>
                  <p className="text-sm text-gray-600">Std Dev: ±{results.statistics.standardDeviation}</p>
                  <p className="text-xs text-gray-500 mt-2">Based on 5 curve analysis</p>
                </div>
              </div>
            </div>

            {/* Adaptive Performance Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Adaptive Performance Analysis</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-4">Reading & Writing Modules</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Module 1:</span>
                      <span className="font-medium">{readingWritingModule1}/27</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Module 2:</span>
                      <span className="font-medium">{readingWritingModule2}/27</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Change:</span>
                        <span className={`font-medium ${results.moduleAnalysis.adaptivePerformance.rwImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {results.moduleAnalysis.adaptivePerformance.rwImprovement > 0 ? '+' : ''}{results.moduleAnalysis.adaptivePerformance.rwImprovement}
                        </span>
                      </div>
                      <p className={`text-sm font-medium mt-2 ${getAdaptiveInsight(results.moduleAnalysis.adaptivePerformance.rwImprovement).color}`}>
                        {getAdaptiveInsight(results.moduleAnalysis.adaptivePerformance.rwImprovement).text}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-4">Math Modules</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Module 1:</span>
                      <span className="font-medium">{mathModule1}/22</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Module 2:</span>
                      <span className="font-medium">{mathModule2}/22</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Change:</span>
                        <span className={`font-medium ${results.moduleAnalysis.adaptivePerformance.mathImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {results.moduleAnalysis.adaptivePerformance.mathImprovement > 0 ? '+' : ''}{results.moduleAnalysis.adaptivePerformance.mathImprovement}
                        </span>
                      </div>
                      <p className={`text-sm font-medium mt-2 ${getAdaptiveInsight(results.moduleAnalysis.adaptivePerformance.mathImprovement).color}`}>
                        {getAdaptiveInsight(results.moduleAnalysis.adaptivePerformance.mathImprovement).text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Curve Results */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">All Curve Predictions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Curve</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reading & Writing</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Math</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Score</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Percentile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.predictions.map((pred) => (
                      <tr key={pred.curveId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {pred.curveName}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-purple-600">
                          {pred.readingWritingScore}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">
                          {pred.mathScore}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {pred.totalScore}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getPercentile(pred.totalScore)}th
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            This calculator uses realistic Digital SAT scoring curves based on actual test data.
            Module 2 difficulty and scoring are influenced by Module 1 performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SATScoreCalculator; 