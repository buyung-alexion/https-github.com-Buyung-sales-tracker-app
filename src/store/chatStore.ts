import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

export const chatStore = {
  /**
   * Mengambil riwayat pesan antara dua pihak (atau dalam satu grup/chat_id).
   */
  async loadMessages(chatId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('loadMessages error:', error);
      return [];
    }
    return data as ChatMessage[];
  },

  /**
   * Mengirim pesan baru ke payload database backend.
   */
  async sendMessage(payload: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ...payload,
        status: 'sent',
      }])
      .select()
      .single();

    if (error) {
      console.error('sendMessage error:', error);
      return null;
    }
    return data as ChatMessage;
  },

  /**
   * Memperbarui status message (contoh: jadi read).
   */
  async updateMessageStatus(id: string, status: 'sent' | 'delivered' | 'read') {
    const { error } = await supabase
      .from('messages')
      .update({ status })
      .eq('id', id);

    if (error) console.error('updateMessageStatus error:', error);
  },

  /**
   * Menandai semua pesan di sebuah chat_id sebagai 'read' jika bukan milik senderId tersebut.
   */
  async markAllAsRead(chatId: string, currentUserId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('chat_id', chatId)
      .neq('sender_id', currentUserId)
      .eq('status', 'sent'); // Atau 'delivered'

    if (error) console.error('markAllAsRead error:', error);
  },

  /**
   * Subscribe ke Real-time Database dari Supabase untuk menerima pesan baru.
   */
  subscribeToMessages(chatId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
