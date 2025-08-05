// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import MainLayout from './layout/MainLayout';
import ChatLayout from './layout/ChatLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Chat from './pages/Chat';
import CreatePost from './pages/CreatePost';
import EditProfile from './pages/EditProfile';
import PostView from './pages/PostView';

const ProtectedRoute = ({ session, children }: { session: Session, children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function checkProfile() {
      const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
      if (data && data.username) setProfileComplete(true);
      setLoading(false);
    }
    checkProfile();
  }, [session.user.id]);

  if (loading) return <div className="flex justify-center items-center h-screen"><div>Loading Profile...</div></div>;

  if (!profileComplete && location.pathname !== '/account/edit' && location.pathname !== '/account') {
    return <Navigate to="/account" replace />;
  }
  
  return children;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><div>Loading...</div></div>;

  return (
    <Routes>
      {!session ? (
        <Route path="*" element={<Auth />} />
      ) : (
        <>
          <Route element={<ProtectedRoute session={session}><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Home session={session} />} />
            <Route path="/account" element={<Account session={session} />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/create" element={<CreatePost session={session} />} />
            <Route path="/account/edit" element={<EditProfile session={session} />} />
            {/* The session is now passed to the PostView component */}
            <Route path="/post/:postId" element={<PostView session={session} />} />
          </Route>
          
          <Route element={<ProtectedRoute session={session}><ChatLayout /></ProtectedRoute>}>
              <Route path="/chat/:receiverId" element={<Chat session={session} />} />
          </Route>
        </>
      )}
    </Routes>
  );
}

export default App;
