// src/layout/ChatLayout.tsx
import Navbar from '../components/Navbar';
import { Outlet } from 'react-router-dom';

export default function ChatLayout() {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <Outlet /> {/* This will render the Chat page */}
      </main>
    </div>
  );
}