import { useState, useEffect, useRef } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    >
      {/* Interactive Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            transform: `translate(${(mousePosition.x - 50) * 0.3}px, ${(mousePosition.y - 50) * 0.3}px)`,
          }}
        ></div>
        <div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            transform: `translate(${(50 - mousePosition.x) * 0.3}px, ${(50 - mousePosition.y) * 0.3}px)`,
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-200/20 dark:bg-purple-900/20 rounded-full blur-3xl transition-all duration-1500 ease-out"
          style={{
            transform: `translate(calc(-50% + ${(mousePosition.x - 50) * 0.2}px), calc(-50% + ${(mousePosition.y - 50) * 0.2}px))`,
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div 
            className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all duration-500 cursor-pointer group"
            style={{
              transform: `translate(${(mousePosition.x - 50) * 0.1}px, ${(mousePosition.y - 50) * 0.1}px) rotate(${(mousePosition.x - 50) * 0.1}deg)`,
            }}
          >
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">💊</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent animate-fade-in"
          style={{
            backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
            transition: 'all 0.3s ease-out',
          }}
        >
          MediBot
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-4 font-medium">
          Your Personal Medicine Assistant
        </p>
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
          Get instant, reliable, and easy-to-understand information about medications. 
          Powered by AI to help you make informed health decisions.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div 
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 transform hover:scale-105 hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer group"
            style={{
              transform: `translateY(${(mousePosition.y - 50) * 0.05}px) scale(1)`,
            }}
          >
            <div className="text-3xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">🔍</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Quick Information</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Instant answers about medications, dosages, and interactions
            </p>
          </div>
          <div 
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 transform hover:scale-105 hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 cursor-pointer group"
            style={{
              transform: `translateY(${(mousePosition.y - 50) * 0.05}px) scale(1)`,
            }}
          >
            <div className="text-3xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">🛡️</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Safety First</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Important safety information and side effects at your fingertips
            </p>
          </div>
          <div 
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 transform hover:scale-105 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer group"
            style={{
              transform: `translateY(${(mousePosition.y - 50) * 0.05}px) scale(1)`,
            }}
          >
            <div className="text-3xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">💬</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Easy to Use</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Simple, conversational interface for all your medication questions
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden"
          style={{
            transform: `scale(1) translateY(${(mousePosition.y - 50) * 0.02}px)`,
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            Start Now
            <svg 
              className={`w-5 h-5 transition-all duration-300 ${isHovered ? 'translate-x-2 scale-110' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-20"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.3) 0%, transparent 70%)`,
            }}
          ></div>
        </button>

        {/* Disclaimer */}
        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          ⚠️ This is general information only. Always consult a healthcare professional before taking or stopping any medication.
        </p>
      </div>
    </div>
  );
}

