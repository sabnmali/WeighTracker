import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial system preference or manual setting if implemented
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center p-3 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors duration-300 focus:outline-none"
      aria-label="Toggle Theme"
    >
      <div className="relative w-6 h-6 overflow-hidden">
        <Sun 
            className={`absolute inset-0 w-full h-full text-yellow-500 transition-transform duration-500 ${isDark ? 'rotate-90 opacity-0 translate-y-4' : 'rotate-0 opacity-100 translate-y-0'}`} 
        />
        <Moon 
            className={`absolute inset-0 w-full h-full text-blue-400 transition-transform duration-500 ${isDark ? 'rotate-0 opacity-100 translate-y-0' : '-rotate-90 opacity-0 -translate-y-4'}`} 
        />
      </div>
    </button>
  );
};

export default ThemeToggle;