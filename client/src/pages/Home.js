import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiBarChart2, FiTarget, FiUsers, FiAward, FiClock } from 'react-icons/fi';
import Button from '../components/UI/Button';

const Home = () => {
  const features = [
    {
      icon: FiBookOpen,
      title: 'Comprehensive Practice Tests',
      description: 'Access a wide range of SAT practice tests covering all sections with realistic questions and timing.'
    },
    {
      icon: FiBarChart2,
      title: 'Detailed Analytics',
      description: 'Track your progress with detailed performance analytics and identify your strengths and weaknesses.'
    },
    {
      icon: FiTarget,
      title: 'Personalized Learning',
      description: 'Get personalized recommendations based on your performance and target score goals.'
    },
    {
      icon: FiUsers,
      title: 'Expert Support',
      description: 'Connect with teachers and get guidance from experienced educators and tutors.'
    },
    {
      icon: FiAward,
      title: 'Achievement System',
      description: 'Earn badges and certificates as you progress and achieve your learning milestones.'
    },
    {
      icon: FiClock,
      title: 'Flexible Study Schedule',
      description: 'Study at your own pace with 24/7 access to practice materials and tests.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Practice Questions' },
    { number: '50+', label: 'Full-Length Tests' },
    { number: '95%', label: 'Success Rate' },
    { number: '24/7', label: 'Available' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <FiBookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Bunchable</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Master the{' '}
              <span className="gradient-text">SAT</span>
              <br />
              with Confidence
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Comprehensive SAT preparation platform with practice tests, detailed analytics, 
              and personalized learning paths to help you achieve your target score.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and resources you need 
              to prepare effectively for the SAT and achieve your target score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-soft hover:shadow-medium transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your SAT Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have improved their SAT scores with our 
            comprehensive preparation platform.
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FiBookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Bunchable</span>
              </div>
              <p className="text-gray-400">
                Comprehensive SAT preparation platform helping students achieve their target scores.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button type="button" className="hover:text-white">Practice Tests</button></li>
                <li><button type="button" className="hover:text-white">Analytics</button></li>
                <li><button type="button" className="hover:text-white">Study Plans</button></li>
                <li><button type="button" className="hover:text-white">Progress Tracking</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button type="button" className="hover:text-white">Help Center</button></li>
                <li><button type="button" className="hover:text-white">Contact Us</button></li>
                <li><button type="button" className="hover:text-white">FAQ</button></li>
                <li><button type="button" className="hover:text-white">Tutorials</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button type="button" className="hover:text-white">About</button></li>
                <li><button type="button" className="hover:text-white">Privacy Policy</button></li>
                <li><button type="button" className="hover:text-white">Terms of Service</button></li>
                <li><button type="button" className="hover:text-white">Careers</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Bluebook SAT Simulator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 