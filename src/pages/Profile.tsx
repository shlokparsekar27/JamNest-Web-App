// src/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileAvatar from '../components/ProfileAvatar';
import PostGridItem from '../components/PostGridItem'; // Import the new component

type ProfileData = {
  username: string | null;
  instrument: string | null;
  avatar_url: string | null;
};

type Post = {
  id: number;
  media_url: string;
};

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    async function getProfileData() {
      if (!id) {
        setError('User not found.');
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, instrument, avatar_url')
        .eq('id', id)
        .single();
      
      if (profileError) {
        console.warn(profileError);
        setError('Could not fetch profile.');
        setLoading(false);
        return;
      }
      if (profileData) setProfile(profileData);

      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, media_url')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (postsError) console.warn(postsError);
      else if (postsData) setPosts(postsData);

      // Fetch follower count
      const { count: followers } = await supabase.from('connections').select('*', { count: 'exact', head: true }).eq('following_id', id);
      setFollowerCount(followers || 0);

      // Fetch following count
      const { count: following } = await supabase.from('connections').select('*', { count: 'exact', head: true }).eq('follower_id', id);
      setFollowingCount(following || 0);

      setLoading(false);
    }

    getProfileData();
  }, [id]);

  if (loading) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading profile...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

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
          <p className="text-xl text-gray-500 dark:text-gray-400 mt-2">
            {profile?.instrument || 'Musician'}
          </p>

          {/* Stats Section */}
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
              to={`/chat/${id}`}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Post Grid Section */}
      <div className="mt-12">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          {posts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {posts.map((post) => (
                // This line has been updated to pass the postId
                <PostGridItem key={post.id} postId={post.id} mediaUrl={post.media_url} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">This user hasn't posted anything yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
