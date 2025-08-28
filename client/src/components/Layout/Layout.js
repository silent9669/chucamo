import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiHome, 
  FiBarChart2, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiPieChart,
  FiTarget,
  FiZap,
  FiBookOpen,
  FiVideo
} from 'react-icons/fi';


const Layout = ({ children, hideNavigation = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAutoHidden, setIsAutoHidden] = useState(true); // Start hidden
  const sidebarRef = useRef(null);
  const timeoutRef = useRef(null);
  const isHoveringRef = useRef(false);
  const isManualToggleRef = useRef(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    ...(user?.accountType !== 'free' && user?.accountType !== 'pro' ? [{ name: 'Study Plan', href: '/study-plan', icon: FiTarget }] : []),
    { name: 'Practice Tests', href: '/tests', icon: FiBookOpen },
    { name: 'Recordings', href: '/recording', icon: FiVideo },
    { name: 'Results & Analytics', href: '/results', icon: FiBarChart2 },
    { name: 'Profile', href: '/profile', icon: FiUser },
    { name: 'SAT Score Calculator', href: '/sat-score-calculator', icon: FiPieChart },
    { name: 'Upgrade Plan', href: '/upgrade-plan', icon: FiZap },
    ...(user?.role === 'admin' ? [
      { name: 'Admin Panel', href: '/admin', icon: FiSettings }
    ] : []),
  ];

  const isActive = (href) => {
    const currentPath = location.pathname;
    if (href === '/study-plan') {
      return currentPath === '/study-plan';
    } else if (href === '/library') {
      return currentPath === '/library' || currentPath.startsWith('/library/');
    } else {
      return currentPath === href || currentPath.startsWith(href + '/');
    }
  };

  // Auto-hide navigation functionality
  useEffect(() => {
    if (hideNavigation) return;

    const handleMouseMove = (e) => {
      const mouseX = e.clientX;
      const triggerZone = 100; // Increased trigger zone for better responsiveness

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (mouseX <= triggerZone && !isManualToggleRef.current) {
        // Mouse is near left edge, show navigation
        setIsAutoHidden(false);
        setSidebarOpen(true);
        isHoveringRef.current = true;
      } else if (mouseX > triggerZone && !isManualToggleRef.current) {
        // Mouse moved away, hide navigation after 1 second
        isHoveringRef.current = false;
        timeoutRef.current = setTimeout(() => {
          if (!isHoveringRef.current && !isManualToggleRef.current) {
            setIsAutoHidden(true);
            setSidebarOpen(false);
          }
        }, 800); // Reduced timeout for more responsive hiding
      }
    };

    const handleMouseLeave = () => {
      // When mouse leaves the window, hide navigation
      if (!isManualToggleRef.current) {
        isHoveringRef.current = false;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (!isHoveringRef.current && !isManualToggleRef.current) {
            setIsAutoHidden(true);
            setSidebarOpen(false);
          }
        }, 800); // Reduced timeout for more responsive hiding
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hideNavigation]);

  // Auto-hide navigation when navigating to a new page
  useEffect(() => {
    if (!hideNavigation && !isManualToggleRef.current) {
      // Hide navigation after navigation
      const timer = setTimeout(() => {
        if (!isManualToggleRef.current) {
          setIsAutoHidden(true);
          setSidebarOpen(false);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, hideNavigation]);

  // Reset auto-hide when navigation is manually opened
  const handleManualToggle = () => {
    isManualToggleRef.current = !sidebarOpen;
    if (sidebarOpen) {
      // Closing manually, allow auto-hide to work again
      setIsAutoHidden(true);
      setSidebarOpen(false);
    } else {
      // Opening manually, disable auto-hide temporarily
      setIsAutoHidden(false);
      setSidebarOpen(true);
    }
  };

  // Reset manual toggle flag when auto-hide takes over
  useEffect(() => {
    if (isAutoHidden && sidebarOpen === false) {
      isManualToggleRef.current = false;
    }
  }, [isAutoHidden, sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hover trigger zone indicator */}
      {!hideNavigation && (
        <div className="fixed left-0 top-0 w-1 h-full bg-gradient-to-b from-primary-400 to-primary-600 opacity-0 hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
      )}
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && !hideNavigation && (
        <div 
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {!hideNavigation && (
        <div 
          ref={sidebarRef}
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${!isAutoHidden ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
          `}
          style={{
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform'
          }}
          onMouseEnter={() => {
            if (!isManualToggleRef.current) {
              isHoveringRef.current = true;
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
            }
          }}
          onMouseLeave={() => {
            if (!isManualToggleRef.current) {
              isHoveringRef.current = false;
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              timeoutRef.current = setTimeout(() => {
                if (!isHoveringRef.current && !isManualToggleRef.current) {
                  setIsAutoHidden(true);
                  setSidebarOpen(false);
                }
              }, 800);
            }
          }}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/apple.png" 
                  alt="chucamo logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold gradient-text">chucamo</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                      ${isActive(item.href)
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`
                      mr-3 h-5 w-5 transition-colors duration-200
                      ${isActive(item.href) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    <span className="transition-all duration-200">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <FiUser className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Logout"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div 
        className={`${hideNavigation ? 'w-full' : ''} transition-all duration-300 ease-in-out ${!hideNavigation && !isAutoHidden ? 'lg:ml-64' : 'lg:ml-0'}`}
        style={{
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'margin-left'
        }}
      >
        {/* Top bar */}
        {!hideNavigation && (
          <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleManualToggle}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                
                {/* chucamo Logo in Header */}
                <Link to="/dashboard" className="flex items-center space-x-2 lg:hidden">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src="/apple.png" 
                      alt="chucamo logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xl font-bold gradient-text">chucamo</span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-gray-900">
                  {(() => {
                    const currentPath = location.pathname;
                    if (currentPath.startsWith('/library/')) {
                      return 'Reading Article';
                    } else if (currentPath === '/library') {
                      return 'Library';
                    } else if (currentPath === '/study-plan') {
                      return 'Study Plan';
                    } else if (currentPath === '/vocab-sets') {
                      return 'Daily Vocabulary';
                    } else if (currentPath === '/vocab-quizzes') {
                      return 'Vocabulary Quiz';
                    } else if (currentPath === '/daily-vocab') {
                      return 'Daily Vocabulary';
                    } else if (currentPath === '/vocab-quiz') {
                      return 'Vocabulary Quiz';
                    } else if (currentPath === '/recording') {
                      return 'Recording';
                    } else if (currentPath === '/plan-future') {
                      return 'Plan Your Future';
                    } else if (currentPath === '/pet-house') {
                      return 'Pet House';
                    } else {
                      // Don't show "Dashboard" for Study Plan related pages
                      const studyPlanPages = ['/library', '/vocab-sets', '/vocab-quizzes', '/recording', '/plan-future', '/pet-house'];
                      if (studyPlanPages.some(page => currentPath.startsWith(page))) {
                        return navigation.find(item => isActive(item.href))?.name || '';
                      }
                      return navigation.find(item => isActive(item.href))?.name || 'Dashboard';
                    }
                  })()}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className={`${hideNavigation ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
          {children}
        </main>
      </div>
      

    </div>
  );
};

export default Layout; 