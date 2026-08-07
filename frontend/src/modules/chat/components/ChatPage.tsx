import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import axios from 'axios';
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
  Smile,
  Image as ImageIcon,
  Mic,
  ThumbsUp,
  UserPlus,
  User,
  BellOff,
  FileText,
  Star,
  Reply,
  CornerDownRight,
  Pencil,
  Trash2,
  Info,
  Sparkles,
  ListChecks,
  HeartPulse
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { presenceService } from '../services/presenceService';
import { friendService } from '../../friends/services/friendService';
import { webSocketService } from '../services/webSocketService';
import { profileService } from '../../profile/services/profileService';
import type { UserProfileResponse } from '../../profile/services/profileService';
import type { FriendSuggestionResponse } from '../../friends/types/friend.types';
import type {
  ConversationResponse,
  MessageResponse,
  MessageStatusEvent,
  TypingEvent,
  MessageReactionEvent,
  MessageUpdateEvent,
  AiInsightResponse,
  AiInsightTask
} from '../types/chat.types';
import { useAuth } from '../../../core/auth/AuthContext';
import { useToast } from '../../../core/toast/ToastContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCall } from '../context/CallContext';
import { postService } from '../../post/services/postService';
import type { PostResponse } from '../../post/types/post.types';
import PostDetailModal from '../../post/components/PostDetailModal';
import { useReactionLongPress } from '../../../core/hooks/useReactionLongPress';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤔','🫣','🤭','🫢','🫡','🤫','🫠','🤥','😶','😐','😑','😬','😴','🤢','🤮','🤧','🥴','😵','🤠','🥳','🥸'
    ]
  },
  {
    name: 'Hands',
    icon: '👍',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🫶','🤲','🤝','🙏','💪','🦾','✍️','💅','🤳','🧠'
    ]
  },
  {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💤','💢','💥','💫','✨'
    ]
  },
  {
    name: 'Food/Fun',
    icon: '🍔',
    emojis: [
      '☕','🍺','🍻','🍷','🍹','🥤','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🍿','🎂','🍰','🧁','🍬','🍫','🍩','🍪','🍓','🍎','🍉','🍌','🥑','⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🎮','🕹️','🎲','🎨','🎬','🎤','🎧'
    ]
  }
];

interface ChatPageProps {
  currentUser?: { id: string; email: string; name?: string; avatar?: string } | null;
  triggerToast?: (msg: string) => void;
  initialRecipientId?: string | null;
  onClearInitialRecipient?: () => void;
}

// Bộ cảm xúc cho tin nhắn (Sprint 4.4 - Message Reactions). Phải khớp ALLOWED_EMOJIS ở backend.
const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

interface MessageReactionButtonProps {
  message: MessageResponse;
  currentUserId: string;
  isMe: boolean;
  isPickerOpen: boolean;
  onPickerChange: (messageId: string | null) => void;
  onReact: (messageId: string, emoji: string) => void;
}

function MessageReactionButton({
  message,
  currentUserId,
  isMe,
  isPickerOpen,
  onPickerChange,
  onReact,
}: MessageReactionButtonProps) {
  const reactionLongPressHandlers = useReactionLongPress({
    onTap: () => onReact(message.id, '👍'),
    onLongPress: () => onPickerChange(message.id),
    onMouseClick: () => onPickerChange(isPickerOpen ? null : message.id),
  });

  return (
    <>
      <button
        type="button"
        {...reactionLongPressHandlers}
        className="h-11 w-11 md:h-6 md:w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-violet-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition cursor-pointer"
        title="Thả cảm xúc"
        aria-label="Thả thích tin nhắn. Nhấn giữ để chọn cảm xúc"
      >
        <Smile className="h-5 w-5 md:h-3.5 md:w-3.5" />
      </button>

      {isPickerOpen && (
        <div className={`absolute z-20 bottom-full mb-1 flex items-center gap-0.5 bg-white border border-slate-200 rounded-full px-1.5 py-1 shadow-lg animate-fade-in ${isMe ? 'right-0' : 'left-0'}`}>
          {REACTION_EMOJIS.map((emoji) => {
            const active = message.reactions?.[currentUserId] === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className={`h-7 w-7 rounded-full flex items-center justify-center text-base hover:scale-125 transition cursor-pointer ${active ? 'bg-violet-100' : 'hover:bg-slate-100'}`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ChatPage({
  currentUser: propCurrentUser,
  triggerToast: propTriggerToast,
  initialRecipientId: propInitialRecipientId,
  onClearInitialRecipient: propOnClearInitialRecipient
}: ChatPageProps) {
  const { user: contextUser } = useAuth();
  const { triggerToast: contextTriggerToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = (propCurrentUser || contextUser) as { id: string; email: string; name?: string; avatar?: string };
  const triggerToast = propTriggerToast || contextTriggerToast;
  const { recipientId: paramRecipientId } = useParams<{ recipientId?: string }>();
  
  // Lấy initialRecipientId từ url param, prop hoặc từ location state
  const initialRecipientId = paramRecipientId || propInitialRecipientId || location.state?.recipientId || null;
  
  const onClearInitialRecipient = propOnClearInitialRecipient || (() => {
    // Clear state trong location nếu có để tránh lặp lại
    if (location.state?.recipientId) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  });

  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<String>>(new Set());

  // Lấy thông tin partner của cuộc trò chuyện hiện tại
  const activePartner = activeConversation?.participants.find(p => p.id !== currentUser?.id);
  const [showProfilePanel, setShowProfilePanel] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  // Typing indicator: map conversationId -> tên người đang gõ (Sprint 4.4)
  const [typingByConv, setTypingByConv] = useState<Record<string, string>>({});

  // Message Reactions: messageId đang mở picker cảm xúc (Sprint 4.4)
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const messageLongPressTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const messageLongPressIdRef = useRef<string | null>(null);
  const messageLongPressTriggeredRef = useRef(false);

  // Reply to Message: tin nhắn đang được chuẩn bị trả lời (Sprint 4.4)
  const [replyingTo, setReplyingTo] = useState<MessageResponse | null>(null);

  // Sprint 4.5: tin nhắn đang sửa + menu xóa đang mở
  const [editingMessage, setEditingMessage] = useState<MessageResponse | null>(null);
  const [deleteMenuFor, setDeleteMenuFor] = useState<string | null>(null);

  // Loading states
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [hasLoadedConvs, setHasLoadedConvs] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Input states
  const [searchText, setSearchText] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Emoji Picker states and ref
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);


  // Click outside to close Emoji Picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter cho danh sách hội thoại (All / Unread / Groups / Requests)
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'groups' | 'requests'>('all');

  // New chat modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendSearchText, setFriendSearchText] = useState('');

  // States cho Profile Panel bên phải (Cột 3)
  const [partnerProfile, setPartnerProfile] = useState<UserProfileResponse | null>(null);
  const [suggestedFriends, setSuggestedFriends] = useState<FriendSuggestionResponse[]>([]);
  const [showAllMediaModal, setShowAllMediaModal] = useState(false);
  const [showAllFilesModal, setShowAllFilesModal] = useState(false);
  const [showAllSuggestionsModal, setShowAllSuggestionsModal] = useState(false);
  const [sharedPostDetail, setSharedPostDetail] = useState<PostResponse | null>(null);
  const [openingSharedPostId, setOpeningSharedPostId] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [isGeneratingAiInsight, setIsGeneratingAiInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<AiInsightResponse | null>(null);

  // Refs for tracking closures and scrolling
  // Refs for tracking closures and scrolling
  const activeConversationRef = useRef<ConversationResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isCreatingRef = useRef(false);

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

  const { startCall } = useCall();

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

  const handleComposerFocus = () => {
    setShowEmojiPicker(false);
    // Let the browser resize its visual viewport before keeping the composer and latest message visible.
    window.requestAnimationFrame(() => scrollToBottom('auto'));
  };

  // 1. Tải danh sách cuộc hội thoại
  const loadConversations = useCallback(async (selectId?: string) => {
    setIsLoadingConvs(true);
    try {
      const data = await chatService.getConversations(0, 100);
      setConversations(data.content);
      setHasLoadedConvs(true);

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

  // 3. Đồng bộ URL parameter (initialRecipientId) sang activeConversation hoặc tạo mới nếu chưa tồn tại
  useEffect(() => {
    if (!initialRecipientId || !hasLoadedConvs) {
      return;
    }

    const found = conversations.find((c) =>
      c.participants.some((p) => p.id === initialRecipientId)
    );

    if (found) {
      if (activeConversation?.id !== found.id) {
        setActiveConversation(found);
      }
      if (onClearInitialRecipient) onClearInitialRecipient();
    } else {
      // Nếu chưa có hội thoại trong list hiện tại, tiến hành tạo mới/lấy từ DB
      if (!isCreatingRef.current) {
        isCreatingRef.current = true;
        const startChatWithFriend = async () => {
          try {
            const newConv = await chatService.createConversation(initialRecipientId);
            await loadConversations(newConv.id);
          } catch {
            triggerToast('Không thể mở cuộc trò chuyện với người bạn này.');
            navigate('/chats');
          } finally {
            isCreatingRef.current = false;
            if (onClearInitialRecipient) onClearInitialRecipient();
          }
        };
        startChatWithFriend();
      }
    }
  }, [initialRecipientId, hasLoadedConvs, conversations, activeConversation, loadConversations, triggerToast, navigate, onClearInitialRecipient]);

  // 4. Đăng ký các kênh WebSocket để nhận tin nhắn và status realtime
  useEffect(() => {
    if (!currentUser) return;

    // Đăng ký nhận tin nhắn mới
    const unsubscribeMessages = webSocketService.subscribe<{ type: string; data: MessageResponse }>(
      '/user/queue/messages',
      (payload) => {
        if (payload.type === 'NEW_MESSAGE') {
          const newMsg = payload.data;
          let isNewConversation = false;

          // Cập nhật danh sách conversation
          setConversations((prev) => {
            if (!prev.some((conversation) => conversation.id === newMsg.conversationId)) {
              isNewConversation = true;
              return prev;
            }
            const updated = prev.map((c) => {
              if (c.id === newMsg.conversationId) {
                return {
                  ...c,
                  lastMessage: {
                    senderId: newMsg.sender.id,
                    contentPreview: newMsg.type === 'TEXT'
                      ? (newMsg.content || '')
                      : newMsg.type === 'IMAGE'
                        ? '📷 Đã gửi một ảnh'
                        : newMsg.type === 'FILE'
                          ? '📎 Đã gửi một file'
                          : 'Đã chia sẻ một bài viết',
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

          if (isNewConversation) {
            void loadConversations();
          }

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

  // Tải thông tin Profile chi tiết và Gợi ý kết bạn khi mở hội thoại mới
  useEffect(() => {
    if (!activePartner) {
      setPartnerProfile(null);
      setSuggestedFriends([]);
      return;
    }

    // Tải profile chi tiết của partner
    profileService.getProfileById(activePartner.id)
      .then((res) => {
        setPartnerProfile(res.data);
      })
      .catch(() => {
        setPartnerProfile(null);
      });

    // Tải danh sách gợi ý bạn bè
    friendService.getSuggestions(10)
      .then((list) => {
        setSuggestedFriends(list);
      })
      .catch(() => {
        setSuggestedFriends([]);
      });
  }, [activePartner]);

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

  const startMessageLongPress = (messageId: string, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || !event.isPrimary) return;
    event.preventDefault();
    if (messageLongPressTimerRef.current) window.clearTimeout(messageLongPressTimerRef.current);
    messageLongPressIdRef.current = messageId;
    messageLongPressTriggeredRef.current = false;
    messageLongPressTimerRef.current = window.setTimeout(() => {
      messageLongPressTimerRef.current = null;
      messageLongPressTriggeredRef.current = true;
      setReactionPickerFor(messageId);
    }, 450);
  };

  const finishMessageLongPress = (messageId: string, event: React.PointerEvent<HTMLDivElement>) => {
    if (messageLongPressIdRef.current !== messageId) return;
    if (messageLongPressTimerRef.current) window.clearTimeout(messageLongPressTimerRef.current);
    messageLongPressTimerRef.current = null;
    messageLongPressIdRef.current = null;
    if (!messageLongPressTriggeredRef.current && event.target instanceof HTMLElement && !event.target.closest('img, button, a')) {
      handleReact(messageId, '👍');
    }
    if (messageLongPressTriggeredRef.current) {
      window.setTimeout(() => { messageLongPressTriggeredRef.current = false; }, 0);
    }
  };

  const cancelMessageLongPress = () => {
    if (messageLongPressTimerRef.current) window.clearTimeout(messageLongPressTimerRef.current);
    messageLongPressTimerRef.current = null;
    messageLongPressIdRef.current = null;
  };

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
      sender: { id: currentUser.id, name: currentUser.name || 'Tôi', avatar: currentUser.avatar },
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
    setMessageInput(m.content ?? '');
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setMessageInput('');
  };

  const openSharedPost = async (postId: string) => {
    setOpeningSharedPostId(postId);
    try {
      const response = await postService.getPost(postId);
      setSharedPostDetail(response.data);
    } catch {
      triggerToast('Không tìm thấy bài viết này.');
    } finally {
      setOpeningSharedPostId(null);
    }
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

  const handleAiInsight = async (task: AiInsightTask) => {
    if (!activeConversation || isGeneratingAiInsight) return;

    setIsGeneratingAiInsight(true);
    setAiInsight(null);
    try {
      const insight = await chatService.generateAiInsight(activeConversation.id, task);
      setAiInsight(insight);
    } catch (error) {
      const message = axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : 'Không thể tạo phân tích AI, vui lòng thử lại sau.';
      triggerToast(message);
    } finally {
      setIsGeneratingAiInsight(false);
    }
  };

  // 6. Gửi tin nhắn mới (Optimistic UI)
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    if (!activeConversation) return;

    // Nếu đang sửa tin nhắn → lưu chỉnh sửa thay vì gửi mới (Sprint 4.5)
    if (editingMessage) {
      await handleSaveEdit();
      return;
    }

    // Dừng phát typing ngay khi gửi tin
    emitStopTyping();

    const textToUse = customContent !== undefined ? customContent : messageInput;
    const hasText = textToUse.trim().length > 0;
    const hasImages = pendingImages.length > 0;
    if (!hasText && !hasImages) return;

    // Gửi ảnh trong tray trước (nếu có) kèm theo chữ làm Caption
    if (hasImages) {
      const contentToSend = textToUse.trim();
      if (customContent === undefined) setMessageInput('');
      await flushPendingImages(contentToSend);
      return; // Xong luôn, không gửi thêm tin TEXT riêng biệt nữa!
    }

    const contentToSend = textToUse.trim();
    if (customContent === undefined) setMessageInput('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: MessageResponse = {
      id: tempId,
      conversationId: activeConversation.id,
      sender: {
        id: currentUser.id,
        name: currentUser.name || 'Tôi',
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
        contentPreview: replyingTo.type === 'IMAGE'
          ? '📷 Ảnh'
          : replyingTo.type === 'FILE'
            ? '📎 Tệp đính kèm'
            : replyingTo.type === 'POST'
              ? 'Đã chia sẻ một bài viết'
              : (replyingTo.content?.slice(0, 80) ?? '')
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
      const sent = webSocketService.send('/app/chat.send', {
        conversationId: activeConversation.id,
        content: contentToSend,
        type: 'TEXT',
        replyToMessageId: replyingTo?.id ?? null
      });
      if (!sent) {
        throw new Error('WebSocket is disconnected');
      }
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
      navigate(`/chats/${friendId}`);
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
    const searchLower = searchText.toLowerCase();
    const matchName = partner?.name.toLowerCase().includes(searchLower);
    const matchLastMsg = c.lastMessage?.contentPreview?.toLowerCase().includes(searchLower);
    const matchSearch = matchName || matchLastMsg;
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

  const isActivePartnerOnline = activePartner ? onlineUserIds.has(activePartner.id) : false;
  // Người kia có đang gõ trong cuộc trò chuyện đang mở không (Sprint 4.4)
  const isActivePartnerTyping = activeConversation ? Boolean(typingByConv[activeConversation.id]) : false;

  // Lọc danh sách ảnh & tệp đã chia sẻ từ tin nhắn hiện có (không ảo)
  const sharedImages = messages.filter(m => !m.deleted && m.type === 'IMAGE' && m.mediaUrl);
  const sharedFiles = messages.filter(m => !m.deleted && m.type === 'FILE' && m.mediaUrl);

  const getFileDetails = (url: string) => {
    const name = url.substring(url.lastIndexOf('/') + 1) || 'File';
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
    return { name, ext };
  };

  if (!currentUser) {
    return (
      <div className="flex bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden h-full items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-white animate-fade-in-up md:rounded-xl md:border md:border-slate-200/80 md:shadow-sm">

      {/* ========================================================== */}
      {/* CỘT 1: DANH SÁCH CUỘC TRÒ CHUYỆN                           */}
      {/* ========================================================== */}
      <div
        data-testid="chat-list"
        className={`w-full border-r border-slate-200 flex flex-col h-full bg-white shrink-0 md:w-[280px] ${activeConversation ? 'hidden md:flex' : ''}`}
      >
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
                className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/70 border border-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white text-[16px] sm:text-xs text-slate-700 transition-all font-medium"
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
        <div data-testid="chat-list-scroll" className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-1 space-y-0.5">
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
                  onClick={() => navigate(`/chats/${partner.id}`)}
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
        <div className="shrink-0 px-3 py-2.5 border-t border-slate-100">
          <button
            onClick={openNewChatModal}
            className="min-h-11 w-full flex items-center justify-center gap-1.5 px-3 rounded-full border border-violet-200 text-violet-600 font-bold text-xs hover:bg-violet-50 transition cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Find new friends
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* CỘT 2: CHI TIẾT KHUNG CHAT                                 */}
      {/* ========================================================== */}
      <div
        data-testid="chat-thread"
        className={`flex-1 flex flex-col h-full bg-white relative min-w-0 ${!activeConversation ? 'hidden md:flex' : ''}`}
      >
        {activeConversation ? (
          <>
            {/* Header chat */}
            <div className="relative px-2 sm:px-4 py-1.5 sm:py-2.5 border-b border-slate-200 bg-white flex items-center justify-between z-10">
              <div className="flex items-center gap-3 flex-grow min-w-0">
                <button
                  onClick={() => {
                    setActiveConversation(null);
                    navigate('/chats');
                  }}
                  className="md:hidden h-11 w-11 flex items-center justify-center hover:bg-slate-100 rounded-full transition cursor-pointer shrink-0"
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div 
                  onClick={() => activePartner && navigate(`/profile/${activePartner.id}`)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer group/header"
                >
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100 group-hover/header:border-violet-300 transition">
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
                    <h4 className="text-sm font-bold text-slate-800 truncate group-hover/header:text-violet-600 transition-colors">{activePartner?.name}</h4>
                    <span className="text-xs font-medium text-slate-400">
                      {isActivePartnerTyping ? (
                        <span data-testid="typing-status" className="text-violet-600 font-semibold">
                          Đang nhập...
                        </span>
                      ) : isActivePartnerOnline ? (
                        <span className="text-emerald-600 font-semibold">Online</span>
                      ) : (
                        'Ngoại tuyến'
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAiPanel((open) => !open);
                    setAiInsight(null);
                  }}
                  aria-label="Mở trợ lý AI"
                  aria-expanded={showAiPanel}
                  className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition cursor-pointer ${
                    showAiPanel
                      ? 'text-violet-600 bg-violet-50 hover:bg-violet-100'
                      : 'text-slate-500 hover:bg-violet-50 hover:text-violet-600'
                  }`}
                  title="Trợ lý AI"
                >
                  <Sparkles className="h-4.5 w-4.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => activePartner && startCall(activePartner.id, activePartner.name, false, activePartner.avatar, activeConversation?.id)}
                  aria-label="Gọi thoại"
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition cursor-pointer"
                  title="Gọi thoại"
                >
                  <Phone className="h-4.5 w-4.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => activePartner && startCall(activePartner.id, activePartner.name, true, activePartner.avatar, activeConversation?.id)}
                  aria-label="Gọi video"
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition cursor-pointer"
                  title="Gọi video"
                >
                  <Video className="h-4.5 w-4.5" />
                </button>

                <button 
                  type="button"
                  onClick={() => setShowProfilePanel(!showProfilePanel)}
                  aria-label={showProfilePanel ? 'Ẩn thông tin hội thoại' : 'Hiện thông tin hội thoại'}
                  className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition cursor-pointer ${
                    showProfilePanel 
                      ? 'text-violet-600 bg-violet-50 hover:bg-violet-100' 
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`} 
                  title={showProfilePanel ? "Ẩn thông tin" : "Hiện thông tin"}
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              {showAiPanel && (
                <>
                  <button
                    type="button"
                    aria-label="Đóng trợ lý AI"
                    onClick={() => setShowAiPanel(false)}
                    className="fixed inset-0 z-30 sm:hidden"
                  />
                  <section className="absolute right-2 top-full z-40 mt-2 w-[min(22rem,calc(100vw-1rem))] rounded-2xl border border-violet-100 bg-white p-3 shadow-2xl animate-fade-in max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:mt-0 max-sm:w-auto max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:px-5 max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                          <Sparkles className="h-4 w-4 text-violet-500" /> Trợ lý AI
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
                          Chỉ phân tích tối đa 50 tin nhắn text mới nhất.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAiPanel(false)}
                        className="h-9 w-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Đóng"
                      >
                        <X className="mx-auto h-4 w-4" />
                      </button>
                    </div>

                    {!aiInsight && !isGeneratingAiInsight && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => void handleAiInsight('UNREAD_SUMMARY')}
                          className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-violet-300 hover:bg-violet-50"
                        >
                          <ListChecks className="h-5 w-5 shrink-0 text-violet-600" />
                          <span><span className="block text-xs font-bold text-slate-800">Tóm tắt tin chưa đọc</span><span className="block text-[11px] text-slate-500">Các ý chính bạn đã bỏ lỡ</span></span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAiInsight('EMOTION_ANALYSIS')}
                          className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-pink-300 hover:bg-pink-50"
                        >
                          <HeartPulse className="h-5 w-5 shrink-0 text-pink-500" />
                          <span><span className="block text-xs font-bold text-slate-800">Phân tích cảm xúc</span><span className="block text-[11px] text-slate-500">Sắc thái chung của đoạn chat</span></span>
                        </button>
                      </div>
                    )}

                    {isGeneratingAiInsight && (
                      <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        <p className="text-xs font-semibold text-slate-600">AI đang phân tích tin nhắn...</p>
                      </div>
                    )}

                    {aiInsight && (
                      <div>
                        <div className="rounded-xl bg-violet-50 p-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                          {aiInsight.insight}
                        </div>
                        <p className="mt-2 text-[11px] font-medium text-slate-400">
                          Phân tích {aiInsight.sourceMessageCount} tin nhắn. Còn {aiInsight.remainingDailyUses}/10 lượt hôm nay.
                        </p>
                        <button
                          type="button"
                          onClick={() => setAiInsight(null)}
                          className="mt-3 min-h-10 w-full rounded-xl bg-violet-600 px-3 text-xs font-bold text-white hover:bg-violet-700"
                        >
                          Chọn tác vụ khác
                        </button>
                      </div>
                    )}
                  </section>
                </>
              )}
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
                          className={`flex items-end gap-2 max-w-[86%] rounded-2xl transition-all duration-500 sm:gap-2.5 md:max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'} ${highlightedMsgId === m.id ? 'ring-2 ring-violet-400 ring-offset-2 bg-violet-50/40' : ''}`}
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
                            <div
                              data-reaction-press
                              onPointerDown={(event) => startMessageLongPress(m.id, event)}
                              onPointerUp={(event) => finishMessageLongPress(m.id, event)}
                              onPointerCancel={cancelMessageLongPress}
                              onPointerLeave={cancelMessageLongPress}
                              onContextMenu={(event) => event.preventDefault()}
                              onClickCapture={(event) => {
                                if (messageLongPressTriggeredRef.current) {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  messageLongPressTriggeredRef.current = false;
                                }
                              }}
                              className={`flex items-center gap-1 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            >
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
                                      onClick={() => m.mediaUrl && setPreviewImageUrl(m.mediaUrl)}
                                    />
                                    {/* Overlay progress khi đang upload */}
                                    {m.status === 'PENDING' && uploadProgress[m.id] !== undefined && (
                                      <div className="absolute inset-0 rounded-xl bg-black/40 flex flex-col items-center justify-center gap-1.5">
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        <span className="text-white text-[11px] font-bold">{uploadProgress[m.id]}%</span>
                                      </div>
                                    )}
                                  </div>
                                ) : m.type === 'POST' && m.sharedPost ? (
                                  <button
                                    type="button"
                                    onClick={() => void openSharedPost(m.sharedPost!.postId)}
                                    disabled={openingSharedPostId === m.sharedPost.postId}
                                    className="w-60 overflow-hidden rounded-xl border border-slate-200 bg-white text-left text-slate-800 transition hover:border-violet-300 hover:shadow-sm disabled:cursor-wait"
                                    aria-label="Mở bài viết được chia sẻ"
                                  >
                                    {m.sharedPost.imageUrl && (
                                      <img src={m.sharedPost.imageUrl} alt="" className="h-28 w-full object-cover" />
                                    )}
                                    <div className="p-3">
                                      <div className="mb-2 flex items-center gap-2">
                                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-100">
                                          {m.sharedPost.authorAvatar ? (
                                            <img src={m.sharedPost.authorAvatar} alt="" className="h-full w-full object-cover" />
                                          ) : (
                                            <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">{m.sharedPost.authorName.charAt(0).toUpperCase()}</span>
                                          )}
                                        </div>
                                        <span className="truncate text-xs font-bold">{m.sharedPost.authorName}</span>
                                      </div>
                                      <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{m.sharedPost.contentPreview || 'Bài viết có ảnh được chia sẻ'}</p>
                                      <span className="mt-2 block text-[10px] font-bold text-violet-600">{openingSharedPostId === m.sharedPost.postId ? 'Đang mở...' : 'Bài viết được chia sẻ'}</span>
                                    </div>
                                  </button>
                                ) : m.type === 'POST' ? (
                                  <span className="text-xs text-slate-500">Bài viết được chia sẻ không còn khả dụng</span>
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
                                  className="h-11 w-11 md:h-6 md:w-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-violet-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition cursor-pointer"
                                  title="Trả lời"
                                >
                                  <Reply className="h-5 w-5 md:h-3.5 md:w-3.5" />
                                </button>
                                <MessageReactionButton
                                  message={m}
                                  currentUserId={currentUser.id}
                                  isMe={isMe}
                                  isPickerOpen={reactionPickerFor === m.id}
                                  onPickerChange={setReactionPickerFor}
                                  onReact={handleReact}
                                />

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
                                      setMessageInput(m.content ?? '');
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
                <div
                  data-testid="typing-indicator"
                  className="flex items-end gap-2.5 max-w-[75%] mr-auto"
                >
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
                    {replyingTo.type === 'IMAGE' ? '📷 Ảnh' : replyingTo.type === 'FILE' ? '📎 Tệp đính kèm' : replyingTo.type === 'POST' ? 'Đã chia sẻ một bài viết' : replyingTo.content}
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
              className="px-2 sm:px-3 py-1.5 sm:py-2.5 border-t border-slate-200 bg-white flex items-center gap-1.5 sm:gap-2 z-10 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
            >
              {/* Messenger Left Toolbar */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button 
                  type="button" 
                  onClick={() => triggerToast("Tính năng đính kèm tệp đang được phát triển!")}
                  className="hidden sm:flex h-11 w-11 rounded-full items-center justify-center text-violet-500 hover:bg-violet-50 transition cursor-pointer"
                  title="Thêm"
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>

                <button 
                  type="button" 
                  onClick={() => imageInputRef.current?.click()} 
                  className="h-12 w-12 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-violet-600 transition cursor-pointer"
                  title="Chọn ảnh tải lên"
                >
                  <ImageIcon className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
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
                <button 
                  type="button" 
                  onClick={() => triggerToast("Tính năng ghi âm giọng nói đang được phát triển!")}
                  className="hidden sm:flex h-11 w-11 rounded-full items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-violet-600 transition cursor-pointer"
                  title="Gửi tin nhắn thoại"
                >
                  <Mic className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Text Input Wrapper (with inline Emoji button & Picker popup) */}
              <div className="flex-grow relative flex items-center" ref={emojiPickerRef}>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-3 w-[min(18rem,calc(100vw-1.5rem))] bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {/* Header: Tabs */}
                    <div className="flex items-center justify-around border-b border-slate-100 bg-slate-50/50 p-2">
                      {EMOJI_CATEGORIES.map((cat, idx) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setActiveEmojiCategory(idx)}
                          className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg transition cursor-pointer ${
                            activeEmojiCategory === idx ? 'bg-white shadow-sm scale-110' : 'hover:bg-slate-100 opacity-60 hover:opacity-100'
                          }`}
                          title={cat.name}
                        >
                          {cat.icon}
                        </button>
                      ))}
                    </div>

                    {/* Emoji Grid */}
                    <div className="p-3 h-52 overflow-y-auto scrollbar-thin grid grid-cols-6 gap-2 justify-items-center">
                      {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setMessageInput((prev) => prev + emoji)}
                          className="h-11 w-11 text-xl flex items-center justify-center hover:bg-slate-100 rounded-xl transition active:scale-90 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    
                    {/* Footer */}
                    <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-bold text-center">
                      {EMOJI_CATEGORIES[activeEmojiCategory].name}
                    </div>
                  </div>
                )}

                <input
                  data-testid="chat-composer-input"
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
                  placeholder="Aa"
                  inputMode="text"
                  enterKeyHint="send"
                  autoComplete="off"
                  onFocus={handleComposerFocus}
                  className="w-full min-h-12 pl-4 pr-14 py-2 rounded-full bg-slate-100/70 border border-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white text-[16px] sm:min-h-11 sm:pr-11 sm:text-sm text-slate-700 transition-all font-medium"
                />
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`absolute right-1 h-12 w-12 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition cursor-pointer ${
                    showEmojiPicker ? 'text-violet-600 bg-violet-100' : 'text-slate-400 hover:bg-slate-200/50 hover:text-violet-600'
                  }`}
                  title="Biểu tượng cảm xúc"
                >
                  <Smile className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
                </button>
              </div>

              {/* Right Action Button (Send or Quick Like) */}
              {(!messageInput.trim() && pendingImages.length === 0) ? (
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, "👍")}
                  className="h-12 w-12 sm:h-11 sm:w-11 text-violet-600 rounded-full hover:bg-slate-100 transition shrink-0 cursor-pointer flex items-center justify-center"
                  title="Gửi nút Like nhanh"
                >
                  <ThumbsUp className="h-6 w-6 sm:h-5 sm:w-5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSending}
                  className="h-12 w-12 sm:h-11 sm:w-11 bg-violet-600 text-white rounded-full hover:bg-violet-500 transition shrink-0 cursor-pointer flex items-center justify-center shadow-sm"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 sm:h-4 sm:w-4" />
                  )}
                </button>
              )}
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
        <div 
          className={`border-l border-slate-200 flex-col bg-white shrink-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out z-40 fixed inset-x-0 bottom-0 top-[calc(var(--app-header-height)+env(safe-area-inset-top))] h-auto shadow-2xl lg:relative lg:inset-auto lg:h-full lg:shadow-none flex ${
            showProfilePanel 
              ? 'w-full opacity-100 translate-x-0 lg:w-[260px]'
              : 'w-full opacity-0 !border-l-0 pointer-events-none translate-x-full lg:w-0 lg:translate-x-0'
          }`}
        >
          <div className="w-full lg:w-[260px] flex flex-col shrink-0 relative pb-[env(safe-area-inset-bottom)] lg:pb-0">
            {/* Close button for mobile/tablet */}
            <button 
              type="button"
              onClick={() => setShowProfilePanel(false)}
              className="absolute top-3 right-3 h-11 w-11 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer lg:hidden"
              title="Đóng thông tin"
            >
              <X className="h-4 w-4" />
            </button>
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

              {/* Job / Work (ẩn nếu không có dữ liệu thực tế) */}
              {partnerProfile?.work ? (
                <p className="text-xs text-slate-500 font-medium text-center px-4">{partnerProfile.work}</p>
              ) : null}

              {/* Hometown / City (ẩn nếu không có dữ liệu thực tế) */}
              {(partnerProfile?.hometown || partnerProfile?.city) ? (
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 justify-center">
                  <span>📍</span> {[partnerProfile.city, partnerProfile.hometown].filter(Boolean).join(', ')}
                </p>
              ) : null}

              {/* Action buttons */}
              <div className="flex items-center gap-6 mt-5">
                <button 
                  onClick={() => activePartner && navigate(`/profile/${activePartner.id}`)}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer" 
                  title="Xem Profile"
                >
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
              </div>
            </div>

            {/* Shared Media Section */}
            <div className="px-5 pt-4 pb-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-700">Shared media</h4>
                <button 
                  onClick={() => setShowAllMediaModal(true)}
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-700 cursor-pointer"
                >
                  See all
                </button>
              </div>
              {sharedImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {sharedImages.slice(0, 6).map((msg) => (
                    <div 
                      key={msg.id} 
                      onClick={() => msg.mediaUrl && window.open(msg.mediaUrl, '_blank')}
                      className="aspect-square rounded-xl bg-slate-100 overflow-hidden cursor-pointer hover:opacity-85 transition border border-slate-200/40"
                    >
                      <img src={msg.mediaUrl} alt="Shared" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Chưa chia sẻ hình ảnh nào</p>
              )}
            </div>

            {/* Shared Files Section */}
            <div className="px-5 pt-3 pb-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-700">Shared files</h4>
                <button 
                  onClick={() => setShowAllFilesModal(true)}
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-700 cursor-pointer"
                >
                  See all
                </button>
              </div>
              {sharedFiles.length > 0 ? (
                <div className="space-y-2.5">
                  {sharedFiles.slice(0, 3).map((msg) => {
                    const { name, ext } = getFileDetails(msg.mediaUrl || '');
                    return (
                      <div 
                        key={msg.id} 
                        onClick={() => msg.mediaUrl && window.open(msg.mediaUrl, '_blank')}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition group"
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          ext === 'PDF' ? 'bg-rose-50 text-rose-500' :
                          ext === 'ZIP' || ext === 'RAR' ? 'bg-amber-50 text-amber-500' :
                          'bg-blue-50 text-blue-500'
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-grow text-left">
                          <p className="text-[11px] font-bold text-slate-700 truncate group-hover:text-violet-600 transition">{name}</p>
                          <p className="text-[10px] text-slate-400">{ext}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Chưa chia sẻ tài liệu nào</p>
              )}
            </div>

            {/* Mutual Friends (Suggested Friends) Section */}
            <div className="px-5 pt-3 pb-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-700">Mutual friends</h4>
                <button 
                  onClick={() => setShowAllSuggestionsModal(true)}
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-700 cursor-pointer"
                >
                  See all
                </button>
              </div>
              {suggestedFriends.length > 0 ? (
                <div className="flex items-center">
                  {suggestedFriends.slice(0, 3).map((friend) => (
                    <div
                      key={friend.userId}
                      onClick={() => navigate(`/profile/${friend.userId}`)}
                      className="h-9 w-9 rounded-full border-2 border-white overflow-hidden bg-slate-100 -ml-2 first:ml-0 cursor-pointer hover:z-10 hover:scale-110 transition shadow-sm"
                      title={friend.name}
                    >
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-[10px] bg-gradient-to-br from-violet-50 to-slate-100">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                  {suggestedFriends.length > 3 && (
                    <div 
                      onClick={() => setShowAllSuggestionsModal(true)}
                      className="h-9 w-9 rounded-full border-2 border-white bg-violet-50 -ml-2 flex items-center justify-center cursor-pointer hover:bg-violet-100 transition shadow-sm"
                    >
                      <span className="text-[10px] font-black text-violet-600">+{suggestedFriends.length - 3}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Không có gợi ý bạn bè nào</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO CHAT MỚI */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] animate-fade-in">
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
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-[16px] sm:text-xs text-slate-700 transition-all font-medium"
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
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{friend.bio || 'Chưa cập nhật tiểu sử'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TẤT CẢ SHARED MEDIA */}
      {showAllMediaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up animate-duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="font-outfit font-black text-slate-800 text-sm">Tất cả ảnh đã chia sẻ ({sharedImages.length})</span>
              <button
                onClick={() => setShowAllMediaModal(false)}
                title="Đóng"
                className="p-1.5 rounded-lg hover:bg-slate-200 transition text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 grid grid-cols-3 gap-3">
              {sharedImages.map((msg) => (
                <div 
                  key={msg.id} 
                  onClick={() => msg.mediaUrl && window.open(msg.mediaUrl, '_blank')}
                  className="aspect-square rounded-xl bg-slate-100 overflow-hidden cursor-pointer hover:opacity-80 transition border border-slate-200/50 shadow-sm"
                >
                  <img src={msg.mediaUrl} alt="Shared" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TẤT CẢ SHARED FILES */}
      {showAllFilesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up animate-duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="font-outfit font-black text-slate-800 text-sm">Tất cả tệp đã chia sẻ ({sharedFiles.length})</span>
              <button
                onClick={() => setShowAllFilesModal(false)}
                title="Đóng"
                className="p-1.5 rounded-lg hover:bg-slate-200 transition text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-3 space-y-2">
              {sharedFiles.map((msg) => {
                const { name, ext } = getFileDetails(msg.mediaUrl || '');
                return (
                  <div 
                    key={msg.id} 
                    onClick={() => msg.mediaUrl && window.open(msg.mediaUrl, '_blank')}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition group border border-transparent hover:border-slate-100"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      ext === 'PDF' ? 'bg-rose-50 text-rose-500' :
                      ext === 'ZIP' || ext === 'RAR' ? 'bg-amber-50 text-amber-500' :
                      'bg-blue-50 text-blue-500'
                    }`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-grow text-left">
                      <p className="text-xs font-bold text-slate-700 truncate group-hover:text-violet-600 transition">{name}</p>
                      <p className="text-[10px] text-slate-400">{ext}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TẤT CẢ GỢI Ý BẠN BÈ */}
      {showAllSuggestionsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up animate-duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="font-outfit font-black text-slate-800 text-sm">Gợi ý kết bạn ({suggestedFriends.length})</span>
              <button
                onClick={() => setShowAllSuggestionsModal(false)}
                title="Đóng"
                className="p-1.5 rounded-lg hover:bg-slate-200 transition text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-3 space-y-2">
              {suggestedFriends.map((friend) => (
                <div 
                  key={friend.userId} 
                  onClick={() => {
                    setShowAllSuggestionsModal(false);
                    navigate(`/profile/${friend.userId}`);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition group border border-transparent hover:border-slate-100"
                >
                  <div className="h-10 w-10 rounded-full border overflow-hidden bg-slate-100 shrink-0">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-grow text-left">
                    <p className="text-xs font-bold text-slate-700 truncate group-hover:text-violet-600 transition">{friend.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{friend.mutualFriendsCount} bạn chung</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {sharedPostDetail && (
        <PostDetailModal
          post={sharedPostDetail}
          currentUser={currentUser}
          onClose={() => setSharedPostDetail(null)}
        />
      )}

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/95 p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-black/50 p-3 text-white"
            aria-label="Đóng ảnh"
          >
            <X className="h-6 w-6" />
          </button>
          <img src={previewImageUrl} alt="Ảnh trong cuộc trò chuyện" className="max-h-full max-w-full rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}

    </div>
  );
}



