import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Monitor, Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
    const { theme, changeTheme } = useTheme();

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-full flex items-center shadow-lg">
            <button
                onClick={() => changeTheme('light')}
                className={`p-2 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-white text-yellow-500 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                title="Light Mode"
            >
                <Sun size={18} />
            </button>
            <button
                onClick={() => changeTheme('system')}
                className={`p-2 rounded-full transition-all duration-300 ${theme === 'system' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                title="System Default"
            >
                <Monitor size={18} />
            </button>
            <button
                onClick={() => changeTheme('dark')}
                className={`p-2 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                title="Dark Mode"
            >
                <Moon size={18} />
            </button>
        </div>
    );
};

export default ThemeToggle;
