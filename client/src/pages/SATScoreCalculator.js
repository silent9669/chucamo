import React, { useState } from 'react';
import { Calculator, BookOpen, Brain, GraduationCap, MapPin, ExternalLink, Filter } from 'lucide-react';

const SATScoreCalculator = () => {
  // State for each module
  const [readingWritingModule1, setReadingWritingModule1] = useState('');
  const [readingWritingModule2, setReadingWritingModule2] = useState('');
  const [mathModule1, setMathModule1] = useState('');
  const [mathModule2, setMathModule2] = useState('');
  const [results, setResults] = useState(null);
  
  // State for university filter
  const [universityFilter, setUniversityFilter] = useState('all'); // 'all', 'reach', 'target', 'safety'
  const [showAllUniversities, setShowAllUniversities] = useState(false);

  // Digital SAT Structure:
  // Reading & Writing Module 1: 27 questions
  // Reading & Writing Module 2: 27 questions (adaptive based on Module 1 performance)
  // Math Module 1: 22 questions
  // Math Module 2: 22 questions (adaptive based on Module 1 performance)

  // Historical SAT scoring curves with adaptive module weighting
  const scoringCurves = [
    // Curve 1 - Standard curve
    {
      name: "Standard Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 20 ? 8 : mod2 < 10 ? -8 : 0; // Reduced bonus
          let baseScore = 200 + (total / 54) * 600;
          if (total > 45) baseScore += (total - 45) * 4; // Reduced bonus
          if (total > 50) baseScore += (total - 50) * 3; // Reduced bonus
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 18 ? 12 : mod2 < 8 ? -12 : 0; // Reduced bonus
          let baseScore = 200 + (total / 44) * 600;
          if (total > 35) baseScore += (total - 35) * 4; // Reduced bonus
          if (total > 40) baseScore += (total - 40) * 3; // Reduced bonus
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 2 - Generous curve
    {
      name: "Generous Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 20 ? 12 : mod2 < 10 ? -4 : 0; // Reduced bonus
          let baseScore = 220 + (total / 54) * 580;
          if (total > 40) baseScore += (total - 40) * 6; // Reduced bonus
          if (total > 48) baseScore += (total - 48) * 4; // Reduced bonus
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 18 ? 15 : mod2 < 8 ? -8 : 0; // Reduced bonus
          let baseScore = 220 + (total / 44) * 580;
          if (total > 30) baseScore += (total - 30) * 6; // Reduced bonus
          if (total > 38) baseScore += (total - 38) * 4; // Reduced bonus
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 3 - Harsh curve
    {
      name: "Harsh Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 22 ? 5 : mod2 < 12 ? -15 : 0;
          let baseScore = 180 + (total / 54) * 620;
          if (total > 48) baseScore += (total - 48) * 6;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 19 ? 10 : mod2 < 9 ? -20 : 0;
          let baseScore = 180 + (total / 44) * 620;
          if (total > 38) baseScore += (total - 38) * 6;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    }
  ];

  // Fixed additional curves (no randomization for consistency)
  const additionalCurves = [
    // Curve 4 - Slightly generous
    {
      name: "Slightly Generous",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 20 ? 12 : mod2 < 10 ? -8 : 0;
          let baseScore = 210 + (total / 54) * 590;
          if (total > 42) baseScore += (total - 42) * 6;
          if (total > 48) baseScore += (total - 48) * 4;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 18 ? 18 : mod2 < 8 ? -12 : 0;
          let baseScore = 210 + (total / 44) * 590;
          if (total > 35) baseScore += (total - 35) * 6;
          if (total > 40) baseScore += (total - 40) * 4;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 5 - Moderate
    {
      name: "Moderate",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 21 ? 8 : mod2 < 11 ? -12 : 0;
          let baseScore = 195 + (total / 54) * 605;
          if (total > 44) baseScore += (total - 44) * 7;
          if (total > 49) baseScore += (total - 49) * 5;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 17 ? 12 : mod2 < 9 ? -18 : 0;
          let baseScore = 195 + (total / 44) * 605;
          if (total > 36) baseScore += (total - 36) * 7;
          if (total > 41) baseScore += (total - 41) * 5;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 6 - Slightly harsh
    {
      name: "Slightly Harsh",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 22 ? 6 : mod2 < 12 ? -16 : 0;
          let baseScore = 185 + (total / 54) * 615;
          if (total > 46) baseScore += (total - 46) * 5;
          if (total > 50) baseScore += (total - 50) * 3;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 19 ? 8 : mod2 < 9 ? -22 : 0;
          let baseScore = 185 + (total / 44) * 615;
          if (total > 37) baseScore += (total - 37) * 5;
          if (total > 42) baseScore += (total - 42) * 3;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 7 - Average performance curve
    {
      name: "Average Performance",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 19 ? 10 : mod2 < 9 ? -10 : 0;
          let baseScore = 200 + (total / 54) * 600;
          if (total > 43) baseScore += (total - 43) * 6;
          if (total > 48) baseScore += (total - 48) * 4;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 17 ? 15 : mod2 < 7 ? -15 : 0;
          let baseScore = 200 + (total / 44) * 600;
          if (total > 34) baseScore += (total - 34) * 6;
          if (total > 39) baseScore += (total - 39) * 4;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 8 - High scorer friendly
    {
      name: "High Scorer Friendly",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 23 ? 12 : mod2 < 13 ? -4 : 0; // Reduced bonus
          let baseScore = 215 + (total / 54) * 585;
          if (total > 40) baseScore += (total - 40) * 5; // Reduced bonus
          if (total > 47) baseScore += (total - 47) * 4; // Reduced bonus
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 20 ? 18 : mod2 < 10 ? -6 : 0; // Reduced bonus
          let baseScore = 215 + (total / 44) * 585;
          if (total > 32) baseScore += (total - 32) * 5; // Reduced bonus
          if (total > 38) baseScore += (total - 38) * 4; // Reduced bonus
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 9 - Balanced curve
    {
      name: "Balanced Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 20 ? 9 : mod2 < 10 ? -11 : 0;
          let baseScore = 190 + (total / 54) * 610;
          if (total > 45) baseScore += (total - 45) * 7;
          if (total > 50) baseScore += (total - 50) * 5;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 18 ? 14 : mod2 < 8 ? -16 : 0;
          let baseScore = 190 + (total / 44) * 610;
          if (total > 36) baseScore += (total - 36) * 7;
          if (total > 41) baseScore += (total - 41) * 5;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 10 - Strict curve
    {
      name: "Strict Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 24 ? 4 : mod2 < 14 ? -18 : 0;
          let baseScore = 175 + (total / 54) * 625;
          if (total > 47) baseScore += (total - 47) * 4;
          if (total > 52) baseScore += (total - 52) * 2;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 20 ? 6 : mod2 < 10 ? -25 : 0;
          let baseScore = 175 + (total / 44) * 625;
          if (total > 38) baseScore += (total - 38) * 4;
          if (total > 43) baseScore += (total - 43) * 2;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 11 - Forgiving curve
    {
      name: "Forgiving Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 18 ? 10 : mod2 < 8 ? -5 : 0; // Reduced bonus
          let baseScore = 225 + (total / 54) * 575;
          if (total > 38) baseScore += (total - 38) * 5; // Reduced bonus
          if (total > 45) baseScore += (total - 45) * 4; // Reduced bonus
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 16 ? 18 : mod2 < 6 ? -8 : 0; // Reduced bonus
          let baseScore = 225 + (total / 44) * 575;
          if (total > 28) baseScore += (total - 28) * 5; // Reduced bonus
          if (total > 36) baseScore += (total - 36) * 4; // Reduced bonus
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 12 - Mid-range focus
    {
      name: "Mid-range Focus",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 21 ? 7 : mod2 < 11 ? -13 : 0;
          let baseScore = 205 + (total / 54) * 595;
          if (total > 41) baseScore += (total - 41) * 5;
          if (total > 49) baseScore += (total - 49) * 6;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 19 ? 11 : mod2 < 9 ? -19 : 0;
          let baseScore = 205 + (total / 44) * 595;
          if (total > 33) baseScore += (total - 33) * 5;
          if (total > 40) baseScore += (total - 40) * 6;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    },
    // Curve 13 - Recent test curve
    {
      name: "Recent Test Curve",
      readingWriting: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 22 ? 11 : mod2 < 12 ? -14 : 0;
          let baseScore = 188 + (total / 54) * 612;
          if (total > 44) baseScore += (total - 44) * 6;
          if (total > 51) baseScore += (total - 51) * 4;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      },
      math: {
        getScore: (mod1, mod2) => {
          const total = mod1 + mod2;
          const adaptiveBonus = mod2 > 18 ? 16 : mod2 < 8 ? -20 : 0;
          let baseScore = 188 + (total / 44) * 612;
          if (total > 35) baseScore += (total - 35) * 6;
          if (total > 42) baseScore += (total - 42) * 4;
          return Math.max(200, Math.min(800, Math.round(baseScore + adaptiveBonus)));
        }
      }
    }
  ];

  // University Database with SAT Score Requirements
  const universities = [
    // Ivy League Universities
    {
      name: "Harvard University",
      location: "Cambridge, MA",
      type: "Ivy League",
      satRange: { min: 1460, max: 1580 },
      acceptanceRate: 4.6,
      ranking: 1,
      category: "Reach",
      description: "One of the most prestigious universities in the world",
      website: "https://www.harvard.edu"
    },
    {
      name: "Yale University",
      location: "New Haven, CT",
      type: "Ivy League",
      satRange: { min: 1460, max: 1580 },
      acceptanceRate: 6.2,
      ranking: 2,
      category: "Reach",
      description: "Renowned for its liberal arts education",
      website: "https://www.yale.edu"
    },
    {
      name: "Princeton University",
      location: "Princeton, NJ",
      type: "Ivy League",
      satRange: { min: 1450, max: 1570 },
      acceptanceRate: 5.8,
      ranking: 3,
      category: "Reach",
      description: "Known for its strong undergraduate focus",
      website: "https://www.princeton.edu"
    },
    {
      name: "Columbia University",
      location: "New York, NY",
      type: "Ivy League",
      satRange: { min: 1440, max: 1570 },
      acceptanceRate: 6.1,
      ranking: 4,
      category: "Reach",
      description: "Located in the heart of Manhattan",
      website: "https://www.columbia.edu"
    },
    {
      name: "University of Pennsylvania",
      location: "Philadelphia, PA",
      type: "Ivy League",
      satRange: { min: 1440, max: 1560 },
      acceptanceRate: 8.4,
      ranking: 5,
      category: "Reach",
      description: "Strong in business and pre-professional programs",
      website: "https://www.upenn.edu"
    },
    {
      name: "Dartmouth College",
      location: "Hanover, NH",
      type: "Ivy League",
      satRange: { min: 1430, max: 1550 },
      acceptanceRate: 9.2,
      ranking: 6,
      category: "Reach",
      description: "Small liberal arts college with strong traditions",
      website: "https://www.dartmouth.edu"
    },
    {
      name: "Brown University",
      location: "Providence, RI",
      type: "Ivy League",
      satRange: { min: 1420, max: 1550 },
      acceptanceRate: 7.1,
      ranking: 7,
      category: "Reach",
      description: "Known for its open curriculum",
      website: "https://www.brown.edu"
    },
    {
      name: "Cornell University",
      location: "Ithaca, NY",
      type: "Ivy League",
      satRange: { min: 1400, max: 1540 },
      acceptanceRate: 10.7,
      ranking: 8,
      category: "Reach",
      description: "Largest Ivy League with diverse programs",
      website: "https://www.cornell.edu"
    },

    // Top Public Universities
    {
      name: "University of California, Berkeley",
      location: "Berkeley, CA",
      type: "Public",
      satRange: { min: 1330, max: 1530 },
      acceptanceRate: 14.9,
      ranking: 9,
      category: "Reach",
      description: "Top public university with strong research programs",
      website: "https://www.berkeley.edu"
    },
    {
      name: "University of California, Los Angeles",
      location: "Los Angeles, CA",
      type: "Public",
      satRange: { min: 1310, max: 1520 },
      acceptanceRate: 12.3,
      ranking: 10,
      category: "Reach",
      description: "Located in vibrant LA with diverse opportunities",
      website: "https://www.ucla.edu"
    },
    {
      name: "University of Michigan",
      location: "Ann Arbor, MI",
      type: "Public",
      satRange: { min: 1340, max: 1530 },
      acceptanceRate: 20.2,
      ranking: 11,
      category: "Target",
      description: "Excellent research university with strong athletics",
      website: "https://www.umich.edu"
    },
    {
      name: "University of Virginia",
      location: "Charlottesville, VA",
      type: "Public",
      satRange: { min: 1340, max: 1520 },
      acceptanceRate: 20.7,
      ranking: 12,
      category: "Target",
      description: "Founded by Thomas Jefferson with beautiful campus",
      website: "https://www.virginia.edu"
    },
    {
      name: "University of North Carolina at Chapel Hill",
      location: "Chapel Hill, NC",
      type: "Public",
      satRange: { min: 1320, max: 1500 },
      acceptanceRate: 19.2,
      ranking: 13,
      category: "Target",
      description: "First public university in the US",
      website: "https://www.unc.edu"
    },

    // Top Private Universities
    {
      name: "Stanford University",
      location: "Stanford, CA",
      type: "Private",
      satRange: { min: 1440, max: 1570 },
      acceptanceRate: 4.3,
      ranking: 14,
      category: "Reach",
      description: "Located in Silicon Valley with strong tech focus",
      website: "https://www.stanford.edu"
    },
    {
      name: "Massachusetts Institute of Technology",
      location: "Cambridge, MA",
      type: "Private",
      satRange: { min: 1510, max: 1580 },
      acceptanceRate: 6.7,
      ranking: 15,
      category: "Reach",
      description: "World leader in science and technology",
      website: "https://www.mit.edu"
    },
    {
      name: "University of Chicago",
      location: "Chicago, IL",
      type: "Private",
      satRange: { min: 1500, max: 1560 },
      acceptanceRate: 6.2,
      ranking: 16,
      category: "Reach",
      description: "Known for rigorous academics and intellectual discourse",
      website: "https://www.uchicago.edu"
    },
    {
      name: "Duke University",
      location: "Durham, NC",
      type: "Private",
      satRange: { min: 1480, max: 1560 },
      acceptanceRate: 7.7,
      ranking: 17,
      category: "Reach",
      description: "Strong in both academics and athletics",
      website: "https://www.duke.edu"
    },
    {
      name: "Northwestern University",
      location: "Evanston, IL",
      type: "Private",
      satRange: { min: 1440, max: 1550 },
      acceptanceRate: 9.1,
      ranking: 18,
      category: "Reach",
      description: "Located near Chicago with strong journalism program",
      website: "https://www.northwestern.edu"
    },
    {
      name: "Vanderbilt University",
      location: "Nashville, TN",
      type: "Private",
      satRange: { min: 1440, max: 1550 },
      acceptanceRate: 9.6,
      ranking: 19,
      category: "Reach",
      description: "Southern Ivy with strong pre-med program",
      website: "https://www.vanderbilt.edu"
    },
    {
      name: "Rice University",
      location: "Houston, TX",
      type: "Private",
      satRange: { min: 1420, max: 1540 },
      acceptanceRate: 9.5,
      ranking: 20,
      category: "Reach",
      description: "Small private university with strong STEM programs",
      website: "https://www.rice.edu"
    },

    // Target Schools
    {
      name: "University of Texas at Austin",
      location: "Austin, TX",
      type: "Public",
      satRange: { min: 1230, max: 1480 },
      acceptanceRate: 31.8,
      ranking: 21,
      category: "Target",
      description: "Large public university with strong business program",
      website: "https://www.utexas.edu"
    },
    {
      name: "University of Wisconsin-Madison",
      location: "Madison, WI",
      type: "Public",
      satRange: { min: 1300, max: 1480 },
      acceptanceRate: 51.7,
      ranking: 22,
      category: "Target",
      description: "Excellent research university with strong school spirit",
      website: "https://www.wisc.edu"
    },
    {
      name: "University of Illinois at Urbana-Champaign",
      location: "Urbana-Champaign, IL",
      type: "Public",
      satRange: { min: 1220, max: 1480 },
      acceptanceRate: 59.0,
      ranking: 23,
      category: "Target",
      description: "Strong in engineering and computer science",
      website: "https://www.illinois.edu"
    },
    {
      name: "University of Washington",
      location: "Seattle, WA",
      type: "Public",
      satRange: { min: 1200, max: 1470 },
      acceptanceRate: 53.5,
      ranking: 24,
      category: "Target",
      description: "Located in tech hub with strong research programs",
      website: "https://www.washington.edu"
    },
    {
      name: "Boston University",
      location: "Boston, MA",
      type: "Private",
      satRange: { min: 1340, max: 1510 },
      acceptanceRate: 18.9,
      ranking: 25,
      category: "Target",
      description: "Urban university with strong international programs",
      website: "https://www.bu.edu"
    },
    {
      name: "New York University",
      location: "New York, NY",
      type: "Private",
      satRange: { min: 1350, max: 1530 },
      acceptanceRate: 16.2,
      ranking: 26,
      category: "Target",
      description: "Located in the heart of Manhattan",
      website: "https://www.nyu.edu"
    },

    // Safety Schools
    {
      name: "University of Florida",
      location: "Gainesville, FL",
      type: "Public",
      satRange: { min: 1330, max: 1470 },
      acceptanceRate: 30.1,
      ranking: 27,
      category: "Safety",
      description: "Large public university with strong athletics",
      website: "https://www.ufl.edu"
    },
    {
      name: "University of Georgia",
      location: "Athens, GA",
      type: "Public",
      satRange: { min: 1240, max: 1420 },
      acceptanceRate: 42.8,
      ranking: 28,
      category: "Safety",
      description: "Beautiful campus with strong business program",
      website: "https://www.uga.edu"
    },
    {
      name: "University of Pittsburgh",
      location: "Pittsburgh, PA",
      type: "Public",
      satRange: { min: 1250, max: 1430 },
      acceptanceRate: 56.7,
      ranking: 29,
      category: "Safety",
      description: "Urban university with strong health sciences",
      website: "https://www.pitt.edu"
    },
    {
      name: "Penn State University",
      location: "University Park, PA",
      type: "Public",
      satRange: { min: 1160, max: 1370 },
      acceptanceRate: 54.2,
      ranking: 30,
      category: "Safety",
      description: "Large university with strong school spirit",
      website: "https://www.psu.edu"
    },
    {
      name: "University of Connecticut",
      location: "Storrs, CT",
      type: "Public",
      satRange: { min: 1200, max: 1390 },
      acceptanceRate: 48.8,
      ranking: 31,
      category: "Safety",
      description: "Strong public university in New England",
      website: "https://www.uconn.edu"
    },
    {
      name: "University of Delaware",
      location: "Newark, DE",
      type: "Public",
      satRange: { min: 1160, max: 1350 },
      acceptanceRate: 65.5,
      ranking: 32,
      category: "Safety",
      description: "Mid-sized public university with strong programs",
      website: "https://www.udel.edu"
    }
  ];

  // Updated University Recommendation Algorithm with new %match calculation
  const getUniversityRecommendations = (satScore) => {
    const recommendations = {
      reach: [],
      target: [],
      safety: []
    };

    universities.forEach(university => {
      const { satRange, category, acceptanceRate } = university;
      const rangeSize = satRange.max - satRange.min;
      
      // Calculate match percentage based on range score data
      // Using the rule: 1600 is maximum, if range is 1200-1400 then 100% match
      let matchPercentage = 0;
      let scoreStatus = '';
      
      if (satScore >= satRange.min && satScore <= satRange.max) {
        // Score is within range - calculate percentage based on position within range
        const positionInRange = (satScore - satRange.min) / rangeSize;
        matchPercentage = Math.round(60 + (positionInRange * 40)); // 60-100% range
        scoreStatus = 'Within Range';
      } else if (satScore > satRange.max) {
        // Score is above range - IMPROVED: Higher scores should have very high match percentage
        // For a school with range 1200-1400, a 1600 score should be 100% match
        // For a score of 1430 with range up to 1350, should be very high match
        const distanceAbove = satScore - satRange.max;
        const maxPossibleDistance = 1600 - satRange.max; // Distance to perfect score
        const percentageAbove = Math.min(1, distanceAbove / maxPossibleDistance);
        // Enhanced logic: the higher the score above range, the higher the match percentage
        // This ensures that significantly higher scores get very high match percentages
        matchPercentage = Math.round(85 + (percentageAbove * 15)); // 85-100% range for scores above range
        scoreStatus = 'Above Range';
      } else {
        // Score is below range - calculate percentage based on how much below
        const distanceBelow = satRange.min - satScore;
        const maxPossibleDistance = satRange.min - 400; // Distance from minimum possible
        const percentageBelow = Math.min(1, distanceBelow / maxPossibleDistance);
        matchPercentage = Math.round(20 - (percentageBelow * 15)); // 5-20% range
        scoreStatus = 'Below Range';
      }

      // Apply category difficulty factor to ensure proper progression
      let categoryFactor = 1;
      if (category === 'Reach') {
        categoryFactor = 0.3; // Reach schools are hardest
      } else if (category === 'Target') {
        categoryFactor = 0.6; // Target schools are medium
      } else {
        categoryFactor = 1.0; // Safety schools are easiest
      }

      // Apply acceptance rate factor (lower acceptance rate = higher difficulty)
      const acceptanceFactor = Math.max(0.4, Math.min(1.5, (100 - acceptanceRate) / 60));
      
      // Calculate final match percentage
      let finalMatchPercentage = Math.round(matchPercentage * categoryFactor * acceptanceFactor);
      
      // Apply realistic bounds based on category
      if (category === 'Reach') {
        finalMatchPercentage = Math.max(5, Math.min(40, finalMatchPercentage));
      } else if (category === 'Target') {
        finalMatchPercentage = Math.max(20, Math.min(70, finalMatchPercentage));
      } else {
        finalMatchPercentage = Math.max(50, Math.min(95, finalMatchPercentage));
      }

      const universityWithMatch = {
        ...university,
        matchPercentage: finalMatchPercentage,
        scoreStatus: scoreStatus,
        rangeFitPercentage: Math.round(matchPercentage)
      };

      // Categorize based on original category
      if (category === 'Reach') {
        recommendations.reach.push(universityWithMatch);
      } else if (category === 'Target') {
        recommendations.target.push(universityWithMatch);
      } else {
        recommendations.safety.push(universityWithMatch);
      }
    });

    // Sort by match percentage (ascending for reach, descending for others)
    recommendations.reach.sort((a, b) => a.matchPercentage - b.matchPercentage);
    recommendations.target.sort((a, b) => b.matchPercentage - a.matchPercentage);
    recommendations.safety.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return recommendations;
  };

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
      
      let totalScore = readingWritingScore + mathScore;
      
      // Safeguard: Only allow perfect score (1600) if all modules are perfect
      const totalRWCorrect = rwMod1 + rwMod2;
      const totalMathCorrect = mathMod1 + mathMod2;
      const isPerfectRW = totalRWCorrect === 54; // 27 + 27
      const isPerfectMath = totalMathCorrect === 44; // 22 + 22
      
      if (totalScore >= 1600 && (!isPerfectRW || !isPerfectMath)) {
        // Cap the score based on actual performance
        const maxPossibleScore = Math.min(1590, totalScore);
        totalScore = maxPossibleScore;
      }
      
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

    // Get university recommendations based on most probable score
    const universityRecommendations = getUniversityRecommendations(mostProbableScore);

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
      },
      universityRecommendations
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
                  <p className="text-xs text-gray-500 mt-2">Based on 13 curve analysis</p>
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

            {/* University Recommendations */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-gray-800">University Recommendations</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600">
                  Based on your most probable SAT score of <span className="font-semibold text-blue-600">{results.statistics.mostProbable}</span>, 
                  here are personalized university recommendations:
                </p>
              </div>

              {/* Filter Controls */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Filter by:</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUniversityFilter('reach')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        universityFilter === 'reach'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Reach ({results.universityRecommendations.reach.length})
                    </button>
                    <button
                      onClick={() => setUniversityFilter('target')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        universityFilter === 'target'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Target ({results.universityRecommendations.target.length})
                    </button>
                    <button
                      onClick={() => setUniversityFilter('safety')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        universityFilter === 'safety'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Safety ({results.universityRecommendations.safety.length})
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (universityFilter === 'all') {
                        setShowAllUniversities(!showAllUniversities);
                      } else {
                        setUniversityFilter('all');
                        setShowAllUniversities(true);
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {universityFilter === 'all' 
                      ? (showAllUniversities ? 'Show Top 10' : 'Show All Schools')
                      : 'Show All Schools'
                    }
                  </button>
                </div>
              </div>

              {/* University List */}
              <div className="space-y-4">
                {(() => {
                  let universitiesToShow = [];
                  
                  if (universityFilter === 'all') {
                    universitiesToShow = [
                      ...results.universityRecommendations.reach,
                      ...results.universityRecommendations.target,
                      ...results.universityRecommendations.safety
                    ];
                  } else if (universityFilter === 'reach') {
                    universitiesToShow = results.universityRecommendations.reach;
                  } else if (universityFilter === 'target') {
                    universitiesToShow = results.universityRecommendations.target;
                  } else if (universityFilter === 'safety') {
                    universitiesToShow = results.universityRecommendations.safety;
                  }

                  // When filter is 'all', use showAllUniversities to control display count
                  // When filter is specific category, always show all schools in that category
                  const displayCount = (universityFilter === 'all' && !showAllUniversities) ? 10 : universitiesToShow.length;
                  const universitiesToDisplay = universitiesToShow.slice(0, displayCount);

                  return universitiesToDisplay.map((uni, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{uni.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              uni.category === 'Reach' ? 'bg-red-100 text-red-700' :
                              uni.category === 'Target' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {uni.category}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              uni.matchPercentage >= 80 ? 'bg-green-100 text-green-700' :
                              uni.matchPercentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {uni.matchPercentage}% match
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{uni.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>SAT: {uni.satRange.min}-{uni.satRange.max}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>{uni.acceptanceRate}% acceptance</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{uni.description}</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <a
                            href={uni.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visit Website
                          </a>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Additional Information */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">Application Strategy Tips:</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Apply to 2-3 reach schools for ambitious goals</li>
                  <li>• Focus on 4-6 target schools where you have a good chance</li>
                  <li>• Include 2-3 safety schools to ensure admission</li>
                  <li>• Consider factors beyond SAT scores: GPA, extracurriculars, essays</li>
                  <li>• Research each school's specific requirements and deadlines</li>
                </ul>
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
