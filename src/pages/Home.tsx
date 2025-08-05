// src/pages/Home.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import ProfileAvatar from '../components/ProfileAvatar'; // Import the new component

// The Profile type now includes the avatar_url
type Profile = {
  id: string;
  username: string | null;
  instrument: string | null;
  avatar_url: string | null;
};

function Home({ session }: { session: Session }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const getFollowing = useCallback(async () => {
    const { data, error } = await supabase
      .from('connections')
      .select('following_id')
      .eq('follower_id', session.user.id);

    if (error) console.warn(error);
    else if (data) setFollowing(new Set(data.map((item) => item.following_id)));
  }, [session.user.id]);

  useEffect(() => {
    async function getProfilesAndFollowing() {
      setLoading(true);
      // We now select avatar_url along with the other profile data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, instrument, avatar_url')
        .neq('id', session.user.id);

      if (profilesError) console.warn(profilesError);
      else if (profilesData) setProfiles(profilesData);
      
      await getFollowing();
      setLoading(false);
    }
    getProfilesAndFollowing();
  }, [getFollowing, session.user.id]);

  const handleFollow = async (profileId: string) => {
    const { error } = await supabase.from('connections').insert({
      follower_id: session.user.id,
      following_id: profileId,
    });
    if (error) alert(error.message);
    else await getFollowing();
  };

  const handleUnfollow = async (profileId: string) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('follower_id', session.user.id)
      .eq('following_id', profileId);
    if (error) alert(error.message);
    else await getFollowing();
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Discover Artists</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Connect with talented musicians from around the world.</p>
      </div>
      
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading profiles...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {profiles.map((profile) => (
            <Link to={`/profile/${profile.id}`} key={profile.id} className="group block">
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-transparent dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    {/* The placeholder div is replaced with our new component */}
                    <ProfileAvatar url={profile.avatar_url} size={48} />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {profile.username || 'Anonymous Artist'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{profile.instrument || 'Musician'}</p>
                    </div>
                  </div>
                  
                  {following.has(profile.id) ? (
                    <button
                      onClick={(e) => { e.preventDefault(); handleUnfollow(profile.id); }}
                      className="w-full mt-4 px-4 py-2 text-sm font-semibold text-center text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Following
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.preventDefault(); handleFollow(profile.id); }}
                      className="w-full mt-4 px-4 py-2 text-sm font-semibold text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Follow
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
