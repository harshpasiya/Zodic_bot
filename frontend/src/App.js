import React, { useState, useEffect, useContext, createContext } from 'react';
import './App.css';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingAuth, setProcessingAuth] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Check for existing session or process session_id
  useEffect(() => {
    const processAuth = async () => {
      const urlFragment = window.location.hash;
      
      // Check if there's a session_id in URL fragment
      if (urlFragment.includes('session_id=')) {
        setProcessingAuth(true);
        const sessionId = urlFragment.split('session_id=')[1].split('&')[0];
        
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
            method: 'POST',
            headers: {
              'X-Session-ID': sessionId,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            // Clean URL fragment
            window.location.hash = '';
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Auth processing failed:', error);
        }
        
        setProcessingAuth(false);
      } else {
        // Check existing session
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error('Session check failed:', error);
        }
      }
      
      setLoading(false);
    };
    
    processAuth();
  }, [BACKEND_URL]);

  const login = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    processingAuth,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Loading Component
const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
    <div className="loading-spinner">
      <div className="spinner-ring"></div>
      <div className="text-emerald-400 mt-4 font-mono text-lg animate-pulse">
        ZODIC INITIALIZING...
      </div>
    </div>
  </div>
);

// Auth Form Component
const AuthForm = () => {
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Instead of traditional auth, redirect to Emergent Auth
    login();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-emerald-400 font-mono glitch-text mb-2">
            ZODIC
          </div>
          <p className="text-gray-400 text-sm">Automated Trading Revolution</p>
        </div>

        {/* Auth Form */}
        <div className="cyber-card p-6 sm:p-8 bg-black/80 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-400 font-mono mb-2">
              {isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isSignup ? 'Join the trading revolution' : 'Access your trading dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-mono text-emerald-400 mb-2">
                  FULL NAME
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="cyber-input w-full px-4 py-3 bg-black/50 border border-emerald-400/50 text-white font-mono rounded focus:border-emerald-400 focus:outline-none transition-all duration-300"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-mono text-emerald-400 mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="cyber-input w-full px-4 py-3 bg-black/50 border border-emerald-400/50 text-white font-mono rounded focus:border-emerald-400 focus:outline-none transition-all duration-300"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-emerald-400 mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="cyber-input w-full px-4 py-3 bg-black/50 border border-emerald-400/50 text-white font-mono rounded focus:border-emerald-400 focus:outline-none transition-all duration-300"
                placeholder="Enter your password"
                required
              />
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-mono text-emerald-400 mb-2">
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="cyber-input w-full px-4 py-3 bg-black/50 border border-emerald-400/50 text-white font-mono rounded focus:border-emerald-400 focus:outline-none transition-all duration-300"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full cyber-button-large px-6 py-4 bg-emerald-500 text-black font-mono font-bold rounded hover:bg-emerald-400 transition-all duration-300 transform hover:scale-105"
            >
              {isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-4">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-emerald-400 font-mono text-sm hover:text-emerald-300 transition-colors duration-300 underline"
            >
              {isSignup ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-emerald-400/20">
            <p className="text-center text-xs text-gray-500 font-mono">
              Secure authentication powered by advanced encryption
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.location.href = '/'}
            className="text-gray-400 font-mono text-sm hover:text-emerald-400 transition-colors duration-300"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 animate-pulse"></div>
        <div className="grid-pattern"></div>
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage = () => {
  const { login } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      title: "AI-Powered Trading",
      description: "Advanced algorithms analyze market patterns for optimal trading decisions",
      icon: "🤖"
    },
    {
      title: "Indian Market Focus",
      description: "Specialized for NSE & BSE with real-time data integration",
      icon: "📈"
    },
    {
      title: "Risk Management",
      description: "Automated stop-loss and position sizing for capital protection",
      icon: "🛡️"
    },
    {
      title: "Real-time Analytics",
      description: "Comprehensive performance tracking and portfolio analysis",
      icon: "📊"
    }
  ];

  const strategies = [
    {
      name: "Momentum Trading",
      description: "Capture strong price movements with trend-following algorithms",
      returns: "12-18%",
      risk: "Medium"
    },
    {
      name: "Mean Reversion",
      description: "Profit from price corrections in overbought/oversold conditions",
      returns: "8-12%",
      risk: "Low"
    },
    {
      name: "Scalping",
      description: "High-frequency micro-profits from small price movements",
      returns: "15-25%",
      risk: "High"
    },
    {
      name: "Swing Trading",
      description: "Multi-day position holds for larger price swings",
      returns: "10-15%",
      risk: "Medium"
    }
  ];

  const testimonials = [
    {
      name: "Raj Patel",
      role: "Day Trader",
      comment: "ZODIC has revolutionized my trading. The AI predictions are incredibly accurate!",
      profit: "+₹2,50,000"
    },
    {
      name: "Priya Sharma",
      role: "Investment Manager",
      comment: "Best automated trading platform for Indian markets. Excellent risk management.",
      profit: "+₹8,75,000"
    },
    {
      name: "Arjun Kumar",
      role: "Retail Investor",
      comment: "Even as a beginner, I'm making consistent profits with ZODIC's smart algorithms.",
      profit: "+₹1,25,000"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  if (showAuthForm) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="relative z-50 bg-black/90 backdrop-blur-sm border-b border-emerald-400/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono glitch-text">
              ZODIC
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-emerald-400 font-mono text-sm transition-colors">FEATURES</a>
              <a href="#strategies" className="text-gray-300 hover:text-emerald-400 font-mono text-sm transition-colors">STRATEGIES</a>
              <a href="#testimonials" className="text-gray-300 hover:text-emerald-400 font-mono text-sm transition-colors">REVIEWS</a>
              <a href="#pricing" className="text-gray-300 hover:text-emerald-400 font-mono text-sm transition-colors">PRICING</a>
              <button
                onClick={() => setShowAuthForm(true)}
                className="cyber-button px-6 py-2 bg-emerald-500/20 border border-emerald-400 text-emerald-400 font-mono text-sm transition-all duration-300 hover:bg-emerald-400 hover:text-black"
              >
                SIGN IN
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-emerald-400 p-2"
            >
              <div className="space-y-1">
                <div className="w-6 h-0.5 bg-emerald-400"></div>
                <div className="w-6 h-0.5 bg-emerald-400"></div>
                <div className="w-6 h-0.5 bg-emerald-400"></div>
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-black/95 backdrop-blur-sm border-t border-emerald-400/20 py-4">
              <div className="space-y-4">
                <a href="#features" className="block text-gray-300 hover:text-emerald-400 font-mono text-sm px-4 py-2">FEATURES</a>
                <a href="#strategies" className="block text-gray-300 hover:text-emerald-400 font-mono text-sm px-4 py-2">STRATEGIES</a>
                <a href="#testimonials" className="block text-gray-300 hover:text-emerald-400 font-mono text-sm px-4 py-2">REVIEWS</a>
                <a href="#pricing" className="block text-gray-300 hover:text-emerald-400 font-mono text-sm px-4 py-2">PRICING</a>
                <div className="px-4">
                  <button
                    onClick={() => setShowAuthForm(true)}
                    className="w-full cyber-button px-6 py-3 bg-emerald-500/20 border border-emerald-400 text-emerald-400 font-mono text-sm"
                  >
                    SIGN IN
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-6 font-mono leading-tight">
            <span className="text-white">AUTOMATED</span>
            <br />
            <span className="text-emerald-400 glitch-text">TRADING</span>
            <br />
            <span className="text-white">REVOLUTION</span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto font-light px-4">
            Next-generation AI trading bots for the Indian stock market. 
            <br className="hidden sm:block" />Maximize profits while minimizing risks with advanced algorithms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={login}
              className="cyber-button-large px-8 sm:px-12 py-3 sm:py-4 bg-emerald-500 text-black font-mono text-lg sm:text-xl font-bold transition-all duration-300 hover:bg-emerald-400 hover:shadow-2xl hover:shadow-emerald-400/50 transform hover:scale-105 w-full sm:w-auto"
            >
              START TRADING
            </button>
            <button
              onClick={() => setShowAuthForm(true)}
              className="cyber-button px-8 sm:px-12 py-3 sm:py-4 border border-emerald-400 text-emerald-400 font-mono text-lg sm:text-xl transition-all duration-300 hover:bg-emerald-400 hover:text-black w-full sm:w-auto"
            >
              VIEW DEMO
            </button>
          </div>
        </div>

        {/* Features Carousel */}
        <div className="max-w-6xl mx-auto mb-16 sm:mb-20">
          <div className="relative h-48 sm:h-64 overflow-hidden rounded-lg border border-emerald-400/30 bg-black/50 backdrop-blur-sm">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex items-center justify-center p-4 sm:p-8 transition-all duration-1000 ${
                  index === activeFeature
                    ? 'opacity-100 transform translate-x-0'
                    : 'opacity-0 transform translate-x-full'
                }`}
              >
                <div className="text-center max-w-2xl">
                  <div className="text-4xl sm:text-6xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-4 font-mono">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-lg px-4">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Feature indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeFeature
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          <div className="text-center p-4 sm:p-6 border border-emerald-400/30 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all duration-300 card-hover">
            <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2 font-mono">99.9%</div>
            <div className="text-gray-300 text-sm sm:text-base">Uptime</div>
          </div>
          <div className="text-center p-4 sm:p-6 border border-emerald-400/30 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all duration-300 card-hover">
            <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2 font-mono">24/7</div>
            <div className="text-gray-300 text-sm sm:text-base">Market Monitoring</div>
          </div>
          <div className="text-center p-4 sm:p-6 border border-emerald-400/30 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all duration-300 card-hover sm:col-span-2 lg:col-span-1">
            <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2 font-mono">5000+</div>
            <div className="text-gray-300 text-sm sm:text-base">Active Traders</div>
          </div>
        </div>
      </section>

      {/* Trading Strategies Section */}
      <section id="strategies" className="py-16 sm:py-20 bg-black/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-emerald-400 font-mono mb-4">
              TRADING STRATEGIES
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Choose from proven algorithmic strategies tailored for the Indian market
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {strategies.map((strategy, index) => (
              <div key={index} className="cyber-card p-4 sm:p-6 bg-black/80 border border-emerald-400/30 rounded-lg backdrop-blur-sm hover:bg-black/90 transition-all duration-300 card-hover">
                <h3 className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mb-3">
                  {strategy.name.toUpperCase()}
                </h3>
                <p className="text-gray-300 text-sm sm:text-base mb-4 leading-relaxed">
                  {strategy.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Expected Returns:</span>
                    <span className="text-emerald-400 font-mono text-sm">{strategy.returns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Risk Level:</span>
                    <span className={`font-mono text-sm ${
                      strategy.risk === 'Low' ? 'text-green-400' :
                      strategy.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {strategy.risk}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-emerald-400 font-mono mb-4">
              SUCCESS STORIES
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Real profits from real traders using ZODIC
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="cyber-card p-4 sm:p-6 bg-black/80 border border-emerald-400/30 rounded-lg backdrop-blur-sm hover:bg-black/90 transition-all duration-300 card-hover">
                <div className="text-center mb-4">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono mb-2">
                    {testimonial.profit}
                  </div>
                  <div className="text-gray-400 text-sm">Total Profit</div>
                </div>
                <p className="text-gray-300 text-sm sm:text-base mb-4 italic">
                  "{testimonial.comment}"
                </p>
                <div className="border-t border-emerald-400/20 pt-4">
                  <div className="font-bold text-emerald-400 font-mono text-sm sm:text-base">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 bg-black/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-emerald-400 font-mono mb-4">
              PRICING PLANS
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Choose the perfect plan for your trading goals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="cyber-card p-6 sm:p-8 bg-black/80 border border-emerald-400/30 rounded-lg backdrop-blur-sm hover:bg-black/90 transition-all duration-300 card-hover">
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mb-2">STARTER</h3>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">₹999</div>
                <div className="text-gray-400 text-sm">/month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  1 Trading Bot
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Basic Strategies
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Email Support
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Real-time Analytics
                </li>
              </ul>
              <button className="w-full cyber-button px-6 py-3 border border-emerald-400 text-emerald-400 font-mono hover:bg-emerald-400 hover:text-black transition-all duration-300">
                GET STARTED
              </button>
            </div>

            {/* Professional Plan - Highlighted */}
            <div className="cyber-card p-6 sm:p-8 bg-black/90 border-2 border-emerald-400 rounded-lg backdrop-blur-sm relative hover:bg-black/95 transition-all duration-300 card-hover">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-emerald-400 text-black px-4 py-1 text-xs font-mono font-bold rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mb-2">PROFESSIONAL</h3>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">₹2,999</div>
                <div className="text-gray-400 text-sm">/month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  5 Trading Bots
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Advanced Strategies
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Priority Support
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Advanced Analytics
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Risk Management Tools
                </li>
              </ul>
              <button className="w-full cyber-button-large px-6 py-3 bg-emerald-500 text-black font-mono font-bold hover:bg-emerald-400 transition-all duration-300">
                GET STARTED
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="cyber-card p-6 sm:p-8 bg-black/80 border border-emerald-400/30 rounded-lg backdrop-blur-sm hover:bg-black/90 transition-all duration-300 card-hover">
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mb-2">ENTERPRISE</h3>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">₹9,999</div>
                <div className="text-gray-400 text-sm">/month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Unlimited Bots
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Custom Strategies
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  24/7 Phone Support
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  White-label Solution
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Dedicated Account Manager
                </li>
              </ul>
              <button className="w-full cyber-button px-6 py-3 border border-emerald-400 text-emerald-400 font-mono hover:bg-emerald-400 hover:text-black transition-all duration-300">
                CONTACT SALES
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-emerald-400 font-mono mb-6">
            READY TO START?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join thousands of successful traders using ZODIC's AI-powered platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={login}
              className="cyber-button-large px-8 sm:px-12 py-3 sm:py-4 bg-emerald-500 text-black font-mono text-lg sm:text-xl font-bold transition-all duration-300 hover:bg-emerald-400 hover:shadow-2xl hover:shadow-emerald-400/50 transform hover:scale-105 w-full sm:w-auto"
            >
              START FREE TRIAL
            </button>
            <button
              onClick={() => setShowAuthForm(true)}
              className="cyber-button px-8 sm:px-12 py-3 sm:py-4 border border-emerald-400 text-emerald-400 font-mono text-lg sm:text-xl transition-all duration-300 hover:bg-emerald-400 hover:text-black w-full sm:w-auto"
            >
              SCHEDULE DEMO
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/90 border-t border-emerald-400/20 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mb-4">ZODIC</div>
              <p className="text-gray-400 text-sm mb-4">
                Revolutionizing automated trading for the Indian stock market with AI-powered algorithms.
              </p>
            </div>
            <div>
              <h4 className="text-emerald-400 font-mono font-bold mb-4">PLATFORM</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Strategies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-emerald-400 font-mono font-bold mb-4">SUPPORT</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-emerald-400 font-mono font-bold mb-4">LEGAL</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Risk Disclosure</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-400/20 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm font-mono">
              © 2024 ZODIC. All rights reserved. Trading involves risk and may not be suitable for all investors.
            </p>
          </div>
        </div>
      </footer>

      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 animate-pulse"></div>
        <div className="grid-pattern"></div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [bots, setBots] = useState([]);
  const [trades, setTrades] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics
      const analyticsRes = await fetch(`${BACKEND_URL}/api/analytics/overview`, {
        credentials: 'include'
      });
      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }

      // Fetch bots
      const botsRes = await fetch(`${BACKEND_URL}/api/bots`, {
        credentials: 'include'
      });
      if (botsRes.ok) {
        setBots(await botsRes.json());
      }

      // Fetch trades
      const tradesRes = await fetch(`${BACKEND_URL}/api/trades`, {
        credentials: 'include'
      });
      if (tradesRes.ok) {
        setTrades(await tradesRes.json());
      }

      // Fetch portfolio
      const portfolioRes = await fetch(`${BACKEND_URL}/api/portfolio`, {
        credentials: 'include'
      });
      if (portfolioRes.ok) {
        setPortfolio(await portfolioRes.json());
      }

      // Fetch market data
      const marketRes = await fetch(`${BACKEND_URL}/api/market/stocks`);
      if (marketRes.ok) {
        setMarketData(await marketRes.json());
      }

      // Fetch users if admin
      if (user?.role === 'admin') {
        const usersRes = await fetch(`${BACKEND_URL}/api/admin/users`, {
          credentials: 'include'
        });
        if (usersRes.ok) {
          setUsers(await usersRes.json());
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBot = async (botData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(botData)
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating bot:', error);
    }
  };

  const toggleBot = async (botId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bots/${botId}/toggle`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error toggling bot:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const isAdmin = user?.role === 'admin';

  const tabs = isAdmin
    ? ['overview', 'users', 'bots', 'analytics']
    : ['overview', 'bots', 'trades', 'portfolio'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-emerald-400/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-emerald-400 font-mono glitch-text">
            ZODIC {isAdmin ? 'ADMIN' : 'CLIENT'}
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-300">
              Welcome, <span className="text-emerald-400 font-mono">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="cyber-button px-4 py-2 border border-red-400 text-red-400 font-mono hover:bg-red-400 hover:text-black transition-all duration-300"
            >
              DISCONNECT
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-mono text-sm uppercase transition-all duration-300 border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'text-emerald-400 border-emerald-400 bg-emerald-400/10'
                  : 'text-gray-400 border-transparent hover:text-emerald-400 hover:border-emerald-400/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Analytics Cards */}
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(analytics).map(([key, value]) => (
                    <div key={key} className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm hover:bg-black/70 transition-all duration-300">
                      <div className="text-3xl font-bold text-emerald-400 mb-2 font-mono">
                        {typeof value === 'number' && value > 1000 ? `${(value/1000).toFixed(1)}K` : value}
                      </div>
                      <div className="text-gray-300 text-sm uppercase tracking-wide">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Market Overview */}
              <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-emerald-400 mb-4 font-mono">MARKET OVERVIEW</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(marketData).slice(0, 8).map(([symbol, data]) => (
                    <div key={symbol} className="p-4 border border-gray-700 rounded bg-black/30">
                      <div className="font-mono text-emerald-400 font-bold">{symbol}</div>
                      <div className="text-lg font-bold">₹{data.price}</div>
                      <div className={`text-sm ${
                        data.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {data.change >= 0 ? '+' : ''}{data.change} 
                        ({((data.change/data.price)*100).toFixed(2)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab (Admin only) */}
          {activeTab === 'users' && isAdmin && (
            <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-bold text-emerald-400 mb-4 font-mono">USER MANAGEMENT</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-emerald-400/30">
                      <th className="py-3 px-4 font-mono text-emerald-400">NAME</th>
                      <th className="py-3 px-4 font-mono text-emerald-400">EMAIL</th>
                      <th className="py-3 px-4 font-mono text-emerald-400">ROLE</th>
                      <th className="py-3 px-4 font-mono text-emerald-400">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-emerald-400/5 transition-colors">
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            user.role === 'admin' 
                              ? 'bg-red-500/20 text-red-400 border border-red-400' 
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400'
                          }`}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            user.is_active 
                              ? 'bg-green-500/20 text-green-400 border border-green-400' 
                              : 'bg-gray-500/20 text-gray-400 border border-gray-400'
                          }`}>
                            {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bots Tab */}
          {activeTab === 'bots' && (
            <div className="space-y-6">
              {/* Create Bot Form */}
              <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-emerald-400 mb-4 font-mono">CREATE TRADING BOT</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  createBot({
                    name: formData.get('name'),
                    strategy: formData.get('strategy'),
                    capital: parseFloat(formData.get('capital')),
                    risk_percentage: parseFloat(formData.get('risk'))
                  });
                  e.target.reset();
                }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    name="name"
                    placeholder="Bot Name"
                    className="cyber-input px-4 py-2 bg-black/50 border border-emerald-400/50 text-white font-mono rounded focus:border-emerald-400 focus:outline-none"
                    required
                  />
                  <select
                    name="strategy"
                    className="cyber-input px-4 py-2 bg-black/50 border border-emerald-400/50 text-white font-mono rounded focus:border-emerald-400 focus:outline-none"
                    required
                  >
                    <option value="">Select Strategy</option>
                    <option value="momentum">Momentum</option>
                    <option value="mean_reversion">Mean Reversion</option>
                    <option value="scalping">Scalping</option>
                    <option value="swing">Swing Trading</option>
                  </select>
                  <input
                    name="capital"
                    type="number"
                    placeholder="Capital (₹)"
                    className="cyber-input px-4 py-2 bg-black/50 border border-emerald-400/50 text-white font-mono rounded focus:border-emerald-400 focus:outline-none"
                    required
                  />
                  <input
                    name="risk"
                    type="number"
                    step="0.1"
                    placeholder="Risk %"
                    defaultValue="2.0"
                    className="cyber-input px-4 py-2 bg-black/50 border border-emerald-400/50 text-white font-mono rounded focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="cyber-button px-6 py-2 bg-emerald-500 text-black font-mono font-bold rounded hover:bg-emerald-400 transition-all duration-300"
                  >
                    CREATE BOT
                  </button>
                </form>
              </div>

              {/* Bots List */}
              <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-emerald-400 mb-4 font-mono">YOUR TRADING BOTS</h3>
                {bots.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No trading bots created yet. Create your first bot above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bots.map((bot) => (
                      <div key={bot.id} className="p-4 border border-gray-700 rounded bg-black/30 hover:bg-black/50 transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-emerald-400 font-mono">{bot.name}</h4>
                          <button
                            onClick={() => toggleBot(bot.id)}
                            className={`px-3 py-1 rounded text-xs font-mono transition-all duration-300 ${
                              bot.is_active
                                ? 'bg-red-500/20 text-red-400 border border-red-400 hover:bg-red-500 hover:text-white'
                                : 'bg-green-500/20 text-green-400 border border-green-400 hover:bg-green-500 hover:text-white'
                            }`}
                          >
                            {bot.is_active ? 'STOP' : 'START'}
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-gray-400">Strategy:</span> {bot.strategy}</div>
                          <div><span className="text-gray-400">Capital:</span> ₹{bot.capital.toLocaleString()}</div>
                          <div><span className="text-gray-400">Risk:</span> {bot.risk_percentage}%</div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs font-mono ${
                              bot.is_active
                                ? 'bg-green-500/20 text-green-400 border border-green-400'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-400'
                            }`}>
                              {bot.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trades Tab */}
          {activeTab === 'trades' && (
            <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-bold text-emerald-400 mb-4 font-mono">TRADING HISTORY</h3>
              {trades.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No trades executed yet. Start a bot to begin trading.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-emerald-400/30">
                        <th className="py-3 px-4 font-mono text-emerald-400">SYMBOL</th>
                        <th className="py-3 px-4 font-mono text-emerald-400">ACTION</th>
                        <th className="py-3 px-4 font-mono text-emerald-400">QUANTITY</th>
                        <th className="py-3 px-4 font-mono text-emerald-400">PRICE</th>
                        <th className="py-3 px-4 font-mono text-emerald-400">TIME</th>
                        <th className="py-3 px-4 font-mono text-emerald-400">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => (
                        <tr key={trade.id} className="border-b border-gray-700 hover:bg-emerald-400/5 transition-colors">
                          <td className="py-3 px-4 font-mono">{trade.symbol}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-mono ${
                              trade.action === 'BUY'
                                ? 'bg-green-500/20 text-green-400 border border-green-400'
                                : 'bg-red-500/20 text-red-400 border border-red-400'
                            }`}>
                              {trade.action}
                            </span>
                          </td>
                          <td className="py-3 px-4">{trade.quantity}</td>
                          <td className="py-3 px-4">₹{trade.price}</td>
                          <td className="py-3 px-4 text-gray-300">
                            {new Date(trade.executed_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs font-mono bg-green-500/20 text-green-400 border border-green-400">
                              {trade.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && portfolio && (
            <div className="space-y-6">
              {/* Portfolio Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-emerald-400 mb-2 font-mono">
                    ₹{portfolio.total_value.toLocaleString()}
                  </div>
                  <div className="text-gray-300 text-sm uppercase tracking-wide">Total Value</div>
                </div>
                <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
                  <div className={`text-3xl font-bold mb-2 font-mono ${
                    portfolio.daily_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {portfolio.daily_pnl >= 0 ? '+' : ''}₹{portfolio.daily_pnl.toLocaleString()}
                  </div>
                  <div className="text-gray-300 text-sm uppercase tracking-wide">Daily P&L</div>
                </div>
                <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-emerald-400 mb-2 font-mono">
                    ₹{portfolio.cash_balance.toLocaleString()}
                  </div>
                  <div className="text-gray-300 text-sm uppercase tracking-wide">Cash Balance</div>
                </div>
              </div>

              {/* Positions */}
              <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-emerald-400 mb-4 font-mono">POSITIONS</h3>
                {portfolio.positions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No positions held currently.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-emerald-400/30">
                          <th className="py-3 px-4 font-mono text-emerald-400">SYMBOL</th>
                          <th className="py-3 px-4 font-mono text-emerald-400">QUANTITY</th>
                          <th className="py-3 px-4 font-mono text-emerald-400">AVG PRICE</th>
                          <th className="py-3 px-4 font-mono text-emerald-400">CURRENT PRICE</th>
                          <th className="py-3 px-4 font-mono text-emerald-400">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.positions.map((position, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-emerald-400/5 transition-colors">
                            <td className="py-3 px-4 font-mono">{position.symbol}</td>
                            <td className="py-3 px-4">{position.quantity}</td>
                            <td className="py-3 px-4">₹{position.avg_price}</td>
                            <td className="py-3 px-4">₹{position.current_price}</td>
                            <td className={`py-3 px-4 font-mono ${
                              position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {position.pnl >= 0 ? '+' : ''}₹{position.pnl}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab (Admin only) */}
          {activeTab === 'analytics' && isAdmin && (
            <div className="cyber-card p-6 bg-black/50 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-bold text-emerald-400 mb-4 font-mono">PLATFORM ANALYTICS</h3>
              <div className="text-center py-8 text-gray-400">
                Advanced analytics coming soon...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const { user, loading, processingAuth } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Handle routing based on URL path
    const path = window.location.pathname;
    if (path === '/dashboard' || (user && path === '/')) {
      setCurrentPage('dashboard');
    } else if (path === '/login' || path === '/signup') {
      setCurrentPage('auth');
    } else {
      setCurrentPage('home');
    }
  }, [user]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && currentPage !== 'dashboard') {
      setCurrentPage('dashboard');
      window.history.pushState({}, '', '/dashboard');
    }
  }, [user, currentPage]);

  if (loading || processingAuth) {
    return <LoadingSpinner />;
  }

  const renderPage = () => {
    if (user) {
      return <Dashboard />;
    }

    switch (currentPage) {
      case 'dashboard':
        return user ? <Dashboard /> : <LandingPage />;
      case 'auth':
        return <AuthForm />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
};

// Wrap App with AuthProvider
const AppWithAuth = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWithAuth;