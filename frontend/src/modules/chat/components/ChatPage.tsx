import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Send, 
  MessageSquare, 
  Users, 
  Loader2, 
  Check, 
  CheckCheck, 
  Plus, 
  X,
  ArrowLeft,
  SlidersHorizontal,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Image as ImageIcon,
  Mic,
  UserPlus
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { presenceService } from '../services/presenceService';
import { friendService } from '../../friends/services/friendService';
import { webSocketService } from '../services/webSocketService';
import type { 
  ConversationResponse, 
  MessageResponse, 
  MessageStatusEvent
} from '../types/chat.types';

interface ChatPageProps {
  currentUser: { id: string; email: string; fullName?: string; avatar?: string };
  triggerToast: (msg: string) => void;
  initialRecipientId?: string | null;
  onClearInitialRecipient?: () => void;
}

export default function ChatPage({ 
  currentUser, 
  triggerToast, 
  initialRecipientId, 
  onClearInitialRecipient 
}: ChatPageProps) {
  
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<String>>(new Set());
  
  // Loading states
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Input states
  const [searchText, setSearchText] = useState('');
  const [messageInput, setMessageInput] = useState('');
  
  // Filter cho danh sách hội thoại (All / Unread / Groups / Requests)
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'groups' | 'requests'>('all');
  
  // New chat modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendSearchText, setFriendSearchText] = useState('');

  // Refs for tracking closures and scrolling
  const activeConversationRef = useRef<ConversationResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  };

  // 1. Tải danh sách cuộc hội thoại
  const loadConversations = useCallback(async (selectId?: string) => {
    setIsLoadingConvs(true);
    try {
      const data = await chatService.getConversations(0, 100);
      setConversations(data.content);
      
      // Nếu có selectId, chọn hội thoại đó làm active
      if (selectId) {
        const found = data.content.find(c => c.id === selectId);
        if (found) setActiveConversation(found);
      }
    } catch {
      triggerToast('Không tải được danh sách cuộc trò chuyện.');
    } finally {
      setIsLoadingConvs(false);
    }
  }, [triggerToast]);

  // Khởi động load conversations
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 2. Định kỳ check trạng thái Online của partner trong danh sách
  useEffect(() => {
    if (conversations.length === 0) return;
    
    const checkOnline = () => {
      const partnerIds = conversations.map(c => {
        const partner = c.participants.find(p => p.id !== currentUser.id);
        return partner?.id;
      }).filter(Boolean) as string[];

      if (partnerIds.length === 0) return;

      presenceService.checkOnlineStatus(partnerIds)
        .then((onlineList) => {
          setOnlineUserIds(new Set(onlineList));
        })
        .catch(() => {});
    };

    checkOnline();
    const interval = setInterval(checkOnline, 15000); // Check mỗi 15s
    return () => clearInterval(interval);
  }, [conversations, currentUser.id]);

  // 3. Xử lý logic chuyển hướng từ "Nhắn tin" ở FriendsPage
  useEffect(() => {
    if (initialRecipientId) {
      const startChatWithFriend = async () => {
        try {
          const newConv = await chatService.createConversation(initialRecipientId);
          await loadConversations(newConv.id);
        } catch {
          triggerToast('Không thể mở cuộc trò chuyện với người bạn này.');
        } finally {
          // Luôn clear để không gọi lại liên tục khi fail
          if (onClearInitialRecipient) onClearInitialRecipient();
        }
      };
      startChatWithFriend();
    }
  }, [initialRecipientId, loadConversations, onClearInitialRecipient, triggerToast]);

  // 4. Đăng ký các kênh WebSocket để nhận tin nhắn và status realtime
  useEffect(() => {
    if (!currentUser) return;

    // Đăng ký nhận tin nhắn mới
    const unsubscribeMessages = webSocketService.subscribe<{ type: string; data: MessageResponse }>(
      '/user/queue/messages',
      (payload) => {
        if (payload.type === 'NEW_MESSAGE') {
          const newMsg = payload.data;

          // Cập nhật danh sách conversation
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.id === newMsg.conversationId) {
                return {
                  ...c,
                  lastMessage: {
                    senderId: newMsg.sender.id,
                    contentPreview: newMsg.type === 'TEXT' ? newMsg.content : newMsg.type === 'IMAGE' ? '📷 Đã gửi một ảnh' : '📎 Đã gửi một file',
                    type: newMsg.type,
                    sentAt: newMsg.createdAt,
                  },
                  lastMessageAt: newMsg.createdAt,
                  unreadCount: activeConversationRef.current?.id === newMsg.conversationId ? 0 : c.unreadCount + 1,
                };
              }
              return c;
            });
            // Sắp xếp lại hội thoại có tin nhắn mới nhất lên đầu
            return [...updated].sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());
          });

          // Nếu là hội thoại đang active, append vào khung chat
          if (activeConversationRef.current?.id === newMsg.conversationId) {
            setMessages((prev) => {
              // Tránh trùng tin nhắn do Optimistic UI
              const isFromMe = newMsg.sender.id === currentUser.id;
              if (isFromMe) {
                const pendingIdx = prev.findIndex(m => m.status === 'PENDING' && m.content === newMsg.content);
                if (pendingIdx > -1) {
                  const next = [...prev];
                  next[pendingIdx] = { ...newMsg, status: 'SENT' };
                  return next;
                }
              }
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, status: 'SENT' }];
            });

            // Tự động báo đã xem (Seen) cho server
            chatService.markAsSeen(newMsg.conversationId).catch(() => {});
            scrollToBottom('smooth');
          } else {
            // Nếu hội thoại khác và tin nhắn do đối phương gửi, đánh dấu là DELIVERED (nhận thành công)
            if (newMsg.sender.id !== currentUser.id) {
              chatService.markAsDelivered(newMsg.id).catch(() => {});
            }
          }
        }
      }
    );

    // Đăng ký nhận cập nhật trạng thái tin nhắn (DELIVERED / SEEN)
    const unsubscribeStatus = webSocketService.subscribe<MessageStatusEvent>(
      '/user/queue/status',
      (statusEvent) => {
        if (activeConversationRef.current?.id === statusEvent.conversationId) {
          setMessages((prev) => {
            return prev.map((m) => {
              if (statusEvent.status === 'SEEN') {
                if (m.sender.id === currentUser.id && m.status !== 'SEEN') {
                  return { ...m, status: 'SEEN', seenAt: statusEvent.timestamp };
                }
              }
              if (statusEvent.status === 'DELIVERED' && m.id === statusEvent.messageId) {
                if (m.status !== 'SEEN') {
                  return { ...m, status: 'DELIVERED', deliveredAt: statusEvent.timestamp };
                }
              }
              return m;
            });
          });
        }
      }
    );

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
    };
  }, [currentUser, triggerToast]);

  // 5. Load tin nhắn khi mở cuộc trò chuyện
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const data = await chatService.getMessages(activeConversation.id, 0, 50);
        // Map status tin nhắn từ backend
        const mapped = data.content.map(msg => {
          let status: 'SENT' | 'DELIVERED' | 'SEEN' = 'SENT';
          if (msg.seenAt) status = 'SEEN';
          else if (msg.deliveredAt) status = 'DELIVERED';
          return { ...msg, status };
        });
        setMessages(mapped);
        
        // Đánh dấu đã xem toàn bộ tin nhắn chưa đọc
        if (activeConversation.unreadCount > 0) {
          await chatService.markAsSeen(activeConversation.id);
          // Update unread count cục bộ về 0
          setConversations(prev => 
            prev.map(c => c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c)
          );
        }

        // Đánh dấu DELIVERED cho các tin nhắn của đối phương mà chưa DELIVERED
        mapped.forEach(m => {
          if (m.sender.id !== currentUser.id && !m.deliveredAt) {
            chatService.markAsDelivered(m.id).catch(() => {});
          }
        });

        scrollToBottom('auto');
      } catch {
        triggerToast('Không tải được tin nhắn.');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeConversation, currentUser.id, triggerToast]);

  // 6. Gửi tin nhắn mới (Optimistic UI)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    const contentToSend = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: MessageResponse = {
      id: tempId,
      conversationId: activeConversation.id,
      sender: {
        id: currentUser.id,
        name: currentUser.fullName || 'Tôi',
        avatar: currentUser.avatar
      },
      content: contentToSend,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      status: 'PENDING' // hiển thị trạng thái đang gửi (✓ nhạt)
    };

    // Render tin nhắn ngay lập tức vào khung chat (Optimistic UI)
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom('smooth');

    // Cập nhật dòng preview của danh sách chat ngay lập tức
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            lastMessage: {
              senderId: currentUser.id,
              contentPreview: contentToSend,
              type: 'TEXT' as const,
              sentAt: new Date().toISOString()
            },
            lastMessageAt: new Date().toISOString()
          };
        }
        return c;
      });
      return [...updated].sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());
    });

    try {
      // Gửi message qua WebSocket STOMP
      webSocketService.send('/app/chat.send', {
        conversationId: activeConversation.id,
        content: contentToSend,
        type: 'TEXT'
      });
    } catch {
      // Đổi trạng thái sang FAILED nếu mất mạng / lỗi gửi
      setMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m)
      );
      triggerToast('Gửi tin nhắn thất bại, vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  // 7. Tạo cuộc trò chuyện mới từ modal
  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setIsLoadingFriends(true);
    try {
      const list = await friendService.getFriends();
      setFriendsList(list);
    } catch {
      triggerToast('Không tải được danh sách bạn bè.');
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleStartNewChat = async (friendId: string) => {
    setShowNewChatModal(false);
    try {
      const newConv = await chatService.createConversation(friendId);
      // Kiểm tra xem đã có trong danh sách chưa
      const exists = conversations.some(c => c.id === newConv.id);
      if (!exists) {
        setConversations(prev => [newConv, ...prev]);
      }
      setActiveConversation(newConv);
    } catch {
      triggerToast('Không tạo được cuộc hội thoại mới.');
    }
  };

  // Helpers định dạng thời gian
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatMessageDate = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  // Phân nhóm tin nhắn theo ngày
  const groupMessagesByDate = (msgs: MessageResponse[]) => {
    const groups: { [key: string]: MessageResponse[] } = {};
    msgs.forEach(m => {
      const dateStr = new Date(m.createdAt).toDateString();
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(m);
    });
    return groups;
  };

  // Filter conversations based on search text + tab filter
  const filteredConversations = conversations.filter(c => {
    const partner = c.participants.find(p => p.id !== currentUser.id);
    const matchSearch = partner?.name.toLowerCase().includes(searchText.toLowerCase());
    if (!matchSearch) return false;
    
    if (conversationFilter === 'unread') return c.unreadCount > 0;
    if (conversationFilter === 'groups') return false; // Chưa có group chat
    if (conversationFilter === 'requests') return false; // Chưa có message request
    return true; // 'all'
  });

  // Đếm số conversation chưa đọc cho badge
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount > 0 ? 1 : 0), 0);

  const filteredFriends = friendsList.filter(f => 
    f.name?.toLowerCase().includes(friendSearchText.toLowerCase())
  );

  // Lấy thông tin partner của cuộc trò chuyện hiện tại
  const activePartner = activeConversation?.participants.find(p => p.id !== currentUser.id);
  const isActivePartnerOnline = activePartner ? onlineUserIds.has(activePartner.id) : false;

  return (
    <div className="flex bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden h-[calc(100vh-120px)] animate-fade-in-up">

      {/* ========================================================== */}
      {/* CỘT 1: DANH SÁCH CUỘC TRÒ CHUYỆN                           */}
      {/* ========================================================== */}
      <div className={`w-[240px] min-w-[240px] border-r border-slate-200 flex flex-col h-full bg-white shrink-0 ${activeConversation ? 'hidden md:flex' : ''}`}>
        {/* Header Stories */}
        <div className="px-2.5 pt-2.5 pb-1">
          <h3 className="text-[10px] font-black text-slate-800 mb-1.5">Stories</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {/* Your story */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer group">
              <div className="relative h-8 w-8 rounded-full border-[1.5px] border-dashed border-violet-300 flex items-center justify-center bg-violet-50 group-hover:bg-violet-100 transition">
                <Plus className="h-3 w-3 text-violet-500" />
              </div>
              <span className="text-[8px] text-slate-500 font-medium">Bạn</span>
            </div>
            
            {/* Stories từ partners */}
            {conversations.slice(0, 6).map(conv => {
              const partner = conv.participants.find(p => p.id !== currentUser.id);
              if (!partner) return null;
              const isOnline = onlineUserIds.has(partner.id);
              return (
                <div key={conv.id} className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer group">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full p-[1.5px] bg-gradient-to-tr from-violet-500 to-pink-400">
                      <div className="h-full w-full rounded-full border-[1.5px] border-white overflow-hidden bg-slate-100">
                        {partner.avatar ? (
                          <img src={partner.avatar} alt={partner.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold text-[8px]">
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-[6px] w-[6px] border border-white rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-600 font-medium truncate max-w-[36px]">{partner.name.split(' ').pop()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-2.5 pb-1.5">
          <div className="relative flex items-center gap-1">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input 
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Tìm bạn bè hoặc tin nhắn"
                className="w-full pl-7 pr-2 py-1 rounded-full bg-slate-100/70 border border-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white text-[10px] text-slate-700 transition-all font-medium"
              />
            </div>
            <button 
              className="p-1 rounded-full bg-slate-100/70 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
              title="Bộ lọc"
            >
              <SlidersHorizontal className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-2.5 pb-1.5 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setConversationFilter('all')}
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition shrink-0 cursor-pointer ${
              conversationFilter === 'all' 
                ? 'bg-violet-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setConversationFilter('unread')}
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition shrink-0 cursor-pointer flex items-center gap-0.5 ${
              conversationFilter === 'unread' 
                ? 'bg-violet-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chưa đọc
            {totalUnread > 0 && (
              <span className={`text-[7px] font-black px-1 rounded-full ${
                conversationFilter === 'unread' ? 'bg-white text-violet-600' : 'bg-violet-600 text-white'
              }`}>
                {totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setConversationFilter('groups')}
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition shrink-0 cursor-pointer ${
              conversationFilter === 'groups' 
                ? 'bg-violet-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Nhóm
          </button>
          <button
            onClick={() => setConversationFilter('requests')}
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition shrink-0 cursor-pointer ${
              conversationFilter === 'requests' 
                ? 'bg-violet-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Yêu cầu
          </button>
        </div>

        {/* List cuộc trò chuyện */}
        <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0">
          {isLoadingConvs && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <MessageSquare className="h-5 w-5 mx-auto mb-1.5 opacity-30" />
              <p className="text-[9px] font-semibold">Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const partner = conv.participants.find(p => p.id !== currentUser.id);
              if (!partner) return null;

              const isSelected = activeConversation?.id === conv.id;
              const isPartnerOnline = onlineUserIds.has(partner.id);
              const lastMsg = conv.lastMessage;
              const hasUnread = conv.unreadCount > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all hover:bg-slate-50 ${
                    isSelected 
                      ? 'bg-violet-50/50 border-l-2 border-violet-500' 
                      : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-7 w-7 rounded-full border border-slate-200/80 overflow-hidden bg-slate-100">
                      {partner.avatar ? (
                        <img src={partner.avatar} alt={partner.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold text-[9px] bg-slate-50">
                          {partner.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {isPartnerOnline && (
                      <span className="absolute bottom-0 right-0 h-[6px] w-[6px] border border-white rounded-full bg-emerald-500"></span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="flex-grow min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold truncate ${hasUnread ? 'text-slate-900 font-black' : 'text-slate-800'}`}>
                        {partner.name}
                      </h4>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {new Date(lastMsg.sentAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[11px] truncate flex-grow pr-2 ${hasUnread ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                        {lastMsg ? (
                          <>
                            {lastMsg.senderId === currentUser.id && <span className="text-slate-400 mr-1">Bạn:</span>}
                            {lastMsg.contentPreview}
                          </>
                        ) : (
                          <span className="italic text-slate-300">Bắt đầu trò chuyện</span>
                        )}
                      </p>
                      
                      {/* Unread count badge */}
                      {hasUnread && (
                        <span className="h-4 min-w-4 px-1 flex items-center justify-center text-[8px] font-black bg-violet-600 text-white rounded-full shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Nút tìm bạn mới */}
        <div className="px-2 py-1.5 border-t border-slate-100">
          <button 
            onClick={openNewChatModal}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-full border border-violet-200 text-violet-600 font-bold text-[9px] hover:bg-violet-50 transition cursor-pointer"
          >
            <UserPlus className="h-3 w-3" />
            Tìm bạn mới
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* CỘT 2: CHI TIẾT KHUNG CHAT                                 */}
      {/* ========================================================== */}
      <div className={`flex-1 flex flex-col h-full bg-white relative min-w-0 ${!activeConversation ? 'hidden md:flex' : ''}`}>
        {activeConversation ? (
          <>
            {/* Header chat */}
            <div className="px-3 py-1.5 border-b border-slate-200 bg-white flex items-center justify-between z-10">
              <div className="flex items-center gap-2 flex-grow min-w-0">
                <button 
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1 hover:bg-slate-100 rounded transition cursor-pointer shrink-0"
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-slate-600" />
                </button>
                <div className="relative shrink-0">
                  <div className="h-7 w-7 rounded-full border border-slate-200 overflow-hidden bg-slate-100">
                    {activePartner?.avatar ? (
                      <img src={activePartner.avatar} alt={activePartner.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold text-[9px] bg-slate-50">
                        {activePartner?.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isActivePartnerOnline && (
                    <span className="absolute bottom-0 right-0 h-[5px] w-[5px] border border-white rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <h4 className="text-[10px] font-bold text-slate-800 truncate">{activePartner?.name}</h4>
                  <span className="text-[8px] font-medium text-slate-400">
                    {isActivePartnerOnline ? (
                      <span className="text-emerald-600 font-bold">Đang hoạt động</span>
                    ) : (
                      'Ngoại tuyến'
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0 shrink-0">
                <button className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer" title="Tìm kiếm">
                  <Search className="h-3 w-3" />
                </button>
                <button className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer" title="Gọi thoại">
                  <Phone className="h-3 w-3" />
                </button>
                <button className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer" title="Gọi video">
                  <Video className="h-3 w-3" />
                </button>
                <button className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer" title="Tùy chọn">
                  <MoreVertical className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Khung chứa các tin nhắn */}
            <div 
              ref={chatScrollContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col"
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-24 flex-grow">
                  <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 flex-grow text-slate-400">
                  <MessageSquare className="h-10 w-10 opacity-30 mb-2" />
                  <p className="text-xs font-medium">Bắt đầu gửi tin nhắn chào mừng bạn mới nhé!</p>
                </div>
              ) : (
                Object.entries(groupMessagesByDate(messages)).map(([dateStr, dateMsgs]) => (
                  <div key={dateStr} className="space-y-3">
                    {/* Divider ngày */}
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-slate-200/60 text-[10px] text-slate-500 font-bold rounded-full">
                        {formatMessageDate(dateMsgs[0].createdAt)}
                      </span>
                    </div>

                    {dateMsgs.map((m, idx) => {
                      const isMe = m.sender.id === currentUser.id;
                      const showStatus = isMe && idx === dateMsgs.length - 1; // Chỉ show status cho tin nhắn cuối cùng trong nhóm của mình

                      return (
                        <div 
                          key={m.id} 
                          className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          {/* Avatar đối phương */}
                          {!isMe && (
                            <div className="h-7 w-7 rounded-full border overflow-hidden bg-slate-100 shrink-0">
                              {activePartner?.avatar ? (
                                <img src={activePartner.avatar} alt="Avatar" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50 text-[10px]">
                                  {activePartner?.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bong bóng tin nhắn */}
                          <div className="flex flex-col items-end">
                            <div 
                              className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm font-medium ${
                                isMe 
                                  ? 'bg-violet-600 text-white rounded-br-sm text-right' 
                                  : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200/60 text-left'
                              }`}
                            >
                              {m.content}
                            </div>
                            
                            {/* Metadata bên dưới bong bóng */}
                            <div className="flex items-center gap-1.5 mt-1 px-1">
                              <span className="text-[9px] text-slate-400 font-medium">
                                {formatTime(m.createdAt)}
                              </span>

                              {/* Icon trạng thái tin nhắn (Optimistic UI & Realtime Status) */}
                              {showStatus && (
                                <span className="inline-flex text-[9px] text-violet-500 font-bold">
                                  {m.status === 'PENDING' && (
                                    <span title="Đang gửi">
                                      <Check className="h-3 w-3 text-slate-300 animate-pulse" />
                                    </span>
                                  )}
                                  {m.status === 'SENT' && (
                                    <span title="Đã gửi">
                                      <Check className="h-3 w-3 text-slate-400" />
                                    </span>
                                  )}
                                  {m.status === 'DELIVERED' && (
                                    <span title="Đã đến">
                                      <CheckCheck className="h-3 w-3 text-slate-400" />
                                    </span>
                                  )}
                                  {m.status === 'SEEN' && (
                                    <span className="text-[9px] flex items-center bg-violet-50 text-violet-600 px-1 rounded font-black tracking-tighter" title="Đã xem">👁️</span>
                                  )}
                                  {m.status === 'FAILED' && (
                                    <span className="text-rose-500 font-black cursor-pointer" title="Lỗi gửi, bấm để thử lại" onClick={() => {
                                      // Resend logic
                                      setMessageInput(m.content);
                                      setMessages(prev => prev.filter(item => item.id !== m.id));
                                    }}>⚠️</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              {/* Element neo scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form 
              onSubmit={handleSendMessage}
              className="px-2.5 py-1.5 border-t border-slate-200 bg-white flex items-center gap-1 z-10"
            >
              <div className="flex items-center shrink-0">
                <button type="button" className="h-6 w-6 rounded-full flex items-center justify-center text-violet-500 hover:bg-violet-50 transition cursor-pointer" title="Thêm">
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition cursor-pointer" title="Emoji">
                  <Smile className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition cursor-pointer" title="Ảnh">
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition cursor-pointer" title="Mic">
                  <Mic className="h-3.5 w-3.5" />
                </button>
              </div>
              <input 
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Nhắn tin cho ${activePartner?.name || ''}...`}
                className="flex-grow px-2.5 py-1 rounded-full bg-slate-100/70 border border-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white text-[10px] text-slate-700 transition-all font-medium"
              />
              <button 
                type="submit"
                disabled={!messageInput.trim() || isSending}
                className="h-6 w-6 bg-violet-600 text-white rounded-full hover:bg-violet-500 disabled:opacity-50 transition shrink-0 cursor-pointer flex items-center justify-center"
              >
                {isSending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-8">
            <MessageSquare className="h-16 w-16 opacity-20 mb-4 animate-bounce" />
            <h3 className="font-outfit font-black text-slate-800 text-sm">Chưa chọn cuộc trò chuyện nào</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs text-center">
              Chọn từ danh sách bên trái hoặc bấm nút "+" để kết nối và trò chuyện với bạn bè của bạn.
            </p>
          </div>
        )}
      </div>

      {/* MODAL TẠO CHAT MỚI */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[500px] animate-fade-in-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="font-outfit font-black text-slate-800 text-sm">Trò chuyện mới</span>
              <button 
                onClick={() => setShowNewChatModal(false)}
                title="Đóng"
                className="p-1.5 rounded-lg hover:bg-slate-200 transition text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search filter bạn bè */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text"
                  value={friendSearchText}
                  onChange={(e) => setFriendSearchText(e.target.value)}
                  placeholder="Tìm bạn bè..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-xs text-slate-700 transition-all font-medium"
                />
              </div>
            </div>

            {/* List bạn bè để chọn */}
            <div className="flex-grow overflow-y-auto p-2 divide-y divide-slate-50">
              {isLoadingFriends ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Không tìm thấy bạn bè nào phù hợp</p>
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.userId}
                    onClick={() => handleStartNewChat(friend.userId)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                  >
                    <div className="h-10 w-10 rounded-full border overflow-hidden bg-slate-100 shadow-sm shrink-0">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-left overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{friend.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{friend.bio || friend.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
