// src/pages/Account.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import ProfileAvatar from '../components/ProfileAvatar';
import PostGridItem from '../components/PostGridItem';

type ProfileData = {
  username: string | null;
  instrument: string | null;
  avatar_url: string | null;
};

type Post = {
  id: number;
  media_url: string;
};

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    async function getProfileData() {
      setLoading(true);
      const { user } = session;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, instrument, avatar_url')
        .eq('id', user.id)
        .single();
      if (profileData) setProfile(profileData);

      const { data: postsData } = await supabase
        .from('posts')
        .select('id, media_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (postsData) setPosts(postsData);

      const { count: followers } = await supabase.from('connections').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
      setFollowerCount(followers || 0);

      const { count: following } = await supabase.from('connections').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
      setFollowingCount(following || 0);

      setLoading(false);
    }

    getProfileData();
  }, [session]);

  if (loading) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading your profile...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-transparent dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <ProfileAvatar url={profile?.avatar_url || null} size={128} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {profile?.username || 'Anonymous Artist'}
          </h1>
          {/* This line has been updated */}
          <p className="text-xl text-gray-500 dark:text-gray-400 mt-2">
            {profile?.instrument || 'No skill set'}
          </p>

          <div className="flex justify-center space-x-8 my-8 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{followerCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{followingCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Following</p>
            </div>
          </div>

          <div className="mt-4">
            <Link 
              to="/account/edit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          {posts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {posts.map((post) => (
                <PostGridItem key={post.id} postId={post.id} mediaUrl={post.media_url} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No posts yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start sharing your work by creating a new post.</p>
                <div className="mt-6">
                    <Link to="/create" className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                        Create Your First Post
                    </Link>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}