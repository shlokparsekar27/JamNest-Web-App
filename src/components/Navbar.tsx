// src/components/Navbar.tsx
import { NavLink, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ThemeSwitch from './ThemeSwitch';

export default function Navbar() {
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      supabase.auth.signOut();
    }
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-gray-800 dark:text-white">
              JamNest 🎵
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-white'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              Discover
            </NavLink>
            {/* This is the new link to the Create Post page */}
            <NavLink
              to="/create"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-white'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              New Post
            </NavLink>
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-white'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              My Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
            >
              Logout
            </button>
            <div className="pl-2">
              <ThemeSwitch />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
