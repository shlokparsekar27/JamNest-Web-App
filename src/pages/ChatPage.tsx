// src/pages/ChatPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import ProfileAvatar from '../components/ProfileAvatar';
import Chat from './Chat';

type Conversation = {
  id: number;
  other_user: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  last_message_at: string;
  unread_count: number;
};

const ConversationList = ({ conversations }: { conversations: Conversation[] }) => {
  const { receiverId } = useParams<{ receiverId: string }>();

  return (
    <div className="w-full md:w-1/3 border-r dark:border-gray-700 flex-shrink-0">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-xl font-bold dark:text-white">Messages</h2>
      </div>
      <div className="overflow-y-auto">
        {conversations.map((convo) => (
          <Link
            to={`/chat/${convo.other_user.id}`}
            key={convo.id}
            className={`flex items-center p-4 space-x-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${receiverId === convo.other_user.id ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}
          >
            <ProfileAvatar url={convo.other_user.avatar_url} size={48} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="font-semibold dark:text-white truncate">{convo.other_user.username || 'User'}</p>
                {convo.unread_count > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center -translate-y-1">
                    {convo.unread_count}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last activity: {new Date(convo.last_message_at).toLocaleTimeString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function ChatPage({ session }: { session: Session }) {
  const { receiverId } = useParams<{ receiverId: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    const { data: convosData } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1_id.eq.${session.user.id},participant2_id.eq.${session.user.id}`)
      .order('last_message_at', { ascending: false });

    if (!convosData) {
        setLoading(false);
        return;
    };

    const enrichedConversations = await Promise.all(
      convosData.map(async (convo) => {
        const otherUserId = convo.participant1_id === session.user.id ? convo.participant2_id : convo.participant1_id;
        const { data: profileData } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', otherUserId).single();
        const { count: unreadCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', otherUserId).eq('receiver_id', session.user.id).eq('is_read', false);
        return {
          id: convo.id,
          other_user: profileData || { id: otherUserId, username: 'Unknown User', avatar_url: null },
          last_message_at: convo.last_message_at,
          unread_count: unreadCount || 0,
        };
      })
    );

    setConversations(enrichedConversations);
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
            // The unused 'payload' variable has been removed here.
            fetchConversations();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  return (
    <div className="flex h-full">
      {loading ? (
        <div className="w-full md:w-1/3 border-r dark:border-gray-700 p-4"><p className="text-gray-500">Loading conversations...</p></div>
      ) : (
        <ConversationList conversations={conversations} />
      )}

      {receiverId ? (
        <div className="flex-1">
          <Chat session={session} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Select a conversation to start chatting.</p>
        </div>
      )}
    </div>
  );
}
