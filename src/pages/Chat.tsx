// src/pages/Chat.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

// --- START: NEW CHANGES ---
type Message = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string | null; // Content can now be null
  media_url: string | null; // New property for file links
  created_at: string;
};

// A new component to render media messages (images/videos)
const MediaMessage = ({ path }: { path: string }) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    async function downloadMedia() {
      const { data, error } = await supabase.storage.from('chat-media').download(path);
      if (error) {
        console.error('Error downloading media:', error);
      } else {
        objectUrl = URL.createObjectURL(data);
        setMediaUrl(objectUrl);
      }
    }
    downloadMedia();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  const isVideo = path.match(/\.(mp4|webm|ogg)$/i);

  if (!mediaUrl) return <div className="p-2 text-xs text-gray-400">Loading media...</div>;

  return isVideo ? (
    <video src={mediaUrl} controls className="max-w-xs rounded-lg" />
  ) : (
    <img src={mediaUrl} alt="Chat media" className="max-w-xs rounded-lg" />
  );
};
// --- END: NEW CHANGES ---

const OptionsMenu = ({ onDeleteChat }: { onDeleteChat: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
          <button
            onClick={() => {
              onDeleteChat();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Delete Chat History
          </button>
        </div>
      )}
    </div>
  );
};

export default function Chat({ session }: { session: Session }) {
  const { receiverId } = useParams<{ receiverId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverUsername, setReceiverUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  // --- START: NEW CHANGES ---
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // --- END: NEW CHANGES ---

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!receiverId) return;

    const markAsRead = async () => {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        sender_id_param: receiverId
      });
      if (error) console.error('Error marking messages as read:', error);
    };

    const fetchInitialData = async () => {
      setLoading(true);
      await markAsRead();

      const { data: profileData } = await supabase.from('profiles').select('username').eq('id', receiverId).single();
      if (profileData) setReceiverUsername(profileData.username || 'User');

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching messages:', error);
      } else {
        setMessages(messagesData || []);
      }
      setLoading(false);
    };

    fetchInitialData();

    const channelName = `chat-${[session.user.id, receiverId].sort().join('-')}`;
    const channel = supabase.channel(channelName);

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as Message;
        if (
          (newMessage.sender_id === session.user.id && newMessage.receiver_id === receiverId) ||
          (newMessage.sender_id === receiverId && newMessage.receiver_id === session.user.id)
        ) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          if (newMessage.sender_id === receiverId) {
            markAsRead();
          }
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        const deletedMessage = payload.old as Partial<Message>;
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== deletedMessage.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [receiverId, session.user.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !receiverId) return;

    await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: receiverId,
      content: newMessage.trim(),
    });

    setNewMessage('');
  };

  // --- START: NEW CHANGES ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !receiverId) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const folderName = [session.user.id, receiverId].sort().join('-');
    const filePath = `${folderName}/${Date.now()}.${fileExt}`;

    setUploading(true);
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
    } else {
      await supabase.from('messages').insert({
        sender_id: session.user.id,
        receiver_id: receiverId,
        media_url: filePath,
        content: null,
      });
    }
    setUploading(false);
  };

  const handleDeleteMessage = async (messageId: number, mediaUrl: string | null) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      if (mediaUrl) {
        const { error: storageError } = await supabase.storage.from('chat-media').remove([mediaUrl]);
        if (storageError) alert(storageError.message);
      }
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) {
        alert(error.message);
      }
    }
  };
  // --- END: NEW CHANGES ---

  const handleDeleteChat = async () => {
    if (window.confirm('Are you sure you want to delete this entire chat history? This cannot be undone.')) {
      if (!receiverId) return;
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`);

      if (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 className="text-xl font-bold dark:text-white text-center flex-1">Chat with {receiverUsername}</h1>
        <OptionsMenu onDeleteChat={handleDeleteChat} />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading chat history...</p>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`group flex items-center gap-2 ${msg.sender_id === session.user.id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender_id === session.user.id && (
                <button
                  onClick={() => handleDeleteMessage(msg.id, msg.media_url)}
                  className="p-1 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl ${msg.sender_id === session.user.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                  }`}
              >
                {/* --- START: NEW CHANGES --- */}
                {msg.media_url ? (
                  <MediaMessage path={msg.media_url} />
                ) : (
                  <p
                    className={`text-sm p-3 
                      ${msg.sender_id === session.user.id ? 'text-white dark:text-white' : 'text-gray-800 dark:text-gray-200'}
                    `}
                  >
                    {msg.content}
                  </p>

                )}
                {/* --- END: NEW CHANGES --- */}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          {/* --- START: NEW CHANGES --- */}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*,video/*" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          {/* --- END: NEW CHANGES --- */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={uploading ? "Uploading file..." : "Type a message..."}
            disabled={uploading}
            className="flex-1 px-4 py-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50"
            disabled={!newMessage.trim() || uploading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}