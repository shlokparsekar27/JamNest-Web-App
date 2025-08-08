// src/pages/PostView.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileAvatar from '../components/ProfileAvatar';
import type { Session } from '@supabase/supabase-js';

type PostData = {
  id: number;
  user_id: string;
  caption: string | null;
  media_url: string;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  }[] | null;
};

type CommentData = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  }[] | null;
};

export default function PostView({ session }: { session: Session }) {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostData | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    let objectUrl: string | null = null;

    async function getPost() {
      if (!postId) {
        setError('Post not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          caption,
          media_url,
          created_at,
          profiles(username, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.warn(error);
        setError('Could not fetch post details.');
      } else if (data) {
        setPost(data as unknown as PostData);
        downloadMedia(data.media_url);
      }
      setLoading(false);
    }

    async function downloadMedia(path: string) {
      try {
        const { data, error } = await supabase.storage.from('posts').download(path);
        if (error) throw error;
        objectUrl = URL.createObjectURL(data);
        setMediaUrl(objectUrl);
      } catch (error) {
        console.log('Error downloading media: ', (error as Error).message);
        setError('Could not load media.');
      }
    }

    getPost();
    getLikes();
    getComments();

    // Real-time listeners for likes and comments
    const likesSubscription = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${postId}` },
        () => {
          getLikes();
        }
      )
      .subscribe();

    const commentsSubscription = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          getComments();
        }
      )
      .subscribe();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      supabase.removeChannel(likesSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, [postId]);

  async function getLikes() {
    if (!postId) return;
    const { data, error } = await supabase
      .from('likes')
      .select('user_id', { count: 'exact' })
      .eq('post_id', postId);

    if (!error && data) {
      setLikesCount(data.length);
      setIsLiked(data.some((like) => like.user_id === session.user.id));
    }
  }

  async function toggleLike() {
    if (!postId) return;
    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', session.user.id);
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: session.user.id }]);
    }
  }

  async function getComments() {
    if (!postId) return;
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        user_id,
        content,
        created_at,
        profiles(username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as CommentData[]);
    }
  }

  async function addComment() {
    if (!postId || !newComment.trim()) return;
    await supabase.from('comments').insert([
      { post_id: postId, user_id: session.user.id, content: newComment.trim() },
    ]);
    setNewComment('');
  }

  const handleDelete = async () => {
    if (!post) return;

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const { error: storageError } = await supabase.storage
          .from('posts')
          .remove([post.media_url]);
        if (storageError) throw storageError;

        const { error: dbError } = await supabase
          .from('posts')
          .delete()
          .eq('id', post.id);
        if (dbError) throw dbError;

        alert('Post deleted successfully!');
        navigate(`/account`);
      } catch (error) {
        alert((error as Error).message);
      }
    }
  };

  const isVideo = post?.media_url?.match(/\.(mp4|webm|ogg)$/i);
  const isOwner = session.user.id === post?.user_id;
  const authorProfile = post?.profiles?.[0];

  if (loading) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading post...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ProfileAvatar url={authorProfile?.avatar_url || null} size={40} />
            <span className="font-semibold text-gray-800 dark:text-gray-200">{authorProfile?.username}</span>
          </div>
          {isOwner && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Media */}
        <div className="bg-black flex justify-center items-center">
          {mediaUrl &&
            (isVideo ? (
              <video src={mediaUrl} controls className="max-h-[70vh] w-auto" />
            ) : (
              <img src={mediaUrl} alt={post?.caption || 'User post'} className="max-h-[70vh] w-auto" />
            ))}
        </div>

        {/* Caption */}
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">{post?.caption}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {new Date(post?.created_at || '').toLocaleDateString()}
          </p>
        </div>

        {/* Likes + Comments Count */}
        <div className="px-4 pb-2 flex items-center gap-6">
          <button onClick={toggleLike} className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
            {isLiked ? '❤️' : '🤍'} {likesCount}
          </button>
          <span className="text-gray-700 dark:text-gray-300">💬 {comments.length}</span>
        </div>

        {/* Comments Section */}
        <div className="px-4 pb-4">
          {/* Scrollable comments area */}
          <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-3 bg-gray-50 dark:bg-gray-900">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <ProfileAvatar url={comment.profiles?.[0]?.avatar_url || null} size={30} />
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {comment.profiles?.[0]?.username}
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Input */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 border rounded-md px-3 py-1 dark:bg-gray-700 dark:text-gray-200"
            />
            <button
              onClick={addComment}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
