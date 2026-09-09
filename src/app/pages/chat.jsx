import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "../components/app-layout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  Send,
  Smile,
  Paperclip,
  Search,
  MoreVertical,
  Phone,
  Video,
  Plus,
  Hash,
  Users,
  Building2,
  Globe,
  X,
  Copy,
  Reply,
  Pin,
  PinOff,
  LogOut,
  Trash2,
  Image as ImageIcon,
  FileText,
  BellOff,
  Info,
  UserPlus,
  CheckCircle2,
  Share2,
  ListTodo,
  Mic,
  MicOff,
  VideoOff,
  MessageSquare,
  BarChart2,
  Clock,
  AlertTriangle,
  Square,
  Crown
} from "lucide-react";
import { getCurrentRole } from "../utils/auth";
import { showToast } from "../utils/toast";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";
import { fetchDepartments, fetchUsers, fetchChatMessages, sendChatMessage, updateChatReaction } from "../utils/api";
import { getCurrentUser } from "../utils/auth";
import { getSocket } from "../utils/socket";
const EMOJIS = ["\u{1F60A}", "\u{1F602}", "\u2764\uFE0F", "\u{1F44D}", "\u{1F44F}", "\u{1F389}", "\u{1F64C}", "\u{1F525}", "\u{1F4AF}", "\u2705", "\u{1F60E}", "\u{1F914}", "\u{1F440}", "\u{1F4AA}", "\u{1F680}", "\u2B50", "\u2728", "\u{1F64F}", "\u{1F605}", "\u{1F60D}", "\u{1F44B}", "\u{1F38A}", "\u{1F91D}", "\u{1F4A1}", "\u{1F4CC}"];
const RECENT_MEDIA = [
  { name: "Q1_Report.pdf", type: "PDF", size: "2.4 MB", date: "Apr 29", emoji: "\u{1F4C4}" },
  { name: "Design_Mockup.fig", type: "Figma", size: "8.1 MB", date: "Apr 28", emoji: "\u{1F3A8}" },
  { name: "Sprint_Plan.xlsx", type: "Excel", size: "1.2 MB", date: "Apr 27", emoji: "\u{1F4CA}" },
  { name: "Team_Photo.jpg", type: "Image", size: "3.8 MB", date: "Apr 26", emoji: "\u{1F5BC}\uFE0F" },
  { name: "API_Docs.pdf", type: "PDF", size: "5.6 MB", date: "Apr 25", emoji: "\u{1F4C4}" }
];
function makeChMsgs(name) {
  return [
    { id: 1, sender: "Jane Smith", avatar: "JS", content: `Welcome to #${name}! \u{1F44B} Let's keep this channel collaborative and productive.`, time: "09:00 AM", reactions: [{ emoji: "\u{1F44B}", count: 5 }, { emoji: "\u2764\uFE0F", count: 2 }], isSelf: false },
    { id: 2, sender: "John Doe", avatar: "JD", content: "Glad to be here! Looking forward to collaborating with everyone.", time: "09:05 AM", reactions: [], isSelf: false },
    { id: 3, sender: "You", avatar: "ME", content: "Great to have this channel set up. Let's make it a productive space! \u{1F680}", time: "09:08 AM", reactions: [{ emoji: "\u{1F389}", count: 3 }], isSelf: true },
    { id: 4, sender: "Mike Johnson", avatar: "MJ", content: "Agreed! Should we set up a weekly standup here?", time: "09:12 AM", reactions: [{ emoji: "\u{1F44D}", count: 4 }], isSelf: false },
    { id: 5, sender: "Sarah Wilson", avatar: "SW", content: "Great idea! I'll create a recurring meeting invite for the team.", time: "09:15 AM", reactions: [], isSelf: false }
  ];
}
const DM_SEED = {
  10: [
    { id: 1, sender: "John Doe", avatar: "JD", content: "Hey! Can you review the latest PR when you get a chance?", time: "10:30 AM", reactions: [], isSelf: false },
    { id: 2, sender: "You", avatar: "ME", content: "Sure! Give me 15 mins to wrap up what I'm doing.", time: "10:32 AM", reactions: [{ emoji: "\u{1F44D}", count: 1 }], isSelf: true },
    { id: 3, sender: "John Doe", avatar: "JD", content: "No rush! There's a tricky edge case in the auth module \u2014 tokens aren't refreshing on 401.", time: "10:35 AM", reactions: [], isSelf: false },
    { id: 4, sender: "You", avatar: "ME", content: "Found it! Pushing the fix now. The refresh interceptor was missing the error catch. \u{1F525}", time: "10:52 AM", reactions: [{ emoji: "\u{1F525}", count: 2 }], isSelf: true }
  ],
  11: [
    { id: 1, sender: "Jane Smith", avatar: "JS", content: "Hi! Did you get the updated design specs I sent over?", time: "11:00 AM", reactions: [], isSelf: false },
    { id: 2, sender: "You", avatar: "ME", content: "Yes! They look great \u2014 love the new color palette! \u{1F60D}", time: "11:02 AM", reactions: [], isSelf: true },
    { id: 3, sender: "Jane Smith", avatar: "JS", content: "Glad you like it! Let me know if you need any tweaks during implementation. \u{1F60A}", time: "11:05 AM", reactions: [{ emoji: "\u{1F60A}", count: 1 }], isSelf: false }
  ],
  12: [
    { id: 1, sender: "Mike Johnson", avatar: "MJ", content: "QA report for this sprint is ready. Want me to post it in Engineering too?", time: "02:10 PM", reactions: [], isSelf: false },
    { id: 2, sender: "You", avatar: "ME", content: "Yes please! Tag everyone who needs to review.", time: "02:12 PM", reactions: [{ emoji: "\u2705", count: 1 }], isSelf: true }
  ],
  13: [
    { id: 1, sender: "Sarah Wilson", avatar: "SW", content: "Are we still on for the design review tomorrow at 2 PM?", time: "03:00 PM", reactions: [], isSelf: false },
    { id: 2, sender: "You", avatar: "ME", content: "Yes, confirmed! Sending the calendar invite shortly.", time: "03:05 PM", reactions: [], isSelf: true }
  ],
  14: [
    { id: 1, sender: "Priya Patel", avatar: "PP", content: "New API endpoints are fully documented on Confluence. Linking in Engineering now \u2705", time: "03:30 PM", reactions: [{ emoji: "\u2705", count: 3 }], isSelf: false },
    { id: 2, sender: "You", avatar: "ME", content: "Perfect! I'll reference it in the sprint review. Great work \u{1F64C}", time: "03:32 PM", reactions: [], isSelf: true }
  ]
};
const STATUS_DOT = { online: "bg-green-500", away: "bg-amber-400", offline: "bg-gray-300" };

function initialsFromName(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AUTO_REPLY_POOL = {
  default: { name: "Team Bot", avatar: "TB", texts: ["Got it! Thanks for sharing \u{1F680}", "Noted! Will get back to you.", "Sounds great, agreed!", "On it!"] }
};
const PRIORITY_COLORS = {
  High: "border-red-400 bg-red-50 text-red-700",
  Medium: "border-amber-400 bg-amber-50 text-amber-700",
  Low: "border-green-400 bg-green-50 text-green-700"
};
function Chat() {
  const navigate = useNavigate();
  const userRole = getCurrentRole();
  const isAdmin = userRole === "admin";
  const isTeamLead = userRole === "teamlead";
  const canAssignTask = isAdmin || isTeamLead;
  const [deptCh, setDeptCh] = useState([]);
  const [teamCh, setTeamCh] = useState([]);
  const [allMemCh, setAllMemCh] = useState({ id: "all", name: "All Members", type: "channel", category: "all", unread: 0, memberCount: 0 });
  const [dmList, setDmList] = useState([]);
  const [selectedChat, setSelectedChat] = useState({ id: "all", name: "All Members", type: "channel", category: "all", unread: 0, memberCount: 0 });
  const [messagesMap, setMessagesMap] = useState({});
  const [lastReadMap, setLastReadMap] = useState(() => JSON.parse(localStorage.getItem("wf_last_read") || "{}"));
  const [allUsersList, setAllUsersList] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [pinnedMap, setPinnedMap] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [msgMenuId, setMsgMenuId] = useState(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [msgSearchMode, setMsgSearchMode] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [inputEmojiOpen, setInputEmojiOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [newCh, setNewCh] = useState({ type: "department", name: "", desc: "", members: [] });
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [assignMsg, setAssignMsg] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssigneeSearch, setTaskAssigneeSearch] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardTarget, setForwardTarget] = useState("");
  const [forwardSearch, setForwardSearch] = useState("");
  const [muteModalOpen, setMuteModalOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollVoted, setPollVoted] = useState({});
  const [recentMediaOpen, setRecentMediaOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [callModal, setCallModal] = useState(null);
  const [callMuted, setCallMuted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("chat");
  const [channelInfoOpen, setChannelInfoOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const scrollRef = useRef(null);
  const replyTimer = useRef(null);
  const callTimerRef = useRef(null);
  const recordRef = useRef(null);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const currentMsgs = messagesMap[selectedChat.id] ?? [];
  useEffect(() => {
    if (selectedChat?.id && currentMsgs.length > 0) {
      const latestMsgId = currentMsgs[currentMsgs.length - 1].id;
      setLastReadMap(prev => {
        if (prev[selectedChat.id] === latestMsgId) return prev;
        const next = { ...prev, [selectedChat.id]: latestMsgId };
        localStorage.setItem("wf_last_read", JSON.stringify(next));
        return next;
      });
    }
  }, [selectedChat?.id, currentMsgs]);

  const getUnreadCount = (chatId) => {
    const msgs = messagesMap[chatId] || [];
    if (!msgs.length) return 0;
    const lastRead = lastReadMap[chatId] || 0;
    const currentUser = getCurrentUser();
    return msgs.filter(m => {
      if (m.id <= lastRead) return false;
      const computedIsSelf = m.sender === currentUser?.name || (m.isSelf && m.sender === "You");
      return !computedIsSelf;
    }).length;
  };
  const pinnedMsg = pinnedMap[selectedChat.id] ?? null;
  const allChannels = [...deptCh, ...teamCh, allMemCh];
  const allChats = [...allChannels, ...dmList];
  const filteredMsgs = msgSearchMode && msgSearchQuery.trim() ? currentMsgs.filter((m) => m.content.toLowerCase().includes(msgSearchQuery.toLowerCase())) : currentMsgs;
  const sl = sidebarSearch.toLowerCase();
  const filtDept = sl ? deptCh.filter((c) => c.name.toLowerCase().includes(sl)) : deptCh;
  const filtTeam = sl ? teamCh.filter((c) => c.name.toLowerCase().includes(sl)) : teamCh;
  const filtDm = (sl ? dmList.filter((d) => d.name.toLowerCase().includes(sl)) : dmList).sort((a, b) => {
    const aMsgs = messagesMap[a.id] || [];
    const bMsgs = messagesMap[b.id] || [];
    const aLast = aMsgs.length > 0 ? Number(aMsgs[aMsgs.length - 1].id) || 0 : 0;
    const bLast = bMsgs.length > 0 ? Number(bMsgs[bMsgs.length - 1].id) || 0 : 0;
    return bLast - aLast;
  });
  const showAllMem = !sl || allMemCh.name.toLowerCase().includes(sl);
  const fwdQuery = forwardSearch.toLowerCase();
  const filteredForwardChats = allChats.filter((c) => {
    if (c.id === selectedChat.id) return false;
    return !fwdQuery || c.name.toLowerCase().includes(fwdQuery);
  });
  const filtAssignees = allUsersList.filter(
    (u) => !taskAssigneeSearch || u.toLowerCase().includes(taskAssigneeSearch.toLowerCase())
  );
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentMsgs, selectedChat.id]);
  useEffect(() => {
    if (callModal) {
      callTimerRef.current = setInterval(() => setCallTimer((t) => t + 1), 1e3);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallTimer(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callModal]);
  useEffect(() => {
    if (isRecording) {
      recordRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1e3);
      
      // Start actual recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recorder = new MediaRecorder(stream);
          const chunks = [];
          recorder.ondataavailable = e => chunks.push(e.data);
          recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            // In a real app, you'd upload this blob. 
            // For now, we'll convert to base64 or just send a mock success.
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
              const base64Audio = reader.result;
              try {
                await sendChatMessage(selectedChat.id, {
                  content: `Voice message (${fmtRecSec(recordSeconds)})`,
                  type: 'voice',
                  fileUrl: base64Audio // Sending as data URL for persistence in this demo
                });
                const msgs = await fetchChatMessages(selectedChat.id);
                setMessagesMap(prev => ({ ...prev, [selectedChat.id]: msgs }));
              } catch (err) {
                showToast("Failed to send voice message", "error");
              }
            };
            stream.getTracks().forEach(t => t.stop());
          };
          recorder.start();
          window._chatRecorder = recorder;
        })
        .catch(err => {
          console.error("Mic error:", err);
          setIsRecording(false);
          showToast("Microphone access denied", "error");
        });
    } else {
      if (recordRef.current) clearInterval(recordRef.current);
      if (window._chatRecorder && window._chatRecorder.state !== "inactive") {
        window._chatRecorder.stop();
      }
      setRecordSeconds(0);
    }
    return () => {
      if (recordRef.current) clearInterval(recordRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [depts, users] = await Promise.all([fetchDepartments(), fetchUsers()]);
        if (!mounted) return;

        const mappedDepts = depts.map(d => ({
          id: d.id || d._id,
          name: d.name,
          type: "channel",
          category: "department",
          unread: 0,
          memberCount: d.members || 0
        }));

        const currentUser = getCurrentUser();
        const activeUsers = [...(users || [])];
        if (!activeUsers.find(u => u.name === "Google User")) {
          activeUsers.push({
            _id: "google-mock-id",
            name: "Google User",
            role: "admin",
            status: "online"
          });
        }

        const mappedDms = activeUsers.map(u => {
          const uId = String(u.id || u._id || Math.random());
          const currentId = String(currentUser?.id || currentUser?._id || "local");
          const convKey = `dm_${[currentId, uId].sort().join("_")}`;
          return {
            id: convKey,
            targetUserId: uId,
            name: u.name || "Unknown User",
            avatar: initialsFromName(u.name),
            type: "dm",
            status: "online",
            unread: 0,
            role: String(u.role || "employee").toLowerCase()
          };
        }).filter(u => u.name !== currentUser?.name && u.targetUserId);

        const allCh = { id: "all", name: "All Members", type: "channel", category: "all", unread: 0, memberCount: (users || []).length };
        
        setDeptCh(mappedDepts);
        setDmList(mappedDms);
        setAllMemCh(allCh);
        setAllUsersList((users || []).map(u => u.name).filter(Boolean));

        const globalChats = JSON.parse(localStorage.getItem("wf_global_chat_dms") || "{}");

        const msgMap = {};
        [...mappedDepts, allCh].forEach(ch => {
          if (ch && ch.id) {
            msgMap[ch.id] = globalChats[`channel_${ch.id}`] || makeChMsgs(ch.name);
          }
        });
        mappedDms.forEach(dm => {
          if (dm && dm.id) {
            msgMap[dm.id] = globalChats[dm.id] || DM_SEED[dm.targetUserId] || [];
          }
        });
        setMessagesMap(msgMap);

        const socket = getSocket();
        [...mappedDepts, allCh, ...mappedDms].forEach(chat => {
          if (chat && chat.id) socket.emit('join_room', chat.id);
        });
        
        if (mappedDepts.length > 0) {
          setSelectedChat(mappedDepts[0]);
        } else {
          setSelectedChat(allCh);
        }
      } catch (err) {
        console.error("Chat load failed", err);
        // Fallback to minimal state to prevent crash
        const allCh = { id: "all", name: "All Members", type: "channel", category: "all", unread: 0, memberCount: 0 };
        setAllMemCh(allCh);
        setSelectedChat(allCh);
        setMessagesMap({ "all": makeChMsgs("All Members") });
      }
    }
    loadData();

    const handleStorageChange = (e) => {
      if (e.key === "wf_global_chat_dms") {
        const globalChats = JSON.parse(e.newValue || "{}");
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        const currentId = String(currentUser.id || currentUser._id || "local");
        
        setMessagesMap(prevMap => {
          const newMap = { ...prevMap };
          Object.keys(newMap).forEach(chatId => {
            const isChannel = [...deptCh, ...teamCh, allMemCh].find(c => String(c.id) === String(chatId));
            if (isChannel) {
              if (globalChats[`channel_${chatId}`]) newMap[chatId] = globalChats[`channel_${chatId}`];
            } else {
              if (globalChats[chatId]) newMap[chatId] = globalChats[chatId];
            }
          });
          return newMap;
        });
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => { 
      mounted = false; 
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!selectedChat?.id) return;
    
    const socket = getSocket();
    socket.emit('join_room', selectedChat.id);

    const loadMessages = async () => {
      try {
        const msgs = await fetchChatMessages(selectedChat.id);
        setMessagesMap(prev => ({ ...prev, [selectedChat.id]: msgs }));
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    
    loadMessages();

    socket.on('receive_message', (msg) => {
      setMessagesMap(prev => {
        const chatId = msg.chatId;
        const chatMsgs = prev[chatId] || [];
        if (chatMsgs.find(m => m.id === msg.id)) return prev;
        return {
          ...prev,
          [chatId]: [...chatMsgs, msg]
        };
      });
    });

    return () => {
      socket.off('receive_message');
    };
  }, [selectedChat?.id]);
  const closeAllMenus = () => {
    setHeaderMenuOpen(false);
    setMsgMenuId(null);
    setReactionPickerMsgId(null);
    setAttachMenuOpen(false);
    setInputEmojiOpen(false);
  };
  const fmtTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const fmtRecSec = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const selectChat = (chat) => {
    setSelectedChat(chat);
    setMsgSearchMode(false);
    setMsgSearchQuery("");
    setReplyingTo(null);
    closeAllMenus();
    if (chat.type === "channel") {
      if (chat.category === "department") setDeptCh((p) => p.map((c) => c.id === chat.id ? { ...c, unread: 0 } : c));
      else if (chat.category === "team") setTeamCh((p) => p.map((c) => c.id === chat.id ? { ...c, unread: 0 } : c));
      else setAllMemCh((p) => ({ ...p, unread: 0 }));
    } else {
      setDmList((p) => p.map((d) => d.id === chat.id ? { ...d, unread: 0 } : d));
    }
  };
  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text) return;
    const currentUser = getCurrentUser();
    
    try {
      const savedMsg = await sendChatMessage(selectedChat.id, {
        content: text,
        type: 'text',
        replyTo: replyingTo ? { sender: replyingTo.sender, content: replyingTo.content } : null
      });
      
      setMessagesMap((p) => {
        const currentMsgs = p[selectedChat.id] ?? [];
        if (currentMsgs.find(m => m.id === savedMsg.id)) return p;
        return { ...p, [selectedChat.id]: [...currentMsgs, savedMsg] };
      });
      setMessageInput("");
      setReplyingTo(null);
    } catch (err) {
      showToast("Failed to send message", "error");
    }
  };
  const addReaction = (msgId, emoji) => {
    setMessagesMap((p) => ({
      ...p,
      [selectedChat.id]: p[selectedChat.id].map((m) => {
        if (m.id !== msgId) return m;
        const ex = m.reactions.find((r) => r.emoji === emoji);
        return ex ? { ...m, reactions: m.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) } : { ...m, reactions: [...m.reactions, { emoji, count: 1 }] };
      })
    }));
    setReactionPickerMsgId(null);
    setMsgMenuId(null);
  };
  const togglePin = (msg) => {
    const isPinned = pinnedMap[selectedChat.id]?.id === msg.id;
    setPinnedMap((p) => ({ ...p, [selectedChat.id]: isPinned ? null : msg }));
    setMsgMenuId(null);
    showToast(isPinned ? "Message unpinned" : "\u{1F4CC} Message pinned", "success");
  };
  const copyMsg = (content) => {
    navigator.clipboard?.writeText(content).catch(() => {
    });
    setMsgMenuId(null);
    showToast("Copied to clipboard", "success");
  };
  const openForward = (msg) => {
    setForwardMsg(msg);
    setForwardTarget("");
    setForwardSearch("");
    setForwardOpen(true);
    setMsgMenuId(null);
  };
  const openAssignTask = (msg) => {
    setAssignMsg(msg);
    setTaskTitle(msg.content.slice(0, 60));
    setTaskDesc(msg.content);
    setTaskAssignee("");
    setTaskAssigneeSearch("");
    setTaskPriority("Medium");
    setAssignTaskOpen(true);
    setMsgMenuId(null);
  };
  const handleAssignTask = () => {
    if (!taskTitle.trim()) {
      showToast("Enter a task title", "error");
      return;
    }
    if (!taskAssignee) {
      showToast("Select an assignee", "error");
      return;
    }
    setAssignTaskOpen(false);
    showToast(`\u2705 Task assigned to ${taskAssignee} (${taskPriority} priority)`, "success");
    setTaskTitle("");
    setTaskDesc("");
    setTaskAssignee("");
    setTaskAssigneeSearch("");
    setTaskPriority("Medium");
  };
  const handleForward = () => {
    if (!forwardMsg || !forwardTarget) {
      showToast("Select a destination", "error");
      return;
    }
    const targetId = forwardTarget;
    setMessagesMap((p) => ({
      ...p,
      [targetId]: [...p[targetId] ?? [], {
        ...forwardMsg,
        id: Date.now(),
        isSelf: true,
        replyTo: null,
        content: `\u{1F4E4} Forwarded: ${forwardMsg.content}`
      }]
    }));
    const dest = allChats.find((c) => c.id === targetId);
    setForwardOpen(false);
    showToast(`Forwarded to ${dest?.name ?? "chat"}`, "success");
  };
  const handleClearChat = () => {
    setMessagesMap((p) => ({ ...p, [selectedChat.id]: [] }));
    setPinnedMap((p) => ({ ...p, [selectedChat.id]: null }));
    setDeleteConfirmOpen(false);
    showToast("Chat cleared", "info");
  };
  const handleDeleteChannel = () => {
    if (selectedChat.category === "department") setDeptCh((p) => p.filter((c) => c.id !== selectedChat.id));
    else if (selectedChat.category === "team") setTeamCh((p) => p.filter((c) => c.id !== selectedChat.id));
    setSelectedChat(deptCh[0] || allMemCh);
    setDeleteConfirmOpen(false);
    showToast(`#${selectedChat.name} deleted`, "info");
  };
  const handleAddChannel = () => {
    if (!newCh.name.trim()) {
      showToast("Enter a channel name", "error");
      return;
    }
    const ch = { id: Date.now(), name: newCh.name.trim(), type: "channel", category: newCh.type, unread: 0, memberCount: 1 };
    if (newCh.type === "department") setDeptCh((p) => [...p, ch]);
    else setTeamCh((p) => [...p, ch]);
    setMessagesMap((p) => ({ ...p, [ch.id]: makeChMsgs(ch.name) }));
    setAddChannelOpen(false);
    setNewCh({ type: "department", name: "", desc: "", members: [] });
    setSelectedChat(ch);
    showToast(`#${ch.name} created \u{1F389}`, "success");
  };
  const handleMute = (label) => {
    showToast(`\u{1F515} Notifications muted for ${label}`, "success");
    setMuteModalOpen(false);
  };
  const startCall = (type) => {
    const roomId = `SyncFlowCall-${selectedChat.id}-${Date.now()}`.replace(/[^a-zA-Z0-9]/g, "");
    let callUrl = `https://meet.jit.si/${roomId}#config.prejoinPageEnabled=false&config.disableWelcomePage=true&config.requireDisplayName=false&config.readOnlyName=true&config.enableWelcomePage=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.SHOW_POWERED_BY=false&config.toolbarButtons=["microphone","camera","desktop","chat","hangup","tileview"]`;
    
    if (type === "audio") {
      callUrl += "&config.startWithVideoMuted=true";
    }

    // Notify the other side by sending a message with the call link
    sendChatMessage(selectedChat.id, {
      content: `Incoming ${type} call. Join here: ${callUrl}`,
      type: type === "video" ? "call_video" : "call_audio"
    });
    
    // Navigate within the app instead of opening a new tab
    const path = userRole === 'admin' ? '/admin/meetings' : userRole === 'teamlead' ? '/teamlead/meetings' : '/meetings';
    navigate(`${path}?join=${roomId}&type=${type}`);
    showToast(`Starting ${type} call...`, "info");
  };
  const handleSendPoll = () => {
    const q = pollQuestion.trim();
    const opts = pollOptions.filter((o) => o.trim());
    if (!q) {
      showToast("Enter a poll question", "error");
      return;
    }
    if (opts.length < 2) {
      showToast("Add at least 2 options", "error");
      return;
    }
    const pollContent = `\u{1F4CA} **Poll**: ${q}
${opts.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
    const msg = {
      id: Date.now(),
      sender: "You",
      avatar: "ME",
      content: pollContent,
      time: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      reactions: [],
      isSelf: true
    };
    setMessagesMap((p) => ({ ...p, [selectedChat.id]: [...p[selectedChat.id] ?? [], msg] }));
    setPollOpen(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    showToast("Poll sent!", "success");
  };
  const handleStopRecording = () => {
    setIsRecording(false);
    showToast("Processing voice message...", "info");
  };
  const handleFileSelected = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const emoji = type === "media" ? "\u{1F4F7}" : "\u{1F4C4}";
    const msg = {
      id: Date.now(),
      sender: "You",
      avatar: "ME",
      content: `${emoji} ${file.name}`,
      time: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      reactions: [],
      isSelf: true
    };
    setMessagesMap((p) => ({ ...p, [selectedChat.id]: [...p[selectedChat.id] ?? [], msg] }));
    showToast(`${file.name} sent!`, "success");
    e.target.value = "";
  };
  const CatIcon = ({ cat }) => cat === "department" ? <Building2 className="h-3.5 w-3.5" /> : cat === "team" ? <Users className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />;
  const ChannelRow = ({ ch }) => <button
    onClick={() => selectChat(ch)}
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${selectedChat.id === ch.id ? "bg-[#162E93]/10 text-[#162E93] font-semibold" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
  >
      <Hash className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
      <span className="flex-1 text-left truncate">{ch.name}</span>
      {getUnreadCount(ch.id) > 0 && <Badge className="h-4 min-w-4 px-1 text-[10px] bg-[#162E93] text-white rounded-full">{getUnreadCount(ch.id)}</Badge>}
    </button>;
  const DmRow = ({ dm }) => <button
    onClick={() => selectChat(dm)}
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${selectedChat.id === dm.id ? "bg-[#162E93]/10 text-[#162E93] font-semibold" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
  >
      <div className="relative flex-shrink-0">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px] bg-[#088395]/20 text-[#088395]">{dm.avatar}</AvatarFallback>
        </Avatar>
        <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white ${STATUS_DOT[dm.status ?? "offline"]}`} />
      </div>
      <span className="flex-1 text-left truncate">{dm.name}</span>
      {getUnreadCount(dm.id) > 0 && <Badge className="h-4 min-w-4 px-1 text-[10px] bg-[#162E93] text-white rounded-full">{getUnreadCount(dm.id)}</Badge>}
    </button>;
  const SectionLabel = ({ children }) => <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1 mb-1">{children}</p>;
  return <AppLayout userRole={userRole}>
      <div className="h-[calc(100vh-8rem)] flex gap-3" onClick={closeAllMenus}>

        {
    /* ════ SIDEBAR ════════════════════════════════════════════════════ */
  }
        <Card className="w-72 flex flex-col overflow-hidden flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
    placeholder="Search channels & people…"
    className="pl-9 h-9 rounded-xl border-gray-200 bg-gray-50 text-sm"
    value={sidebarSearch}
    onChange={(e) => setSidebarSearch(e.target.value)}
  />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 mt-1">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Channels</span>
                {(isAdmin || isTeamLead) && <button onClick={() => setAddChannelOpen(true)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Add Channel">
                    <Plus className="h-3.5 w-3.5" />
                  </button>}
              </div>

              {filtDept.length > 0 && <div>
                  <SectionLabel>🏢 Department</SectionLabel>
                  {filtDept.map((ch) => <ChannelRow key={ch.id} ch={ch} />)}
                </div>}
              {filtTeam.length > 0 && <div className="mt-1">
                  <SectionLabel>👥 Teams</SectionLabel>
                  {filtTeam.map((ch) => <ChannelRow key={ch.id} ch={ch} />)}
                </div>}
              {showAllMem && <div className="mt-1">
                  <SectionLabel>🌐 Company</SectionLabel>
                  <ChannelRow ch={allMemCh} />
                </div>}

              <div className="flex items-center justify-between px-2 py-1.5 mt-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Direct Messages</span>
                <button onClick={() => showToast("Opening new DM dialog\u2026", "info")} className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="New DM">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              
              {filtDm.filter(dm => dm.role === "admin").length > 0 && <div>
                  <SectionLabel>👑 Admin</SectionLabel>
                  {filtDm.filter(dm => dm.role === "admin").map((dm) => <DmRow key={dm.id} dm={dm} />)}
                </div>}
              {filtDm.filter(dm => dm.role === "teamlead").length > 0 && <div className="mt-1">
                  <SectionLabel>⭐ Team Leads</SectionLabel>
                  {filtDm.filter(dm => dm.role === "teamlead").map((dm) => <DmRow key={dm.id} dm={dm} />)}
                </div>}
              {filtDm.filter(dm => dm.role !== "admin" && dm.role !== "teamlead").length > 0 && <div className="mt-1">
                  <SectionLabel>👥 Employees</SectionLabel>
                  {filtDm.filter(dm => dm.role !== "admin" && dm.role !== "teamlead").map((dm) => <DmRow key={dm.id} dm={dm} />)}
                </div>}

              {!filtDept.length && !filtTeam.length && !showAllMem && !filtDm.length && <div className="text-center py-6 text-xs text-muted-foreground">No results for "{sidebarSearch}"</div>}
            </div>
          </div>
        </Card>

        {
    /* ════ MAIN CHAT AREA ══════════════════════════════════════════════ */
  }
        <Card className="flex-1 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

          {
    /* ── Chat Header ───────────────────────────────────────────── */
  }
          <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {selectedChat.type === "channel" ? <div className="h-9 w-9 rounded-xl bg-[#162E93]/10 flex items-center justify-center">
                  <CatIcon cat={selectedChat.category} />
                </div> : <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[#088395]/20 text-[#088395] text-xs font-bold">{selectedChat.avatar}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${STATUS_DOT[selectedChat.status ?? "offline"]}`} />
                </div>}
              <div>
                <h3 className="font-semibold text-sm text-gray-900">
                  {selectedChat.type === "channel" ? `# ${selectedChat.name}` : selectedChat.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedChat.type === "channel" ? `${selectedChat.memberCount ?? 0} members` : selectedChat.status ?? "offline"}
                </p>
              </div>
            </div>

            {
    /* Header actions — Phone, Video, 3-dot only (UserPlus icon removed) */
  }
            <div className="flex items-center gap-1">
              <button onClick={() => startCall("voice")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-[#162E93] transition-colors" title="Voice Call">
                <Phone className="h-4 w-4" />
              </button>
              <button onClick={() => startCall("video")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-[#162E93] transition-colors" title="Video Call">
                <Video className="h-4 w-4" />
              </button>

              {
    /* 3-dot header menu */
  }
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
    onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
  >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {headerMenuOpen && <>
                    <div className="fixed inset-0 z-30" onClick={() => setHeaderMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 w-52">
                      {
    /* Add Members — Admin & Team Lead only */
  }
                      {(isAdmin || isTeamLead) && <button onClick={() => {
    setAddMembersOpen(true);
    setHeaderMenuOpen(false);
  }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <UserPlus className="h-4 w-4 text-gray-400" />Add Members
                        </button>}
                      {
    /* Channel/Team Info */
  }
                      <button onClick={() => {
    setChannelInfoOpen(true);
    setHeaderMenuOpen(false);
  }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Info className="h-4 w-4 text-gray-400" />{selectedChat.type === "dm" ? "Contact Info" : "Channel Info"}
                      </button>
                      {
    /* Search Messages */
  }
                      <button onClick={() => {
    setMsgSearchMode(true);
    setHeaderMenuOpen(false);
  }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Search className="h-4 w-4 text-gray-400" />Search Messages
                      </button>
                      <div className="my-1 border-t border-gray-50" />
                      {
    /* Mute Notifications — opens modal */
  }
                      <button onClick={() => {
    setMuteModalOpen(true);
    setHeaderMenuOpen(false);
  }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <BellOff className="h-4 w-4 text-gray-400" />Mute Notifications
                      </button>
                      <div className="my-1 border-t border-gray-50" />
                      {
    /* Clear Chat */
  }
                      <button onClick={() => {
    setDeleteType("chat");
    setDeleteConfirmOpen(true);
    setHeaderMenuOpen(false);
  }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Trash2 className="h-4 w-4 text-gray-400" />Clear Chat
                      </button>
                      {
    /* Exit Channel */
  }
                      <button onClick={() => {
    showToast(`Left #${selectedChat.name}`, "info");
    setHeaderMenuOpen(false);
  }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <LogOut className="h-4 w-4 text-gray-400" />Exit {selectedChat.type === "dm" ? "Chat" : "Channel"}
                      </button>
                      {
    /* Delete Channel — Admin only */
  }
                      {isAdmin && selectedChat.type === "channel" && selectedChat.category !== "all" && <>
                          <div className="my-1 border-t border-gray-50" />
                          <button onClick={() => {
    setDeleteType("channel");
    setDeleteConfirmOpen(true);
    setHeaderMenuOpen(false);
  }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4" />Delete Channel
                          </button>
                        </>}
                    </div>
                  </>}
              </div>
            </div>
          </div>

          {
    /* ── Pinned message bar ──────────────────────────────────── */
  }
          {pinnedMsg && <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
              <Pin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Pinned Message</p>
                <p className="text-xs text-amber-800 truncate">{pinnedMsg.content}</p>
              </div>
              <button onClick={() => setPinnedMap((p) => ({ ...p, [selectedChat.id]: null }))} className="text-amber-400 hover:text-amber-600 flex-shrink-0 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>}

          {
    /* ── Message search bar ──────────────────────────────────── */
  }
          {msgSearchMode && <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
              <Search className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <Input
    autoFocus
    placeholder="Search messages…"
    value={msgSearchQuery}
    onChange={(e) => setMsgSearchQuery(e.target.value)}
    className="flex-1 h-8 rounded-lg border-blue-200 bg-white text-sm focus-visible:ring-blue-300"
  />
              <span className="text-xs text-blue-500 flex-shrink-0">{msgSearchQuery ? `${filteredMsgs.length} found` : ""}</span>
              <button onClick={() => {
    setMsgSearchMode(false);
    setMsgSearchQuery("");
  }} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>}

          {
    /* ── Messages area ───────────────────────────────────────── */
  }
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50/30" onClick={closeAllMenus}>
            {filteredMsgs.length === 0 ? <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <MessageSquare className="h-12 w-12 text-gray-200" />
                <p className="text-sm text-muted-foreground">{msgSearchQuery ? "No messages match your search." : "No messages yet. Start the conversation!"}</p>
              </div> : <div className="space-y-4">
                {filteredMsgs.filter(msg => {
                  const isCall = msg.type === 'call_video' || msg.type === 'call_audio';
                  if (!isCall) return true;
                  
                  // For call messages, check if I am the sender
                  const currentUser = getCurrentUser();
                  const currentUserId = String(currentUser?.id || currentUser?._id || "");
                  const msgSenderId = String(msg.senderId || "");
                  const computedIsSelf = (msgSenderId && currentUserId === msgSenderId) || 
                                       msg.sender === currentUser?.name || 
                                       (msg.isSelf && msg.sender === "You");
                  
                  // Hide call notification if I am the one who started it
                  return !computedIsSelf;
                }).map((msg) => {
                  const currentUser = getCurrentUser();
                  const currentUserId = String(currentUser?.id || currentUser?._id || "");
                  const msgSenderId = String(msg.senderId || "");
                  const computedIsSelf = (msgSenderId && currentUserId === msgSenderId) || 
                                       msg.sender === currentUser?.name || 
                                       (msg.isSelf && msg.sender === "You");
                  return <div
    key={msg.id}
    className={`flex items-end gap-2.5 ${computedIsSelf ? "flex-row-reverse" : "flex-row"}`}
    onMouseEnter={() => setHoveredMsgId(msg.id)}
    onMouseLeave={() => {
      if (msgMenuId !== msg.id) setHoveredMsgId(null);
    }}
    onClick={(e) => e.stopPropagation()}
  >
                    {!computedIsSelf && <Avatar className="h-8 w-8 rounded-xl flex-shrink-0">
                        <AvatarFallback className="rounded-xl text-xs">{msg.avatar}</AvatarFallback>
                      </Avatar>}

                    <div className={`max-w-[60%] flex flex-col gap-0.5 ${computedIsSelf ? "items-end" : "items-start"}`}>
                      {!computedIsSelf && <p className="text-[11px] text-gray-500 px-1 font-semibold">{msg.sender}</p>}

                      {msg.replyTo && <div className={`px-3 py-1.5 rounded-xl text-xs border-l-2 mb-0.5 max-w-full ${computedIsSelf ? "bg-blue-50 border-[#162E93]/40 text-gray-600" : "bg-gray-100 border-gray-300 text-gray-500"}`}>
                          <p className="font-semibold text-gray-600">{msg.replyTo.sender}</p>
                          <p className="truncate">{msg.replyTo.content}</p>
                        </div>}

                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${computedIsSelf ? "bg-[#162E93] text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm"}`}>
                        {msg.type === 'voice' ? (
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <Mic className="h-4 w-4" />
                            <audio controls className="h-8 max-w-full">
                              <source src={msg.fileUrl} type="audio/webm" />
                            </audio>
                          </div>
                        ) : msg.type === 'call_video' || msg.type === 'call_audio' ? (
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            <div className="flex items-center gap-2 font-semibold">
                              {msg.type === 'call_video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                              {msg.content.split('. Join here: ')[0]}
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8"
                              onClick={() => {
                                const urlMatch = msg.content.match(/Join here: https:\/\/meet\.jit\.si\/(.+)/);
                                if (urlMatch) {
                                  const fullId = urlMatch[1];
                                  const roomId = fullId.split('#')[0];
                                  const type = msg.type === 'call_video' ? 'video' : 'audio';
                                  // Navigate to meetings with join param
                                  const path = userRole === 'admin' ? '/admin/meetings' : userRole === 'teamlead' ? '/teamlead/meetings' : '/meetings';
                                  navigate(`${path}?join=${roomId}&type=${type}`);
                                }
                              }}
                            >
                              Join Call
                            </Button>
                          </div>
                        ) : msg.content.startsWith("\u{1F4CA} **Poll**:") ? <div className="space-y-2 min-w-[200px]">
                            {msg.content.split("\n").map((line, li) => {
                              if (li === 0) return <p key={0} className="font-semibold text-sm">{line.replace("\u{1F4CA} **Poll**: ", "\u{1F4CA} ")}</p>;
                              const optMatch = line.match(/^(\d+)\. (.+)$/);
                              if (!optMatch) return null;
                              const optIdx = parseInt(optMatch[1]) - 1;
                              const voted = pollVoted[String(msg.id)] === optIdx;
                              return <button
                                key={li}
                                onClick={() => setPollVoted((p) => ({ ...p, [String(msg.id)]: optIdx }))}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs border transition-all ${voted ? "border-[#162E93] bg-[#162E93]/10 text-[#162E93] font-semibold" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                              >
                                {voted ? "\u2705 " : "\u25CB "}{optMatch[2]}
                              </button>;
                            })}
                          </div> : msg.content}
                      </div>

                      <p className="text-[10px] text-gray-400 px-1">{msg.time}</p>

                      {msg.reactions.length > 0 && <div className={`flex flex-wrap gap-1 mt-0.5 ${computedIsSelf ? "justify-end" : "justify-start"}`}>
                          {msg.reactions.map((r, i) => <button key={i} onClick={() => addReaction(msg.id, r.emoji)} className="px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs transition-colors border border-gray-200">
                              {r.emoji} {r.count}
                            </button>)}
                        </div>}
                    </div>

                    {
    /* Action bar */
  }
                    <div className={`flex items-center gap-0.5 self-center flex-shrink-0 transition-opacity ${hoveredMsgId === msg.id || msgMenuId === msg.id ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                      {
    /* Quick react */
  }
                      <div className="relative">
                        <button
    onClick={(e) => {
      e.stopPropagation();
      setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id);
      setMsgMenuId(null);
    }}
    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-700 shadow-sm transition-colors"
    title="React"
  >
                          <Smile className="h-3.5 w-3.5" />
                        </button>
                        {reactionPickerMsgId === msg.id && <div className={`absolute ${computedIsSelf ? "right-0" : "left-0"} bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 grid grid-cols-5 gap-1 w-36`}>
                            {EMOJIS.slice(0, 20).map((e) => <button key={e} onClick={() => addReaction(msg.id, e)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-sm transition-colors">{e}</button>)}
                          </div>}
                      </div>

                      {
    /* Reply */
  }
                      <button
    onClick={(e) => {
      e.stopPropagation();
      setReplyingTo(msg);
      setMsgMenuId(null);
      setHoveredMsgId(null);
    }}
    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-700 shadow-sm transition-colors"
    title="Reply"
  >
                        <Reply className="h-3.5 w-3.5" />
                      </button>

                      {
    /* 3-dot message menu */
  }
                      <div className="relative">
                        <button
    onClick={(e) => {
      e.stopPropagation();
      setMsgMenuId(msgMenuId === msg.id ? null : msg.id);
      setReactionPickerMsgId(null);
    }}
    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-700 shadow-sm transition-colors"
    title="More actions"
  >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {msgMenuId === msg.id && <>
                            <div className="fixed inset-0 z-30" onClick={() => setMsgMenuId(null)} />
                            <div className={`absolute ${computedIsSelf ? "right-0" : "left-0"} bottom-full mb-1 z-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 w-44`}>
                              <button onClick={() => {
    setReactionPickerMsgId(msg.id);
    setMsgMenuId(null);
  }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Smile className="h-3.5 w-3.5 text-gray-400" />React
                              </button>
                              <button onClick={() => copyMsg(msg.content)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Copy className="h-3.5 w-3.5 text-gray-400" />Copy
                              </button>
                              <button onClick={() => openForward(msg)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Share2 className="h-3.5 w-3.5 text-gray-400" />Forward
                              </button>
                              <button onClick={() => {
    setReplyingTo(msg);
    setMsgMenuId(null);
  }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Reply className="h-3.5 w-3.5 text-gray-400" />Reply
                              </button>
                              <button onClick={() => togglePin(msg)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                                {pinnedMap[selectedChat.id]?.id === msg.id ? <><PinOff className="h-3.5 w-3.5 text-gray-400" />Unpin</> : <><Pin className="h-3.5 w-3.5 text-gray-400" />Pin</>}
                              </button>
                              {canAssignTask && <>
                                  <div className="my-0.5 border-t border-gray-50" />
                                  <button onClick={() => openAssignTask(msg)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#162E93] hover:bg-blue-50">
                                    <ListTodo className="h-3.5 w-3.5" />Assign to Task
                                  </button>
                                </>}
                            </div>
                          </>}
                      </div>
                    </div>


                  </div>;
                })}
              </div>}
          </div>

          {
    /* ── Reply-to preview bar ────────────────────────────────── */
  }
          {replyingTo && <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border-t border-blue-100">
              <Reply className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-blue-700">Replying to {replyingTo.sender}</p>
                <p className="text-xs text-blue-600 truncate">{replyingTo.content}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>}

          {
    /* ── Voice recording bar ─────────────────────────────────── */
  }
          {isRecording && <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 border-t border-red-100">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <p className="text-sm font-semibold text-red-600 flex-1">Recording… {fmtRecSec(recordSeconds)}</p>
              <button
    onClick={handleStopRecording}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
  >
                <Square className="h-3.5 w-3.5" />Stop & Send
              </button>
              <button onClick={() => setIsRecording(false)} className="text-red-400 hover:text-red-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>}

          {
    /* ── Message Input ────────────────────────────────────────── */
  }
          <div className="p-3 border-t flex-shrink-0 bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              {
    /* Attachment button */
  }
              <div className="relative">
                <button
    onClick={(e) => {
      e.stopPropagation();
      setAttachMenuOpen(!attachMenuOpen);
      setInputEmojiOpen(false);
    }}
    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
    title="Attach"
  >
                  <Paperclip className="h-4 w-4" />
                </button>

                {
    /* Hidden system file inputs */
  }
                <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileSelected(e, "media")} />
                <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={(e) => handleFileSelected(e, "document")} />

                {attachMenuOpen && <>
                    <div className="fixed inset-0 z-30" onClick={() => setAttachMenuOpen(false)} />
                    <div className="absolute left-0 bottom-full mb-2 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 w-48 z-40">

                      {
    /* Media — triggers system file picker */
  }
                      <button
    onClick={() => {
      setAttachMenuOpen(false);
      setTimeout(() => mediaInputRef.current?.click(), 50);
    }}
    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
                        <ImageIcon className="h-4 w-4 text-violet-400" />
                        <div className="text-left">
                          <p className="text-xs font-semibold">Media</p>
                          <p className="text-[10px] text-gray-400">Photo / Video</p>
                        </div>
                      </button>

                      {
    /* Document — triggers system file picker */
  }
                      <button
    onClick={() => {
      setAttachMenuOpen(false);
      setTimeout(() => docInputRef.current?.click(), 50);
    }}
    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
                        <FileText className="h-4 w-4 text-blue-400" />
                        <div className="text-left">
                          <p className="text-xs font-semibold">Document</p>
                          <p className="text-[10px] text-gray-400">PDF / Doc / Sheet</p>
                        </div>
                      </button>

                      <div className="my-1 border-t border-gray-50" />

                      {
    /* Poll */
  }
                      <button
    onClick={() => {
      setPollOpen(true);
      setAttachMenuOpen(false);
    }}
    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
                        <BarChart2 className="h-4 w-4 text-[#162E93]" />
                        <div className="text-left">
                          <p className="text-xs font-semibold">Poll</p>
                          <p className="text-[10px] text-gray-400">Create a poll</p>
                        </div>
                      </button>

                      {
    /* Recent Shared Media */
  }
                      <button
    onClick={() => {
      setRecentMediaOpen(true);
      setAttachMenuOpen(false);
    }}
    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
                        <Clock className="h-4 w-4 text-[#088395]" />
                        <div className="text-left">
                          <p className="text-xs font-semibold">Recent Media</p>
                          <p className="text-[10px] text-gray-400">Recently shared files</p>
                        </div>
                      </button>
                    </div>
                  </>}
              </div>

              {
    /* Message input */
  }
              <Input
    placeholder={`Message ${selectedChat.type === "channel" ? `# ${selectedChat.name}` : selectedChat.name}\u2026`}
    value={messageInput}
    onChange={(e) => setMessageInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }}
    className="flex-1 rounded-xl border-gray-200 bg-gray-50 h-9"
  />

              {
    /* Emoji button */
  }
              <div className="relative">
                <button
    onClick={(e) => {
      e.stopPropagation();
      setInputEmojiOpen(!inputEmojiOpen);
      setAttachMenuOpen(false);
    }}
    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-amber-500 transition-colors"
    title="Emoji"
  >
                  <Smile className="h-4 w-4" />
                </button>
                {inputEmojiOpen && <>
                    <div className="fixed inset-0 z-30" onClick={() => setInputEmojiOpen(false)} />
                    <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-100 rounded-xl shadow-xl p-2.5 z-40 grid grid-cols-5 gap-1 w-44">
                      {EMOJIS.map((e) => <button key={e} onClick={() => {
    setMessageInput((i) => i + e);
    setInputEmojiOpen(false);
  }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-base transition-colors">
                          {e}
                        </button>)}
                    </div>
                  </>}
              </div>

              {
    /* Voice Recording icon — WhatsApp-style, next to emoji */
  }
              <button
    onClick={(e) => {
      e.stopPropagation();
      setIsRecording(true);
      setAttachMenuOpen(false);
      setInputEmojiOpen(false);
    }}
    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isRecording ? "bg-red-100 text-red-500" : "hover:bg-gray-100 text-gray-400 hover:text-red-400"}`}
    title="Voice Recording"
  >
                <Mic className="h-4 w-4" />
              </button>

              {
    /* Send button */
  }
              <button
    onClick={sendMessage}
    className="w-9 h-9 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
  >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {
    /* ════ MODALS ══════════════════════════════════════════════════════════ */
  }

      {
    /* Delete / Clear Confirm */
  }
      <DeleteConfirmModal
    open={deleteConfirmOpen}
    title={deleteType === "channel" ? "Delete Channel" : "Clear Chat"}
    message={deleteType === "channel" ? `Delete #${selectedChat.name}? This will permanently remove the channel and all its messages.` : "Clear all messages in this chat? This action cannot be undone."}
    onConfirm={deleteType === "channel" ? handleDeleteChannel : handleClearChat}
    onCancel={() => setDeleteConfirmOpen(false)}
  />

      {
    /* ── Add Channel ──────��─────────────────────────────────────────────── */
  }
      <Dialog open={addChannelOpen} onOpenChange={setAddChannelOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Create New Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Channel Type</Label>
              <Select value={newCh.type} onValueChange={(v) => setNewCh((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="rounded-xl border-gray-200 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="department"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Department Channel</div></SelectItem>
                  <SelectItem value="team"><div className="flex items-center gap-2"><Users className="h-4 w-4" />Team Channel</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Channel Name</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={newCh.name} onChange={(e) => setNewCh((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. frontend-team" className="pl-9 rounded-xl border-gray-200 h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Description (optional)</Label>
              <Textarea value={newCh.desc} onChange={(e) => setNewCh((p) => ({ ...p, desc: e.target.value }))} placeholder="What's this channel about?" rows={2} className="rounded-xl border-gray-200 resize-none text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><UserPlus className="h-3.5 w-3.5" />Add Members</Label>
              <Input placeholder="Search and add members…" className="rounded-xl border-gray-200 h-10" onChange={(e) => setMemberSearch(e.target.value)} value={memberSearch} />
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {allUsersList.filter((u) => u.toLowerCase().includes(memberSearch.toLowerCase()) && memberSearch).map((u) => <button key={u} onClick={() => setNewCh((p) => ({ ...p, members: p.members.includes(u) ? p.members.filter((m) => m !== u) : [...p.members, u] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${newCh.members.includes(u) ? "bg-[#162E93] text-white border-[#162E93]" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#162E93]/40"}`}>
                    {newCh.members.includes(u) && <CheckCircle2 className="inline h-3 w-3 mr-1" />}{u}
                  </button>)}
              </div>
              {newCh.members.length > 0 && <div className="flex flex-wrap gap-1">
                  {newCh.members.map((m) => <Badge key={m} className="text-[10px] bg-[#162E93]/10 text-[#162E93] gap-1">{m}<X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setNewCh((p) => ({ ...p, members: p.members.filter((x) => x !== m) }))} /></Badge>)}
                </div>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={() => setAddChannelOpen(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8]" onClick={handleAddChannel}>Create Channel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {
    /* ── Assign Task (with search + priority) ──────────────────────────── */
  }
      <Dialog open={assignTaskOpen} onOpenChange={setAssignTaskOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2"><ListTodo className="h-5 w-5 text-[#162E93]" />Assign to Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {assignMsg && <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">From message</p>
                <p className="text-sm text-gray-700 line-clamp-2">{assignMsg.content}</p>
              </div>}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Task Title</Label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Enter task title…" className="rounded-xl border-gray-200 h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} className="rounded-xl border-gray-200 resize-none text-sm" />
            </div>

            {
    /* Priority */
  }
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />Priority
              </Label>
              <div className="flex gap-2">
                {["High", "Medium", "Low"].map((p) => <button
    key={p}
    onClick={() => setTaskPriority(p)}
    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${taskPriority === p ? PRIORITY_COLORS[p] : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
  >
                    {p}
                  </button>)}
              </div>
            </div>

            {
    /* Search-based assignee selection */
  }
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />Assign To
                {taskAssignee && <Badge className="ml-1 bg-[#162E93]/10 text-[#162E93] text-[10px] border-0">{taskAssignee}</Badge>}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
    value={taskAssigneeSearch}
    onChange={(e) => setTaskAssigneeSearch(e.target.value)}
    placeholder="Search employees…"
    className="pl-9 rounded-xl border-gray-200 h-9 text-sm"
  />
              </div>
              <ScrollArea className="h-32 border border-gray-100 rounded-xl">
                <div className="p-1 space-y-0.5">
                  {filtAssignees.map((u) => <button
    key={u}
    onClick={() => {
      setTaskAssignee(u);
      setTaskAssigneeSearch("");
    }}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${taskAssignee === u ? "bg-[#162E93]/10 text-[#162E93] font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
  >
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="text-[9px] bg-[#088395]/20 text-[#088395]">{u.split(" ").map((w) => w[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-left">{u}</span>
                      {taskAssignee === u && <CheckCircle2 className="h-3.5 w-3.5 text-[#162E93]" />}
                    </button>)}
                  {filtAssignees.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No employees found</p>}
                </div>
              </ScrollArea>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={() => setAssignTaskOpen(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8]" onClick={handleAssignTask}>
                <ListTodo className="h-4 w-4 mr-1.5" />Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {
    /* ── Forward Message (with search) ─────────────────────────────────── */
  }
      <Dialog open={forwardOpen} onOpenChange={(v) => {
    if (!v) {
      setForwardOpen(false);
      setForwardSearch("");
      setForwardTarget("");
    }
  }}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2"><Share2 className="h-5 w-5" />Forward Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {forwardMsg && <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-600 line-clamp-2">{forwardMsg.content}</p>
              </div>}
            {
    /* Search bar for forward */
  }
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
    autoFocus
    placeholder="Search channels or employees…"
    value={forwardSearch}
    onChange={(e) => setForwardSearch(e.target.value)}
    className="pl-9 rounded-xl border-gray-200 h-9 text-sm"
  />
            </div>
            {
    /* Filtered list */
  }
            <ScrollArea className="h-52 border border-gray-100 rounded-xl">
              <div className="p-1.5 space-y-0.5">
                {filteredForwardChats.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No results for "{forwardSearch}"</p>}
                {filteredForwardChats.map((c) => <button
    key={c.id}
    onClick={() => setForwardTarget(String(c.id))}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${forwardTarget === String(c.id) ? "bg-[#162E93]/10 text-[#162E93]" : "hover:bg-gray-50 text-gray-700"}`}
  >
                    {c.type === "channel" ? <Hash className="h-3.5 w-3.5 flex-shrink-0" /> : <Avatar className="h-5 w-5 flex-shrink-0"><AvatarFallback className="text-[9px]">{c.avatar}</AvatarFallback></Avatar>}
                    <span className="flex-1 text-left truncate">{c.name}</span>
                    {c.type === "dm" && c.status && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[c.status]}`} />}
                    {forwardTarget === String(c.id) && <CheckCircle2 className="h-4 w-4 text-[#162E93]" />}
                  </button>)}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={() => {
    setForwardOpen(false);
    setForwardSearch("");
    setForwardTarget("");
  }}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8]" onClick={handleForward} disabled={!forwardTarget}>
                <Share2 className="h-4 w-4 mr-1.5" />Forward
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {
    /* ── Channel Info (professional card-style layout) ──────────────────── */
  }
      <Dialog open={channelInfoOpen} onOpenChange={setChannelInfoOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {
    /* Header banner */
  }
          <div className={`px-5 pt-6 pb-5 ${selectedChat.category === "team" ? "bg-gradient-to-br from-[#088395] to-[#0a6b79]" : selectedChat.category === "all" ? "bg-gradient-to-br from-[#1A1953] to-[#162E93]" : "bg-gradient-to-br from-[#162E93] to-[#1a36a8]"}`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                {selectedChat.type === "channel" ? <div className="text-white scale-125">
                    <CatIcon cat={selectedChat.category} />
                  </div> : <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm font-bold bg-white/30 text-white">{selectedChat.avatar}</AvatarFallback>
                  </Avatar>}
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">
                  {selectedChat.type === "channel" ? `# ${selectedChat.name}` : selectedChat.name}
                </h3>
                <p className="text-white/70 text-xs mt-0.5 capitalize">
                  {selectedChat.category === "department" ? "\u{1F3E2} Department Channel" : selectedChat.category === "team" ? "\u{1F465} Team Channel" : selectedChat.category === "all" ? "\u{1F310} Company-wide Channel" : "\u{1F4AC} Direct Message"}
                </p>
              </div>
            </div>
            {
    /* Quick stats row */
  }
            <div className="flex gap-3 mt-4">
              {[
    { label: "Members", value: String(selectedChat.memberCount ?? 1) },
    { label: "Messages", value: String(currentMsgs.length) },
    { label: "Pinned", value: pinnedMsg ? "1" : "0" }
  ].map((stat) => <div key={stat.label} className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
                  <p className="text-white font-bold text-base">{stat.value}</p>
                  <p className="text-white/60 text-[10px]">{stat.label}</p>
                </div>)}
            </div>
          </div>

          {
    /* Body */
  }
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {
    /* Details card */
  }
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Channel Details</p>
              </div>
              <div className="divide-y divide-gray-100">
                {[
    { label: "Name", value: selectedChat.type === "channel" ? `# ${selectedChat.name}` : selectedChat.name },
    { label: "Type", value: selectedChat.category ? selectedChat.category.charAt(0).toUpperCase() + selectedChat.category.slice(1) : "Direct Message" },
    { label: "Pinned Msg", value: pinnedMsg ? `"${pinnedMsg.content.slice(0, 28)}\u2026"` : "No pinned messages" }
  ].map((row) => <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">{row.label}</span>
                    <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%] truncate">{row.value}</span>
                  </div>)}
              </div>
            </div>

            {
    /* Members section */
  }
            {selectedChat.type === "channel" && (() => {
    const members = allUsersList;
    return <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Members</p>
                    <Badge className="text-[10px] bg-[#162E93]/10 text-[#162E93] border-0 rounded-full px-2">
                      {members.length}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <ScrollArea className="max-h-52">
                      <div className="divide-y divide-gray-100">
                        {members.map((name, idx) => {
      const isLead = idx === 0;
      const initials = name.split(" ").map((w) => w[0]).join("");
      const colors = [
        "bg-[#162E93]/15 text-[#162E93]",
        "bg-[#088395]/15 text-[#088395]",
        "bg-violet-100 text-violet-600",
        "bg-amber-100 text-amber-600",
        "bg-rose-100 text-rose-600"
      ];
      const colorClass = colors[idx % colors.length];
      return <div key={name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white transition-colors">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className={`text-[11px] font-semibold ${colorClass}`}>{initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                                <p className="text-[10px] text-gray-400">{isLead ? "Channel Lead" : "Member"}</p>
                              </div>
                              {isLead && <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0" title="Lead">
                                  <Crown className="h-3 w-3 text-amber-500" />
                                </div>}
                            </div>;
    })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>;
  })()}
          </div>

          {
    /* Footer */
  }
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
            <Button variant="outline" className="w-full rounded-xl border-gray-200 h-10" onClick={() => setChannelInfoOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {
    /* ── Mute Notifications Modal ──────────────────────────────────────── */
  }
      <Dialog open={muteModalOpen} onOpenChange={setMuteModalOpen}>
        <DialogContent className="sm:max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <BellOff className="h-4 w-4 text-gray-500" />Mute Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <p className="text-xs text-gray-500">Select how long to mute notifications for <strong>#{selectedChat.name}</strong>:</p>
            <div className="space-y-1.5">
              {[
    { label: "1 Hour", desc: "Until later today" },
    { label: "3 Hours", desc: "A few hours break" },
    { label: "8 Hours", desc: "Until end of day" },
    { label: "Always", desc: "Until you unmute" }
  ].map((opt) => <button
    key={opt.label}
    onClick={() => handleMute(opt.label)}
    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-[#162E93]/30 hover:bg-[#162E93]/5 text-sm text-gray-700 transition-all text-left group"
  >
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-[#162E93]">{opt.label}</p>
                    <p className="text-[11px] text-gray-400">{opt.desc}</p>
                  </div>
                  <BellOff className="h-4 w-4 text-gray-300 group-hover:text-[#162E93]" />
                </button>)}
            </div>
            <Button variant="outline" className="w-full rounded-xl border-gray-200 mt-2" onClick={() => setMuteModalOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {
    /* ── Add Members ───────────────────────────────────────────────────── */
  }
      <Dialog open={addMembersOpen} onOpenChange={setAddMembersOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2"><UserPlus className="h-5 w-5 text-[#162E93]" />Add Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members…" className="pl-9 rounded-xl border-gray-200 h-10" />
            </div>
            <ScrollArea className="h-44 border border-gray-100 rounded-xl">
              <div className="p-1.5 space-y-0.5">
                {allUsersList.filter((u) => u.toLowerCase().includes(memberSearch.toLowerCase())).map((u) => <button key={u} onClick={() => showToast(`${u} added to #${selectedChat.name}`, "success")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-[#088395]/20 text-[#088395]">{u.split(" ").map((w) => w[0]).join("")}</AvatarFallback></Avatar>
                    <span className="text-sm text-gray-700 flex-1 text-left">{u}</span>
                    <Plus className="h-3.5 w-3.5 text-gray-400" />
                  </button>)}
              </div>
            </ScrollArea>
            <Button variant="outline" className="w-full rounded-xl border-gray-200" onClick={() => {
    setAddMembersOpen(false);
    setMemberSearch("");
  }}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {
    /* ── Poll Modal ────────────────────────────────────────────────────── */
  }
      <Dialog open={pollOpen} onOpenChange={(v) => {
    if (!v) {
      setPollOpen(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
    }
  }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-[#162E93]" />Create a Poll
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {
    /* Question */
  }
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Question <span className="text-red-500">*</span></Label>
              <Input
    value={pollQuestion}
    onChange={(e) => setPollQuestion(e.target.value)}
    placeholder="Ask a question…"
    className="rounded-xl border-gray-200 h-10"
  />
            </div>

            {
    /* Options */
  }
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Options <span className="text-xs text-gray-400">(min 2)</span></Label>
              {pollOptions.map((opt, i) => <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#162E93]">{i + 1}</span>
                  </div>
                  <Input
    value={opt}
    onChange={(e) => setPollOptions((p) => p.map((o, j) => j === i ? e.target.value : o))}
    placeholder={`Option ${i + 1}`}
    className="flex-1 rounded-xl border-gray-200 h-9 text-sm"
  />
                  {pollOptions.length > 2 && <button onClick={() => setPollOptions((p) => p.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <X className="h-4 w-4" />
                    </button>}
                </div>)}
              {pollOptions.length < 6 && <button
    onClick={() => setPollOptions((p) => [...p, ""])}
    className="flex items-center gap-2 text-sm text-[#162E93] hover:text-[#1a36a8] font-medium transition-colors"
  >
                  <Plus className="h-4 w-4" />Add Option
                </button>}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={() => {
    setPollOpen(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  }}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8]" onClick={handleSendPoll}>
                <BarChart2 className="h-4 w-4 mr-1.5" />Send Poll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {
    /* ── Recent Shared Media Modal ─────────────────────────────────────── */
  }
      <Dialog open={recentMediaOpen} onOpenChange={setRecentMediaOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#088395]" />Recent Shared Media
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <p className="text-xs text-gray-400">Last 5 shared files in this conversation</p>
            <div className="space-y-2">
              {RECENT_MEDIA.map((file, i) => <button
    key={i}
    onClick={() => {
      showToast(`Opening ${file.name}\u2026`, "info");
      setRecentMediaOpen(false);
    }}
    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#088395]/30 hover:bg-[#088395]/5 transition-all text-left"
  >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {file.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                    <p className="text-[11px] text-gray-400">{file.type} · {file.size} · {file.date}</p>
                  </div>
                  <Share2 className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                </button>)}
            </div>
            <Button variant="outline" className="w-full rounded-xl border-gray-200 mt-2" onClick={() => setRecentMediaOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {
    /* ── Voice / Video Call Modal ──────────────────────────────────────── */
  }
      {callModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-72 overflow-hidden">
            <div className={`px-6 pt-8 pb-6 flex flex-col items-center gap-4 ${callModal.type === "video" ? "bg-[#1A1953]" : "bg-[#162E93]"}`}>
              {callModal.type === "video" ? <div className="w-24 h-24 rounded-2xl bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">
                  {callModal.name.slice(0, 2).toUpperCase()}
                </div> : <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                    {callModal.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute inset-0 rounded-full animate-ping bg-white/20" />
                </div>}
              <div className="text-center">
                <p className="text-white font-semibold text-lg">{callModal.name.startsWith("#") ? callModal.name : `# ${callModal.name}`}</p>
                <p className="text-white/70 text-sm mt-0.5">{callModal.type === "video" ? "Video" : "Voice"} Call • {fmtTimer(callTimer)}</p>
              </div>
            </div>
            <div className="px-6 py-5 flex items-center justify-center gap-4 bg-gray-50">
              <button
    onClick={() => setCallMuted(!callMuted)}
    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${callMuted ? "bg-red-100 text-red-500" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
    title={callMuted ? "Unmute" : "Mute"}
  >
                {callMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              {callModal.type === "video" && <button className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center transition-colors">
                  <VideoOff className="h-5 w-5" />
                </button>}
              <button
    onClick={() => {
      setCallModal(null);
      showToast("Call ended", "info");
    }}
    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
    title="End Call"
  >
                <Phone className="h-6 w-6 text-white rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>}
    </AppLayout>;
}
export {
  Chat as default
};
