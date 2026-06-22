import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
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
  UserPlus,
  User,
  BellOff,
  MoreHorizontal,
  FileText,
  Star,
  Reply,
  CornerDownRight,
  Pencil,
  Trash2
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { presenceService } from '../services/presenceService';
import { friendService } from '../../friends/services/friendService';
import { webSocketService } from '../services/webSocketService';
import type {
  ConversationResponse,
  MessageResponse,
  MessageStatusEvent,
  TypingEvent,
  MessageReactionEvent,
  MessageUpdateEvent
} from '../types/chat.types';

interface ChatPageProps {
  currentUser: { id: string; email: string; fullName?: string; avatar?: string };
  triggerToast: (msg: string) => void;
  initialRecipientId?: string | null;
  onClearInitialRecipient?: () => void;
}

// Bộ cảm xúc cho tin nhắn (Sprint 4.4 - Message Reactions). Phải khớp ALLOWED_EMOJIS ở backend.
const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

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

  // Typing indicator: map conversationId -> tên người đang gõ (Sprint 4.4)
  const [typingByConv, setTypingByConv] = useState<Record<string, string>>({});

  // Message Reactions: messageId đang mở picker cảm xúc (Sprint 4.4)
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);

  // Reply to Message: tin nhắn đang được chuẩn bị trả lời (Sprint 4.4)
  const [replyingTo, setReplyingTo] = useState<MessageResponse | null>(null);

  // Sprint 4.5: tin nhắn đang sửa + menu xóa đang mở
  const [editingMessage, setEditingMessage] = useState<MessageResponse | null>(null);
  const [deleteMenuFor, setDeleteMenuFor] = useState<string | null>(null);

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

  // Refs cho Typing Indicator (Sprint 4.4)
  const typingThrottleRef = useRef<number | null>(null);      // throttle gửi event "đang gõ"
  const typingStopTimerRef = useRef<number | null>(null);     // tự gửi "dừng gõ" sau khi ngừng nhập
  const typingClearTimersRef = useRef<Record<string, number>>({}); // auto-ẩn indicator nhận được (double-safety)

  // Ref + state cho gửi ảnh (Sprint 4.4 - Media in Chat)
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({}); // tempId -> %
  // Ảnh đã chọn chờ gửi (preview tray, tối đa 4 - giống Messenger)
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File; url: string }[]>([]);
  // Tin nhắn đang được highlight khi nhảy tới (click quote reply)
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  // Map messageId -> DOM element để scroll tới khi bấm quote
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Infinite scroll (Sprint 4.5 đợt 2): phân trang tải tin cũ
  const PAGE_SIZE = 15;
  const messagesPageRef = useRef(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  // Lưu scrollHeight trước khi prepend để giữ nguyên vị trí cuộn
  const prependPrevHeightRef = useRef<number | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Cleanup typing timers khi unmount (tránh memory leak) - Sprint 4.4
  useEffect(() => {
    const clearTimers = typingClearTimersRef.current;
    return () => {
      if (typingThrottleRef.current) clearTimeout(typingThrottleRef.current);
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      Object.values(clearTimers).forEach((t) => clearTimeout(t));
    };
  }, []);

  // Auto-scroll khi đối phương bắt đầu gõ (để thấy indicator) - Sprint 4.4
  useEffect(() => {
    if (activeConversation && typingByConv[activeConversation.id]) {
      scrollToBottom('smooth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingByConv, activeConversation]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    setTimeout(() => {
      if (chatScrollContainerRef.current) {
        chatScrollContainerRef.current.scrollTo({
          top: chatScrollContainerRef.current.scrollHeight,
          behavior
        });
      }
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
        .catch(() => { });
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
              // Dedup theo id TRƯỚC (phòng REST đã thêm tin server rồi → tránh trùng key)
              if (prev.some(m => m.id === newMsg.id)) return prev;

              const isFromMe = newMsg.sender.id === currentUser.id;
              if (isFromMe) {
                // Match optimistic: TEXT theo content, IMAGE/FILE theo type (ảnh không có content)
                const pendingIdx = prev.findIndex(m =>
                  m.status === 'PENDING' &&
                  (newMsg.type === 'TEXT' ? m.content === newMsg.content : m.type === newMsg.type)
                );
                if (pendingIdx > -1) {
                  const next = [...prev];
                  // Giữ replyTo + blob preview của optimistic nếu server không trả về
                  next[pendingIdx] = {
                    ...newMsg,
                    status: 'SENT',
                    replyTo: newMsg.replyTo ?? prev[pendingIdx].replyTo,
                    mediaUrl: newMsg.mediaUrl ?? prev[pendingIdx].mediaUrl,
                  };
                  return next;
                }
              }
              return [...prev, { ...newMsg, status: 'SENT' }];
            });

            // Tự động báo đã xem (Seen) cho server
            chatService.markAsSeen(newMsg.conversationId).catch(() => { });
            scrollToBottom('smooth');
          } else {
            // Nếu hội thoại khác và tin nhắn do đối phương gửi, đánh dấu là DELIVERED (nhận thành công)
            if (newMsg.sender.id !== currentUser.id) {
              chatService.markAsDelivered(newMsg.id).catch(() => { });
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

    // Đăng ký nhận sự kiện "đang gõ" (Typing Indicator - Sprint 4.4)
    const unsubscribeTyping = webSocketService.subscribe<TypingEvent>(
      '/user/queue/typing',
      (evt) => {
        // Bỏ qua nếu event do chính mình phát (an toàn 2 lớp)
        if (evt.userId === currentUser.id) return;

        setTypingByConv((prev) => {
          const next = { ...prev };
          if (evt.typing) {
            next[evt.conversationId] = evt.userName;
          } else {
            delete next[evt.conversationId];
          }
          return next;
        });

        // Clear timer auto-ẩn cũ
        const existingTimer = typingClearTimersRef.current[evt.conversationId];
        if (existingTimer) {
          clearTimeout(existingTimer);
          delete typingClearTimersRef.current[evt.conversationId];
        }

        // Double-safety: tự ẩn indicator sau 5s nếu không nhận thêm event
        // (phòng khi event "dừng gõ" bị mất do đóng tab/mất mạng)
        if (evt.typing) {
          typingClearTimersRef.current[evt.conversationId] = window.setTimeout(() => {
            setTypingByConv((prev) => {
              const next = { ...prev };
              delete next[evt.conversationId];
              return next;
            });
            delete typingClearTimersRef.current[evt.conversationId];
          }, 5000);
        }
      }
    );

    // Đăng ký nhận cập nhật reaction tin nhắn (Message Reactions - Sprint 4.4)
    const unsubscribeReactions = webSocketService.subscribe<MessageReactionEvent>(
      '/user/queue/reactions',
      (evt) => {
        if (activeConversationRef.current?.id === evt.conversationId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === evt.messageId ? { ...m, reactions: evt.reactions } : m))
          );
        }
      }
    );

    // Đăng ký nhận cập nhật tin nhắn (sửa / thu hồi - Sprint 4.5)
    const unsubscribeUpdates = webSocketService.subscribe<MessageUpdateEvent>(
      '/user/queue/updates',
      (evt) => {
        if (activeConversationRef.current?.id === evt.conversationId) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== evt.messageId) return m;
              if (evt.deleted) {
                return { ...m, deleted: true, content: '', mediaUrl: undefined, reactions: {} };
              }
              return { ...m, content: evt.content ?? m.content, editedAt: evt.editedAt };
            })
          );
        }
      }
    );

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      unsubscribeTyping();
      unsubscribeReactions();
      unsubscribeUpdates();
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
      messagesPageRef.current = 0;
      try {
        const data = await chatService.getMessages(activeConversation.id, 0, PAGE_SIZE);
        // Backend trả mới nhất trước (DESC) → đảo lại để hiển thị cũ → mới
        const mapped = [...data.content].reverse().map(msg => {
          let status: 'SENT' | 'DELIVERED' | 'SEEN' = 'SENT';
          if (msg.seenAt) status = 'SEEN';
          else if (msg.deliveredAt) status = 'DELIVERED';
          return { ...msg, status };
        });
        setMessages(mapped);
        setHasMoreMessages(data.content.length === PAGE_SIZE);

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
            chatService.markAsDelivered(m.id).catch(() => { });
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

  // Tải tin nhắn cũ hơn khi cuộn lên đầu (Sprint 4.5 đợt 2 - Infinite Scroll)
  const loadOlderMessages = useCallback(async () => {
    const conv = activeConversationRef.current;
    const container = chatScrollContainerRef.current;
    if (!conv || !container || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    // Ghi nhớ chiều cao trước khi prepend để giữ vị trí cuộn
    prependPrevHeightRef.current = container.scrollHeight;

    const nextPage = messagesPageRef.current + 1;
    try {
      const data = await chatService.getMessages(conv.id, nextPage, PAGE_SIZE);
      if (data.content.length > 0) {
        const older = [...data.content].reverse().map(msg => {
          let status: 'SENT' | 'DELIVERED' | 'SEEN' = 'SENT';
          if (msg.seenAt) status = 'SEEN';
          else if (msg.deliveredAt) status = 'DELIVERED';
          return { ...msg, status };
        });
        messagesPageRef.current = nextPage;
        // Prepend tin cũ, lọc trùng id (an toàn)
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const unique = older.filter(m => !existingIds.has(m.id));
          return [...unique, ...prev];
        });
      }
      setHasMoreMessages(data.content.length === PAGE_SIZE);
    } catch {
      prependPrevHeightRef.current = null;
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  // Giữ nguyên vị trí cuộn sau khi prepend tin cũ (chạy trước paint để không nháy)
  useLayoutEffect(() => {
    const container = chatScrollContainerRef.current;
    if (container && prependPrevHeightRef.current !== null) {
      const diff = container.scrollHeight - prependPrevHeightRef.current;
      container.scrollTop = diff;
      prependPrevHeightRef.current = null;
    }
  }, [messages]);

  // Handler cuộn: chạm gần đầu khung → tải thêm tin cũ
  const handleMessagesScroll = useCallback(() => {
    const container = chatScrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 80 && hasMoreMessages && !isLoadingMoreRef.current) {
      loadOlderMessages();
    }
  }, [hasMoreMessages, loadOlderMessages]);

  // Emit sự kiện "đang gõ" qua WebSocket với throttle (Sprint 4.4)
  const emitTyping = useCallback(() => {
    const conv = activeConversationRef.current;
    if (!conv) return;

    // Throttle: chỉ gửi "đang gõ" tối đa 1 lần mỗi 2s
    if (!typingThrottleRef.current) {
      webSocketService.send('/app/chat.typing', { conversationId: conv.id, typing: true });
      typingThrottleRef.current = window.setTimeout(() => {
        typingThrottleRef.current = null;
      }, 2000);
    }

    // Reset timer tự gửi "dừng gõ" sau 3s không nhập thêm
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
    }
    typingStopTimerRef.current = window.setTimeout(() => {
      webSocketService.send('/app/chat.typing', { conversationId: conv.id, typing: false });
      if (typingThrottleRef.current) {
        clearTimeout(typingThrottleRef.current);
        typingThrottleRef.current = null;
      }
    }, 3000);
  }, []);

  // Gửi "dừng gõ" ngay lập tức (gọi khi gửi tin nhắn hoặc đóng conversation)
  const emitStopTyping = useCallback(() => {
    const conv = activeConversationRef.current;
    if (!conv) return;
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (typingThrottleRef.current) {
      clearTimeout(typingThrottleRef.current);
      typingThrottleRef.current = null;
    }
    webSocketService.send('/app/chat.typing', { conversationId: conv.id, typing: false });
  }, []);

  // Thả / gỡ cảm xúc cho tin nhắn (Sprint 4.4 - Message Reactions, Optimistic UI)
  const handleReact = useCallback((messageId: string, emoji: string) => {
    setReactionPickerFor(null);

    // Optimistic: cập nhật ngay tại local trước khi server phản hồi
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        if (reactions[currentUser.id] === emoji) {
          delete reactions[currentUser.id]; // toggle off
        } else {
          reactions[currentUser.id] = emoji;
        }
        return { ...m, reactions };
      })
    );

    webSocketService.send('/app/chat.react', { messageId, emoji });
  }, [currentUser.id]);

  // Chọn ảnh → thêm vào tray preview (tối đa 4), KHÔNG gửi ngay (Sprint 4.4 - Media)
  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // reset để chọn lại cùng file được
    if (files.length === 0) return;

    setPendingImages((prev) => {
      const remaining = 4 - prev.length;
      if (remaining <= 0) {
        triggerToast('Tối đa 4 ảnh mỗi lần gửi.');
        return prev;
      }
      const toAdd: { id: string; file: File; url: string }[] = [];
      for (const file of files) {
        if (toAdd.length >= remaining) {
          triggerToast('Tối đa 4 ảnh mỗi lần gửi.');
          break;
        }
        if (!file.type.startsWith('image/')) {
          triggerToast('Chỉ hỗ trợ file ảnh.');
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          triggerToast(`Ảnh "${file.name}" quá lớn (tối đa 20MB).`);
          continue;
        }
        toAdd.push({ id: `pimg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file, url: URL.createObjectURL(file) });
      }
      return [...prev, ...toAdd];
    });
  };

  // Xóa 1 ảnh khỏi tray preview
  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  // Upload 1 ảnh (Optimistic + progress + nén). Trả promise để gửi tuần tự.
  const uploadOneImage = async (file: File, replyId: string | null, attachedContent?: string) => {
    const convId = activeConversation!.id;
    const tempId = `temp-img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const localPreview = URL.createObjectURL(file);

    const optimistic: MessageResponse = {
      id: tempId,
      conversationId: convId,
      sender: { id: currentUser.id, name: currentUser.fullName || 'Tôi', avatar: currentUser.avatar },
      content: attachedContent || '',
      type: 'IMAGE',
      mediaUrl: localPreview,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };
    setMessages((prev) => [...prev, optimistic]);
    setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));
    scrollToBottom('smooth');

    try {
      let toUpload = file;
      if (file.type !== 'image/gif' && file.size > 1024 * 1024) {
        const blob = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          preserveExif: true,
          fileType: 'image/webp',
        });
        toUpload = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' });
      }

      const serverMsg = await chatService.sendImage(convId, toUpload, attachedContent, replyId, (percent) => {
        setUploadProgress((prev) => ({ ...prev, [tempId]: percent }));
      });

      setMessages((prev) => {
        // Nếu WS đã thêm tin server rồi (race) → chỉ xóa optimistic tempId, tránh trùng
        if (prev.some((m) => m.id === serverMsg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        // Giữ blob preview local cho mượt (ảnh server load ngầm)
        return prev.map((m) => (m.id === tempId ? { ...serverMsg, status: 'SENT', mediaUrl: serverMsg.mediaUrl ?? m.mediaUrl } : m));
      });
      setUploadProgress((prev) => { const n = { ...prev }; delete n[tempId]; return n; });
      URL.revokeObjectURL(localPreview);
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'FAILED' } : m)));
      setUploadProgress((prev) => { const n = { ...prev }; delete n[tempId]; return n; });
      triggerToast('Gửi ảnh thất bại, vui lòng thử lại.');
    }
  };

  // Gửi toàn bộ ảnh trong tray (mỗi ảnh = 1 message, reply gắn vào ảnh đầu tiên)
  const flushPendingImages = async (attachedContent?: string) => {
    if (pendingImages.length === 0) return;
    const images = [...pendingImages];
    const replyId = replyingTo?.id ?? null;
    setPendingImages([]);
    setReplyingTo(null);
    for (let i = 0; i < images.length; i++) {
      const contentForThisImage = i === 0 ? attachedContent : undefined;
      await uploadOneImage(images[i].file, i === 0 ? replyId : null, contentForThisImage);
      URL.revokeObjectURL(images[i].url);
    }
  };

  // Nhảy tới tin nhắn gốc khi bấm vào quote reply (Sprint 4.4 - giống Facebook)
  const jumpToMessage = (messageId: string) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(messageId);
      setTimeout(() => setHighlightedMsgId(null), 1600);
    } else {
      triggerToast('Tin nhắn gốc không còn trong khung hiển thị.');
    }
  };

  // Sprint 4.5: kiểm tra còn trong cửa sổ 15 phút không
  const within15Min = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 15 * 60 * 1000;

  // Bắt đầu sửa tin nhắn → đưa nội dung vào ô input
  const startEditing = (m: MessageResponse) => {
    setEditingMessage(m);
    setReplyingTo(null);
    setMessageInput(m.content);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setMessageInput('');
  };

  // Lưu chỉnh sửa (Optimistic UI)
  const handleSaveEdit = async () => {
    if (!editingMessage) return;
    const newContent = messageInput.trim();
    if (!newContent) return;
    const msgId = editingMessage.id;
    const nowIso = new Date().toISOString();
    const previousMessage = editingMessage;

    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: newContent, editedAt: nowIso } : m)));
    setEditingMessage(null);
    setMessageInput('');

    try {
      await chatService.editMessage(msgId, newContent);
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, content: previousMessage.content, editedAt: previousMessage.editedAt }
            : m
        )
      );
      setEditingMessage(previousMessage);
      setMessageInput(previousMessage.content ?? '');
      triggerToast('Không sửa được tin nhắn (quá 15 phút hoặc lỗi).');
    }
  };

  // Xóa tin nhắn (me = xóa riêng, everyone = thu hồi)
  const handleDelete = async (m: MessageResponse, scope: 'me' | 'everyone') => {
    setDeleteMenuFor(null);
    const previousMessages = messages;
    if (scope === 'everyone') {
      // Optimistic: đánh dấu thu hồi
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted: true, content: '', mediaUrl: undefined, reactions: {} } : x)));
    } else {
      // Xóa riêng: gỡ khỏi danh sách phía mình
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    }
    try {
      await chatService.deleteMessage(m.id, scope);
    } catch {
      setMessages(previousMessages);
      triggerToast('Không xóa được tin nhắn.');
    }
  };

  // 6. Gửi tin nhắn mới (Optimistic UI)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation) return;

    // Nếu đang sửa tin nhắn → lưu chỉnh sửa thay vì gửi mới (Sprint 4.5)
    if (editingMessage) {
      await handleSaveEdit();
      return;
    }

    // Dừng phát typing ngay khi gửi tin
    emitStopTyping();

    const hasText = messageInput.trim().length > 0;
    const hasImages = pendingImages.length > 0;
    if (!hasText && !hasImages) return;

    // Gửi ảnh trong tray trước (nếu có) kèm theo chữ làm Caption
    if (hasImages) {
      const contentToSend = messageInput.trim();
      setMessageInput('');
      await flushPendingImages(contentToSend);
      return; // Xong luôn, không gửi thêm tin TEXT riêng biệt nữa!
    }

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
      status: 'PENDING', // hiển thị trạng thái đang gửi (✓ nhạt)
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        senderId: replyingTo.sender.id,
        senderName: replyingTo.sender.name,
        contentPreview: replyingTo.type === 'IMAGE' ? '📷 Ảnh' : replyingTo.type === 'FILE' ? '📎 Tệp đính kèm' : (replyingTo.content?.slice(0, 80) ?? '')
      } : undefined
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
        type: 'TEXT',
        replyToMessageId: replyingTo?.id ?? null
      });
      // Clear reply state sau khi gửi thành công
      setReplyingTo(null);
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
  // Người kia có đang gõ trong cuộc trò chuyện đang mở không (Sprint 4.4)
  const isActivePartnerTyping = activeConversation ? Boolean(typingByConv[activeConversation.id]) : false;

  return (
    <div className="flex bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden h-[calc(100vh-24px)] animate-fade-in-up">

      {/* ========================================================== */}
      {/* CỘT 1: DANH SÁCH CUỘC TRÒ CHUYỆN                           */}
      {/* ========================================================== */}
      <div className={`w-[280px] border-r border-slate-200 flex flex-col h-full bg-white shrink-0 ${activeConversation ? 'hidden md:flex' : ''}`}>
        {/* Header Stories */}
        <div className="px-3 pt-3 pb-2">
          <h3 className="text-xs font-black text-slate-800 mb-2">Stories</h3>
          <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-thin">
            {/* Your story */}
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
              <div className="relative h-12 w-12 rounded-full border-2 border-dashed border-violet-300 flex items-center justify-center bg-violet-50 group-hover:bg-violet-100 transition">
                <Plus className="h-4 w-4 text-violet-500" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Your story</span>
            </div>

            {/* Stories từ partners */}
            {conversations.slice(0, 4).map(conv => {
              const partner = conv.participants.find(p => p.id !== currentUser.id);
              if (!partner) return null;
              const isOnline = onlineUserIds.has(partner.id);
              return (
                <div key={conv.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full p-[2px] bg-gradient-to-tr from-violet-500 to-pink-400">
                      <div className="h-full w-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                        {partner.avatar ? (
                          <img src={partner.avatar} alt={partner.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold text-xs">
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-2 border-white rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium truncate max-w-[48px]">{partner.name.split(' ').pop()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-3 pb-2">
          <div className="relative flex items-center gap-1.5">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search friends or messages"
                className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/70 border border-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white text-xs text-slate-700 transition-all font-medium"
              />
            </div>
            <button
              className="p-1.5 rounded-full bg-slate-100/70 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
              title="Bộ lọc"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setConversationFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${conversationFilter === 'all'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setConversationFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1 ${conversationFilter === 'unread'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Unread
            {totalUnread > 0 && (
              <span className={`text-[9px] font-black px-1.5 rounded-full ${conversationFilter === 'unread' ? 'bg-white text-violet-600' : 'bg-violet-600 text-white'
                }`}>
                {totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setConversationFilter('groups')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${conversationFilter === 'groups'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Groups
          </button>
          <button
            onClick={() => setConversationFilter('requests')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${conversationFilter === 'requests'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Requests
          </button>
        </div>

        {/* List cuộc trò chuyện */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {isLoadingConvs && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">Chưa có cuộc trò chuyện nào</p>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${isSelected
                      ? 'bg-violet-50/60 border border-violet-200/50'
                      : 'border border-transparent'
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-full border border-slate-200/80 overflow-hidden bg-slate-100">
                      {partner.avatar ? (
                        <img src={partner.avatar} alt={partner.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold text-sm bg-slate-50">
                          {partner.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {isPartnerOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-2 border-white rounded-full bg-emerald-500"></span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="flex-grow min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-semibold truncate ${hasUnread ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                        {partner.name}
                        {isPartnerOnline && <span className="inline-block ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                      </h4>
                      {lastMsg && (
                        <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                          {new Date(lastMsg.sentAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate flex-grow pr-2 ${typingByConv[conv.id] ? 'text-violet-600 font-semibold italic' : hasUnread ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
                        {typingByConv[conv.id] ? (
                          'Đang nhập...'
                        ) : lastMsg ? (
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
                        <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-black bg-violet-600 text-white rounded-full shrink-0">
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
        <div className="px-3 py-2.5 border-t border-slate-100">
          <button
            onClick={openNewChatModal}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-full border border-violet-200 text-violet-600 font-bold text-xs hover:bg-violet-50 transition cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Find new friends
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
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between z-10">
              <div className="flex items-center gap-3 flex-grow min-w-0">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft className="h-4 w-4 text-slate-600" />
                </button>
                <div className="relative shrink-0">
                  <div className="h-9 w-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100">
                    {activePartner?.avatar ? (
                      <img src={activePartner.avatar} alt={activePartner.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold text-sm bg-slate-50">
                        {activePartner?.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isActivePartnerOnline && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-2 border-white rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{activePartner?.name}</h4>
                  <span className="text-xs font-medium text-slate-400">
                    {isActivePartnerTyping ? (
                      <span className="text-violet-600 font-semibold">Đang nhập...</span>
                    ) : isActivePartnerOnline ? (
                      <span className="text-emerald-600 font-semibold">Online</span>
                    ) : (
                      'Ngoại tuyến'
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer" title="Tìm kiếm">
                  <Search className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer" title="Gọi thoại">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer" title="Gọi video">
                  <Video className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer" title="Tùy chọn">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Khung chứa các tin nhắn */}
            <div
              ref={chatScrollContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4 flex flex-col bg-slate-50/30"
            >
              {/* Spinner tải tin cũ (Infinite Scroll - Sprint 4.5) */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-2 shrink-0">
                  <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
                </div>
              )}
              {/* Overlay đóng reaction picker / delete menu khi bấm ra ngoài */}
              {(reactionPickerFor || deleteMenuFor) && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => { setReactionPickerFor(null); setDeleteMenuFor(null); }}
                />
              )}
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
                          ref={(el) => { messageRefs.current[m.id] = el; }}
                          className={`flex items-end gap-2.5 max-w-[75%] rounded-2xl transition-all duration-500 ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'} ${highlightedMsgId === m.id ? 'ring-2 ring-violet-400 ring-offset-2 bg-violet-50/40' : ''}`}
                        >
                          {/* Avatar đối phương */}
                          {!isMe && (
                            <div className="h-8 w-8 rounded-full border overflow-hidden bg-slate-100 shrink-0">
                              {activePartner?.avatar ? (
                                <img src={activePartner.avatar} alt="Avatar" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50 text-xs">
                                  {activePartner?.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bong bóng tin nhắn */}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Quote tin được trả lời - đặt PHÍA TRÊN bong bóng, màu trung tính (Sprint 4.4 - Reply) */}
                            {m.replyTo && (
                              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-[-6px] z-0 max-w-full`}>
                                <span className="text-[10px] text-slate-400 font-medium px-2 mb-0.5 flex items-center gap-1">
                                  <CornerDownRight className="h-2.5 w-2.5" />
                                  {isMe ? 'Bạn' : (activePartner?.name?.split(' ').pop() || '')} đã trả lời {m.replyTo.senderId === currentUser.id ? 'chính mình' : m.replyTo.senderName}
                                </span>
                                <div
                                  onClick={() => m.replyTo && jumpToMessage(m.replyTo.messageId)}
                                  className={`px-3 pt-1.5 pb-3 rounded-2xl bg-slate-100 text-slate-500 text-xs max-w-[240px] cursor-pointer hover:bg-slate-200 transition ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}
                                  title="Xem tin nhắn gốc"
                                >
                                  <p className="truncate">{m.replyTo.contentPreview || '(tin nhắn trống)'}</p>
                                </div>
                              </div>
                            )}
                            <div className={`flex items-center gap-1 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div
                                className={`relative z-10 ${m.deleted ? 'px-4 py-2.5 italic opacity-80' : m.type === 'IMAGE' ? 'p-1' : 'px-4 py-2.5'} rounded-2xl text-sm leading-relaxed shadow-sm font-medium ${m.deleted
                                    ? (isMe ? 'bg-violet-300 text-white rounded-br-md' : 'bg-slate-100 text-slate-400 rounded-bl-md border border-slate-200/60')
                                    : isMe
                                      ? 'bg-violet-600 text-white rounded-br-md'
                                      : 'bg-white text-slate-800 rounded-bl-md border border-slate-200/60'
                                  }`}
                              >
                                {m.deleted ? (
                                  <span className="text-xs">Tin nhắn đã được thu hồi</span>
                                ) : m.type === 'IMAGE' ? (
                                  <div className="relative">
                                    <img
                                      src={m.mediaUrl}
                                      alt="Ảnh"
                                      className="rounded-xl max-w-[220px] max-h-[280px] object-cover block cursor-pointer"
                                      onClick={() => m.mediaUrl && window.open(m.mediaUrl, '_blank')}
                                    />
                                    {/* Overlay progress khi đang upload */}
                                    {m.status === 'PENDING' && uploadProgress[m.id] !== undefined && (
                                      <div className="absolute inset-0 rounded-xl bg-black/40 flex flex-col items-center justify-center gap-1.5">
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        <span className="text-white text-[11px] font-bold">{uploadProgress[m.id]}%</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  m.content
                                )}
                                {/* Hiển thị reactions (badge nổi ở góc dưới bong bóng) */}
                                {!m.deleted && m.reactions && Object.keys(m.reactions).length > 0 && (
                                  <div className={`absolute -bottom-2.5 ${isMe ? 'left-1' : 'right-1'} flex items-center bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-sm`}>
                                    {Array.from(new Set(Object.values(m.reactions))).slice(0, 3).map((emo) => (
                                      <span key={emo} className="text-[11px] leading-none">{emo}</span>
                                    ))}
                                    {Object.keys(m.reactions).length > 1 && (
                                      <span className="text-[9px] text-slate-500 font-bold ml-0.5">{Object.keys(m.reactions).length}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Nút thả cảm xúc (hiện khi hover) */}
                              <div className="relative shrink-0 flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(m);
                                    setReactionPickerFor(null);
                                  }}
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  title="Trả lời"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReactionPickerFor(reactionPickerFor === m.id ? null : m.id)}
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  title="Thả cảm xúc"
                                >
                                  <Smile className="h-3.5 w-3.5" />
                                </button>

                                {/* Sửa - chỉ tin TEXT của mình, trong 15 phút (Sprint 4.5) */}
                                {!m.deleted && isMe && m.type === 'TEXT' && within15Min(m.createdAt) && (
                                  <button
                                    type="button"
                                    onClick={() => startEditing(m)}
                                    className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                    title="Chỉnh sửa"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                {/* Xóa - menu me/everyone (Sprint 4.5) */}
                                {!m.deleted && (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteMenuFor(deleteMenuFor === m.id ? null : m.id)}
                                    className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                    title="Xóa"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                {/* Menu xóa */}
                                {deleteMenuFor === m.id && (
                                  <div className={`absolute z-30 bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[170px] animate-fade-in ${isMe ? 'right-0' : 'left-0'}`}>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(m, 'me')}
                                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                      Xóa cho riêng tôi
                                    </button>
                                    {isMe && within15Min(m.createdAt) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(m, 'everyone')}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 cursor-pointer border-t border-slate-100"
                                      >
                                        Thu hồi với mọi người
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Picker popup */}
                                {reactionPickerFor === m.id && (
                                  <div className={`absolute z-20 bottom-full mb-1 flex items-center gap-0.5 bg-white border border-slate-200 rounded-full px-1.5 py-1 shadow-lg animate-fade-in ${isMe ? 'right-0' : 'left-0'}`}>
                                    {REACTION_EMOJIS.map((emo) => {
                                      const active = m.reactions?.[currentUser.id] === emo;
                                      return (
                                        <button
                                          key={emo}
                                          type="button"
                                          onClick={() => handleReact(m.id, emo)}
                                          className={`h-7 w-7 rounded-full flex items-center justify-center text-base hover:scale-125 transition cursor-pointer ${active ? 'bg-violet-100' : 'hover:bg-slate-100'}`}
                                        >
                                          {emo}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Metadata bên dưới bong bóng */}
                            <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${m.reactions && Object.keys(m.reactions).length > 0 ? 'mt-3' : ''}`}>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatTime(m.createdAt)}
                              </span>

                              {/* Nhãn đã chỉnh sửa (Sprint 4.5) */}
                              {m.editedAt && !m.deleted && (
                                <span className="text-[10px] text-slate-400 italic">(đã chỉnh sửa)</span>
                              )}

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
              {/* Typing indicator (Sprint 4.4) */}
              {isActivePartnerTyping && (
                <div className="flex items-end gap-2.5 max-w-[75%] mr-auto">
                  <div className="h-8 w-8 rounded-full border overflow-hidden bg-slate-100 shrink-0">
                    {activePartner?.avatar ? (
                      <img src={activePartner.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50 text-xs">
                        {activePartner?.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="bg-white border border-slate-200/60 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                    </div>
                  </div>
                </div>
              )}
              {/* Element neo scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* Banner "Đang chỉnh sửa" trên Input bar (Sprint 4.5) */}
            {editingMessage && (
              <div className="px-4 py-2 border-t border-slate-200 bg-amber-50/50 flex items-start gap-2">
                <Pencil className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-[11px] font-bold text-amber-600">Đang chỉnh sửa tin nhắn</p>
                  <p className="text-xs text-slate-500 truncate">{editingMessage.content}</p>
                </div>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer shrink-0"
                  title="Hủy chỉnh sửa"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Tray preview ảnh đã chọn (tối đa 4, có nút X) - Sprint 4.4 */}
            {pendingImages.length > 0 && (
              <div className="px-4 pt-3 pb-1 border-t border-slate-200 bg-white flex items-center gap-2 flex-wrap">
                {pendingImages.map((img) => (
                  <div key={img.id} className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={img.url} alt="preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePendingImage(img.id)}
                      className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-rose-500 transition cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {pendingImages.length < 4 && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-violet-400 hover:text-violet-500 transition cursor-pointer"
                    title="Thêm ảnh"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Banner "Replying to" trên Input bar (Sprint 4.4 - Reply) */}
            {replyingTo && (
              <div className="px-4 py-2 border-t border-slate-200 bg-violet-50/40 flex items-start gap-2">
                <CornerDownRight className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-[11px] font-bold text-violet-600">
                    Đang trả lời {replyingTo.sender.id === currentUser.id ? 'chính bạn' : replyingTo.sender.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {replyingTo.type === 'IMAGE' ? '📷 Ảnh' : replyingTo.type === 'FILE' ? '📎 Tệp đính kèm' : replyingTo.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer shrink-0"
                  title="Hủy trả lời"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input bar */}
            <form
              onSubmit={handleSendMessage}
              className="px-3 py-2.5 border-t border-slate-200 bg-white flex items-center gap-2 z-10"
            >
              <div className="flex items-center gap-0.5 shrink-0">
                <button type="button" className="h-8 w-8 rounded-full flex items-center justify-center text-violet-500 hover:bg-violet-50 transition cursor-pointer" title="Thêm">
                  <Plus className="h-4.5 w-4.5" />
                </button>
                <button type="button" className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition cursor-pointer" title="Emoji">
                  <Smile className="h-4.5 w-4.5" />
                </button>
                <button type="button" onClick={() => imageInputRef.current?.click()} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-violet-600 transition cursor-pointer" title="Gửi ảnh">
                  <ImageIcon className="h-4.5 w-4.5" />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleSelectImages}
                  title="Chọn ảnh tải lên"
                  aria-label="Chọn ảnh tải lên"
                />
                <button type="button" className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition cursor-pointer" title="Mic">
                  <Mic className="h-4.5 w-4.5" />
                </button>
              </div>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  if (e.target.value.trim()) {
                    emitTyping();
                  } else {
                    emitStopTyping();
                  }
                }}
                placeholder={`Message ${activePartner?.name || ''}...`}
                className="flex-grow px-4 py-2 rounded-full bg-slate-100/70 border border-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white text-sm text-slate-700 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={(!messageInput.trim() && pendingImages.length === 0) || isSending}
                className="h-9 w-9 bg-violet-600 text-white rounded-full hover:bg-violet-500 disabled:opacity-50 transition shrink-0 cursor-pointer flex items-center justify-center shadow-sm"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
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

      {/* ========================================================== */}
      {/* CỘT 3: PROFILE PANEL (chỉ hiện khi có active conversation) */}
      {/* ========================================================== */}
      {activeConversation && activePartner && (
        <div className="w-[260px] border-l border-slate-200 flex flex-col h-full bg-white shrink-0 overflow-y-auto hidden xl:flex">
          {/* Profile Header */}
          <div className="flex flex-col items-center pt-8 pb-5 px-5">
            {/* Avatar lớn */}
            <div className="relative mb-4">
              <div className="h-24 w-24 rounded-full border-3 border-slate-200 overflow-hidden bg-slate-100 shadow-md">
                {activePartner.avatar ? (
                  <img src={activePartner.avatar} alt={activePartner.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-3xl bg-gradient-to-br from-violet-50 to-slate-50">
                    {activePartner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isActivePartnerOnline && (
                <span className="absolute bottom-1 right-1 h-5 w-5 border-3 border-white rounded-full bg-emerald-500"></span>
              )}
            </div>

            {/* Tên + star */}
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-base font-black text-slate-800">{activePartner.name}</h3>
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>

            {/* Bio / Role placeholder */}
            <p className="text-xs text-slate-500 font-medium">UX Designer at Hizo</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <span>📍</span> Ho Chi Minh City, Vietnam
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-6 mt-5">
              <button className="flex flex-col items-center gap-1.5 group cursor-pointer" title="Xem Profile">
                <div className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-violet-50 group-hover:border-violet-300 transition">
                  <User className="h-4.5 w-4.5 text-slate-500 group-hover:text-violet-600" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-violet-600">Profile</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 group cursor-pointer" title="Tắt thông báo">
                <div className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-violet-50 group-hover:border-violet-300 transition">
                  <BellOff className="h-4.5 w-4.5 text-slate-500 group-hover:text-violet-600" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-violet-600">Mute</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 group cursor-pointer" title="Thêm tùy chọn">
                <div className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-violet-50 group-hover:border-violet-300 transition">
                  <MoreHorizontal className="h-4.5 w-4.5 text-slate-500 group-hover:text-violet-600" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-violet-600">More</span>
              </button>
            </div>
          </div>

          {/* Shared Media */}
          <div className="px-5 pt-4 pb-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-700">Shared media</h4>
              <button className="text-[11px] font-bold text-violet-600 hover:text-violet-700 cursor-pointer">See all</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden cursor-pointer hover:opacity-80 transition">
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Files */}
          <div className="px-5 pt-3 pb-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-700">Shared files</h4>
              <button className="text-[11px] font-bold text-violet-600 hover:text-violet-700 cursor-pointer">See all</button>
            </div>
            <div className="space-y-2.5">
              {[
                { name: 'Hizo_Project_Proposal.pdf', size: '2.4 MB', type: 'PDF' },
                { name: 'Design_System_Update.fig', size: '18.6 MB', type: 'Figma' },
                { name: 'Timeline_Project_Hizo.xlsx', size: '24.1 KB', type: 'Excel' },
              ].map((file, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition group">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${file.type === 'PDF' ? 'bg-rose-50 text-rose-500' :
                      file.type === 'Figma' ? 'bg-purple-50 text-purple-500' :
                        'bg-emerald-50 text-emerald-500'
                    }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className="text-[11px] font-bold text-slate-700 truncate group-hover:text-violet-600 transition">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{file.size} • {file.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mutual Friends */}
          <div className="px-5 pt-3 pb-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-700">Mutual friends</h4>
              <button className="text-[11px] font-bold text-violet-600 hover:text-violet-700 cursor-pointer">See all</button>
            </div>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full border-2 border-white overflow-hidden bg-slate-100 -ml-2 first:ml-0 cursor-pointer hover:z-10 hover:scale-110 transition shadow-sm"
                >
                  <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-[10px] bg-gradient-to-br from-violet-50 to-slate-100">
                    {String.fromCharCode(65 + i)}
                  </div>
                </div>
              ))}
              <div className="h-9 w-9 rounded-full border-2 border-white bg-violet-50 -ml-2 flex items-center justify-center cursor-pointer hover:bg-violet-100 transition shadow-sm">
                <span className="text-[10px] font-black text-violet-600">+12</span>
              </div>
            </div>
          </div>
        </div>
      )}

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



