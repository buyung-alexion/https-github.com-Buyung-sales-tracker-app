import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useChatNotifications(currentUserId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!currentUserId) return;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender_id', currentUserId)
        .neq('status', 'read');

      if (!error) {
        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('global_chat_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // If message is for a chat I'm part of (hard to filter perfectly in client, but let's just re-fetch)
          if (payload.new.sender_id !== currentUserId) {
            fetchUnreadCount();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => fetchUnreadCount() // When status changes to 'read'
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return unreadCount;
}
