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
    const filter = chatId === '*' ? undefined : `chat_id=eq.${chatId}`;
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter },
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

    const { data: lastMessages } = await supabase
      .from('messages')
      .select('chat_id, text, timestamp')
      .order('timestamp', { ascending: false });

    const getLatestInfo = (chatId: string) => {
      const msg = lastMessages?.find(m => m.chat_id === chatId);
      if (!msg) return { text: 'Ketuk untuk mulai obrolan...', time: '', ts: '' };
      
      const d = new Date(msg.timestamp);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = isToday 
        ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

      return { text: msg.text || '📷 Foto', time: timeStr, ts: msg.timestamp };
    };

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
      const latest = getLatestInfo(chatId);
      return {
        id: s.id,
        name: s.nama,
        type: 'direct' as const,
        avatar: s.foto_profil,
        lastMessage: latest.text,
        lastMessageTime: latest.time,
        lastMessageTimestamp: latest.ts,
        unreadCount: getUnreadCount(chatId),
      };
    });

    // Mengambil grup dari database
    const { data: dbRooms } = await supabase.from('chat_rooms').select('*').eq('type', 'group');
    const groups: ChatContact[] = (dbRooms || []).map(r => {
      const latest = getLatestInfo(r.id);
      return {
        id: r.id,
        name: r.name,
        type: 'group' as const,
        avatar: r.photo_url,
        lastMessage: latest.text,
        lastMessageTime: latest.time,
        lastMessageTimestamp: latest.ts,
        unreadCount: getUnreadCount(r.id),
      };
    });

    // Fallback if no groups found (ensure some default existence)
    if (groups.length === 0) {
      const latest = getLatestInfo('g-pusat');
      groups.push({
        id: 'g-pusat',
        name: 'Grup Pengumuman Pusat',
        type: 'group' as const,
        lastMessage: latest.text,
        lastMessageTime: latest.time,
        lastMessageTimestamp: latest.ts,
        unreadCount: getUnreadCount('g-pusat'),
      });
    }

    if (includeManager) {
      const chatId = [currentUserId, 'Manager-1'].sort().join('_');
      const latest = getLatestInfo(chatId);
      groups.unshift({
        id: 'Manager-1',
        name: 'Admin Pusat',
        type: 'direct' as const,
        lastMessage: latest.text,
        lastMessageTime: latest.time,
        lastMessageTimestamp: latest.ts,
        unreadCount: getUnreadCount(chatId),
        online: true
      });
    }

    return [...groups, ...contacts].sort((a, b) => {
      const tsA = a.lastMessageTimestamp || '0';
      const tsB = b.lastMessageTimestamp || '0';
      return tsB.localeCompare(tsA);
    });
  }
};
