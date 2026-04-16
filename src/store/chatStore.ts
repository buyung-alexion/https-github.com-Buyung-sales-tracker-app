import { supabase } from '../lib/supabase';
import type { ChatMessage, ChatContact } from '../types';

export const chatStore = {
  /**
   * Menghasilkan Chat ID yang konsisten untuk Direct Message antara dua user.
   * Menggunakan sorting agar ID yang dihasilkan sama siapapun yang memulai.
   */
   getChatId(id1: string, id2: string): string {
    if (id1.startsWith('g-') || id2.startsWith('g-')) {
      return id1.startsWith('g-') ? id1 : id2;
    }
    return [id1, id2].sort().join('_');
  },

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
  },

  /**
   * Mengambil list kontak secara dinamis berdasarkan data tabel sales.
   */
  async loadContacts(currentUserId: string, includeManager = false): Promise<ChatContact[]> {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .order('nama', { ascending: true });

    if (error || !sales) {
      console.error('loadContacts error:', error);
      return [];
    }

    // Mengambil jumlah unread secara batch
    const { data: unreadData } = await supabase
      .from('messages')
      .select('chat_id')
      .neq('sender_id', currentUserId)
      .neq('status', 'read');

    const getUnreadCount = (chatId: string) => {
      return unreadData?.filter(m => m.chat_id === chatId).length || 0;
    };

    const contacts: ChatContact[] = sales.map((s) => {
      const chatId = [currentUserId, s.id].sort().join('_');
      return {
        id: s.id,
        name: s.nama,
        type: 'direct' as const,
        lastMessage: 'Ketuk untuk mulai obrolan...',
        lastMessageTime: '',
        unreadCount: getUnreadCount(chatId),
      };
    });

    // Mengambil grup dari database
    const { data: dbRooms } = await supabase.from('chat_rooms').select('*').eq('type', 'group');
    const groups: ChatContact[] = (dbRooms || []).map(r => ({
      id: r.id,
      name: r.name,
      type: 'group' as const,
      lastMessage: 'Channel grup tim Sales',
      lastMessageTime: '',
      unreadCount: getUnreadCount(r.id),
    }));

    // Fallback if no groups found (ensure some default existence)
    if (groups.length === 0) {
      groups.push({
        id: 'g-pusat',
        name: 'Grup Pengumuman Pusat',
        type: 'group' as const,
        lastMessage: 'Channel resmi tim Sales',
        lastMessageTime: '',
        unreadCount: getUnreadCount('g-pusat'),
      });
    }

    if (includeManager) {
      groups.unshift({
        id: 'Manager-1',
        name: 'Admin Pusat',
        type: 'direct' as const,
        lastMessage: 'Hubungi admin pusat untuk bantuan',
        lastMessageTime: '',
        unreadCount: getUnreadCount([currentUserId, 'Manager-1'].sort().join('_')),
        online: true
      });
    }

    return [...groups, ...contacts];
  }
};
