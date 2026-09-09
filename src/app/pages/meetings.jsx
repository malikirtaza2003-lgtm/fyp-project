import { useState, useRef, useEffect, useMemo } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  MessageSquare,
  Phone,
  Plus,
  Calendar,
  Users,
  Clock,
  Send,
  Link2,
  Copy,
  CheckCircle2,
  X,
  FileText,
  AlertCircle,
  PlayCircle,
  UserPlus,
  Download,
  Film,
  FileDown
} from "lucide-react";
import { createMeeting, fetchMeetings, fetchUsers, createAnnouncement, getCachedUsers, updateMeeting } from "../utils/api";
import { getCurrentRole, getCurrentUser } from "../utils/auth";
import { showToast } from "../utils/toast";
import { getSocket } from "../utils/socket";
import { JitsiMeeting } from '@jitsi/react-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";

const INITIAL_UPCOMING = [];
const INITIAL_PAST = [];
const INVITE_BASE = "https://syncflow.app/meet/";

function genMeetingCode() {
  return Math.random().toString(36).substring(2, 10);
}

function fmtSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = s % 60;
  return h > 0 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function Meetings() {
  const userRole = getCurrentRole();
  const [upcomingList, setUpcomingList] = useState(INITIAL_UPCOMING);
  const [pastList, setPastList] = useState(INITIAL_PAST);
  const [inMeeting, setInMeeting] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(INITIAL_UPCOMING[0]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [meetingSeconds, setMeetingSeconds] = useState(0);
  const timerRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState(getCachedUsers());
  const [userSearch, setUserSearch] = useState("");
  const [invitingUsers, setInvitingUsers] = useState({});
  const [chatMsgs, setChatMsgs] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    date: "",
    time: "",
    duration: "30 min",
    participants: "",
    notes: "",
    type: "video"
  });
  const [scheduleErr, setScheduleErr] = useState("");
  const [summaryMeeting, setSummaryMeeting] = useState(null);
  const jitsiRef = useRef(null);
  const jitsiContainerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await fetchUsers();
        setAllUsers(users);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    if (inviteModalOpen) loadUsers();
  }, [inviteModalOpen]);

  const handleInviteUser = async (user) => {
    const targetId = user._id || user.id;
    if (!targetId) {
      showToast("Could not find user ID", "error");
      return;
    }

    setInvitingUsers(prev => ({ ...prev, [targetId]: true }));
    try {
      await createAnnouncement({
        title: "Meeting Invite",
        message: `${getCurrentUser()?.name} is inviting @${user.name} to a live meeting. Click to join: ${inviteLink || "/admin/meetings"}`,
        priority: "High"
      });
      showToast(`Invitation sent to ${user.name}`, "success");
    } catch (err) {
      console.error("Invite Error:", err);
      showToast(`Error: ${err.message || "Failed to send"}`, "error");
    } finally {
      setInvitingUsers(prev => ({ ...prev, [targetId]: false }));
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadData = () => {
      Promise.all([fetchMeetings(), fetchUsers()])
        .then(([items, users]) => {
          if (!mounted) return;
          const upcoming = items.filter((entry) => String(entry.status ?? "upcoming").toLowerCase() !== "past");
          const past = items.filter((entry) => String(entry.status ?? "").toLowerCase() === "past");
          setUpcomingList(upcoming);
          setPastList(past);
          setParticipants(users.slice(0, 6).map(u => ({
            id: u.id || u._id,
            name: u.name,
            avatar: (u.name || "User").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
            status: "listening",
            muted: true,
            videoOff: false
          })));
        })
        .catch(() => { });
    };

    loadData();

    const socket = getSocket();
    socket.on('receive_notification', (notif) => {
      if (notif.type === 'meeting') {
        loadData();
      }
    });

    return () => {
      mounted = false;
      socket.off('receive_notification');
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get("join");
    if (joinId) {
      const meeting = upcomingList.find(m => m.id === joinId);
      const type = params.get("type") || meeting?.type || "video";
      const meetingData = meeting || {
        id: joinId,
        title: "Direct Call",
        host: "SyncFlow User",
        type: type
      };

      startMeeting(meetingData);
      // Clear param to avoid re-joining on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [upcomingList, window.location.search]);

  useEffect(() => {
    if (inMeeting) {
      timerRef.current = setInterval(() => setMeetingSeconds((s) => s + 1), 1e3);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setMeetingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inMeeting]);

  const jitsiRoomName = useMemo(() => {
    // Standardize room name for all participants
    const id = activeMeeting?.id || activeMeeting?._id || "quick";
    return `SF${id}`.replace(/[^a-zA-Z0-9]/g, "");
  }, [activeMeeting]);

  const onApiReady = (api) => {
    jitsiRef.current = api;
    api.addEventListeners({
      videoConferenceJoined: () => {
        showToast("Meeting Connected", "success");
        setInviteLink(`https://meet.jit.si/${jitsiRoomName}`);
      },
      participantJoined: (data) => {
        setParticipants(prev => {
          if (prev.find(p => p.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            name: data.displayName || "Participant",
            avatar: (data.displayName || "P").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
            status: "connected"
          }];
        });
        showToast(`${data.displayName || "Someone"} joined the meeting`, "info");
      },
      participantLeft: (data) => {
        setParticipants(prev => prev.filter(p => p.id !== data.id));
      },
      readyToClose: () => {
        leaveMeeting();
      },
      audioMuteStatusChanged: (data) => setAudioMuted(data.muted),
      videoMuteStatusChanged: (data) => setVideoOff(data.muted),
      screenSharingStatusChanged: (data) => setScreenSharing(data.on)
    });

    // Auto-unmute video if it's a video meeting
    if (activeMeeting?.type !== "audio") {
      api.executeCommand("toggleVideo");
      setVideoOff(false);
    } else {
      setVideoOff(true);
    }
  };

  const leaveMeeting = async () => {
    let finalTranscript = transcript.trim() || "No verbal communication recorded during this session.";
    let finalSummary = "";

    // Step 1: Initialize AI processing
    showToast("Finalizing Meeting Intelligence...", "info");
    
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyBcLjUC_9jgmbAGLQxji64_mzxbkDMhiGI");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const mainPrompt = `You are a professional meeting scribe. 
      Your task is to refine the provided meeting transcript and generate a structured summary.

      TRANSCRIPT REFINEMENT RULES:
      - Fix grammar, punctuation, and capitalization.
      - Remove filler words (um, uh, like).
      - Ensure it reads professionally while preserving the original meaning.
      - Format with proper sentence structure and paragraph breaks.
      - NEVER return an empty transcript. If the input is very short, just format it neatly.

      SUMMARY GENERATION RULES:
      - Provide a clear, professional, and structured summary.
      - If the meeting is very short (even just one or two words like 'Done' or 'Hello'), create an intelligent micro-summary.
      - NEVER say "No summary available", "Not enough discussion", "Unable to summarize", or anything similar.
      - For short inputs like "Done", summarize as "The meeting concluded with confirmation that the discussed task or work was successfully completed."
      - For "Tomorrow 5 PM", summarize as "The participants discussed and scheduled the next meeting for tomorrow at 5 PM."

      Original Transcript: ${finalTranscript}

      Format your output EXACTLY as:
      TRANSCRIPT:
      [Refined Transcript]

      SUMMARY:
      [Structured Summary]`;

      try {
        // Step 2 & 3: Normal Generation & Processing
        const result = await model.generateContent(mainPrompt);
        const responseText = result.response.text();

        if (responseText.includes("TRANSCRIPT:") && responseText.includes("SUMMARY:")) {
          const parts = responseText.split("SUMMARY:");
          finalTranscript = parts[0].replace("TRANSCRIPT:", "").trim();
          finalSummary = parts[1].trim();
        } else {
          finalSummary = responseText.trim();
        }
      } catch (retryErr) {
        console.warn("AI Primary Prompt Failed, retrying with simplified prompt...", retryErr);
        // Step 4: Retry once using simplified prompt
        const simplePrompt = `Summarize this meeting briefly and professionally. Even if it's just a few words, provide a summary. Do not refuse.
        Transcript: ${finalTranscript}
        
        Format:
        TRANSCRIPT: [Cleaned text]
        SUMMARY: [Brief summary]`;
        
        try {
          const result = await model.generateContent(simplePrompt);
          const responseText = result.response.text();
          if (responseText.includes("TRANSCRIPT:") && responseText.includes("SUMMARY:")) {
            const parts = responseText.split("SUMMARY:");
            finalTranscript = parts[0].replace("TRANSCRIPT:", "").trim();
            finalSummary = parts[1].trim();
          } else {
            finalSummary = responseText.trim();
          }
        } catch (finalAiErr) {
          console.error("AI Generation failed completely:", finalAiErr);
          // Step 5: Manual fallback
          finalSummary = generateManualFallback(finalTranscript);
        }
      }
    } catch (criticalErr) {
      console.error("Critical AI Error:", criticalErr);
      finalSummary = generateManualFallback(finalTranscript);
    }

    // Final Validation: Ensure no refusal messages
    const refusalPhrases = ["not enough discussion", "unable to summarize", "insufficient content", "no summary available"];
    if (!finalSummary || refusalPhrases.some(p => finalSummary.toLowerCase().includes(p))) {
      finalSummary = generateManualFallback(finalTranscript);
    }

    // Clear persistent transcript
    localStorage.removeItem(`sf_transcript_${activeMeeting?.id || "last"}`);

    if (activeMeeting?.id && !activeMeeting.id.includes("SyncFlow-")) {
      try {
        await updateMeeting(activeMeeting.id, {
          status: "past",
          transcript: finalTranscript,
          summary: finalSummary,
          recording: !!recordedChunks.length || isRecording
        });
        setUpcomingList(prev => prev.filter(m => m.id !== activeMeeting.id));
        fetchMeetings().then(setUpcomingList).catch(() => { });
        showToast("✅ Meeting ended and AI Summary generated", "success");
      } catch (err) {
        console.error("Failed to end meeting:", err);
      }
    }

    if (isRecording) stopRecording();
    setInMeeting(false);
    setChatOpen(false);
    setScreenSharing(false);
    setTranscript("");

    if (jitsiRef.current) {
      jitsiRef.current.dispose();
      jitsiRef.current = null;
    }
  };

  useEffect(() => {
    if (inMeeting && !jitsiRef.current && window.JitsiMeetExternalAPI) {
      const domain = 'meet.jit.si';
      const options = {
        roomName: jitsiRoomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: getCurrentUser()?.name || "User"
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableWelcomePage: true,
          enableWelcomePage: false,
          enableClosePage: false,
          disableDeepLinking: true,
          doNotStoreRoom: true,
          enableInsecureRoomNameWarning: false,
          p2p: { enabled: false },
          disableSelfView: false,
          tileView: { enabled: true }
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          JITSI_WATERMARK_LINK: ' ',
          BRAND_WATERMARK_LINK: ' ',
          DEFAULT_LOGO_URL: ' ',
          DEFAULT_WELCOME_PAGE_LOGO_URL: ' ',
          HIDE_DEEP_LINKING_LOGO: true,
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'hangup', 'chat'],
          SETTINGS_SECTIONS: ['devices', 'language', 'profile'],
          VIDEO_LAYOUT_FIT: 'both',
        }
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiRef.current = api;
      onApiReady(api);

      return () => {
        if (jitsiRef.current) {
          jitsiRef.current.dispose();
          jitsiRef.current = null;
        }
      };
    }
  }, [inMeeting, jitsiRoomName]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Meeting_Recording_${activeMeeting?.title || "Meeting"}_${Date.now()}.webm`;
        a.click();
        stream.getTracks().forEach(track => track.stop());
        
        // AUTOMATIC AI PROCESSING: Send the recording to Gemini for proper transcription
        showToast("Processing recording with AI for perfect transcript...", "info");
        handleAIProcess(new File([blob], "meeting_recording.webm", { type: "video/webm" }));
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      showToast("Recording started", "success");
    } catch (err) {
      console.error("Recording error:", err);
      showToast("Recording failed: " + err.message, "error");
    }
  };

  const generateManualFallback = (text) => {
    const cleanText = (text || "").trim();
    if (!cleanText || cleanText === "No verbal communication recorded during this session.") {
      return "The meeting concluded without significant verbal discussion captured. All participants were present and the session was successfully finalized.";
    }

    if (cleanText.length < 50) {
      return `The participants held a brief discussion. Key points shared: "${cleanText}". The meeting was concluded shortly after with all items acknowledged.`;
    }

    const lines = cleanText.split(/[.!?]/).filter(l => l.trim().length > 5);
    const summaryPoints = lines
      .slice(0, 5)
      .map(l => "• " + l.trim());

    return "This meeting covered the following discussion points:\n\n" +
      (summaryPoints.length > 0 ? summaryPoints.join("\n") : `• ${cleanText}`) +
      "\n\nAction items and follow-ups were noted based on the recorded session.";
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      showToast("Recording stopped and saved", "success");
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => {
            const updated = prev + " " + finalTranscript;
            // PERSIST to localStorage so we don't lose it if the page refreshes or meeting ends abruptly
            localStorage.setItem(`sf_transcript_${activeMeeting?.id || "last"}`, updated);
            return updated;
          });
        }
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          showToast("Speech recognition permission denied", "error");
        }
      };
      recognition.onend = () => {
        if (inMeeting && recognitionRef.current) {
          try { recognition.start(); } catch (e) { }
        }
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const handleAIProcess = async (file) => {
    if (!file) return;
    setAiLoading(true);
    setAiError("");
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyBcLjUC_9jgmbAGLQxji64_mzxbkDMhiGI");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const prompt = `You are a professional meeting scribe. Please perform a deep analysis of the provided audio/video:
1. TRANSCRIPT: Provide a highly accurate, professional transcript. Fix grammar and remove fillers. 
2. SUMMARY: Provide a structured summary. 

IMPORTANT: Even if the recording is very short or contains minimal speech, you MUST generate a professional summary. NEVER say "No summary available" or "Insufficient content".

Format your entire response exactly like this:
TRANSCRIPT:
[Full refined text here]

SUMMARY:
[Detailed summary or micro-summary here]`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        }
      ]);

      const responseText = result.response.text();
      let newTranscript = "";
      let newSummary = "";

      if (responseText.includes("TRANSCRIPT:") && responseText.includes("SUMMARY:")) {
        const parts = responseText.split("SUMMARY:");
        newTranscript = parts[0].replace("TRANSCRIPT:", "").trim();
        newSummary = parts[1].trim();
      } else {
        newSummary = responseText;
        newTranscript = "Transcript was generated within the summary text.";
      }

      const updated = await updateMeeting(summaryMeeting.id || summaryMeeting._id, {
        transcript: newTranscript,
        summary: newSummary
      });

      setSummaryMeeting(updated);
      setPastList(prev => prev.map(m => (m.id === updated.id || m._id === updated._id) ? updated : m));
      showToast("AI Analysis Complete!", "success");
    } catch (err) {
      console.error("AI Error:", err);
      setAiError("Failed to process with AI. Please try again.");
      showToast("AI Processing Error", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefineTranscript = async () => {
    if (!summaryMeeting?.transcript) return;
    setAiLoading(true);
    setAiError("");
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyBcLjUC_9jgmbAGLQxji64_mzxbkDMhiGI");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are a professional meeting scribe. 
      Your task is to refine the provided meeting transcript and generate a structured summary.

      TRANSCRIPT REFINEMENT RULES:
      - Fix grammar, punctuation, and capitalization.
      - Ensure professional formatting.
      - If the input is tiny, just format it neatly.

      SUMMARY GENERATION RULES:
      - Provide a clear, professional summary.
      - If the meeting is very short, create an intelligent micro-summary.
      - NEVER say "No summary available" or "Not enough discussion".

      Transcript: ${summaryMeeting.transcript}

      Format your output EXACTLY as:
      TRANSCRIPT:
      [Refined Transcript]

      SUMMARY:
      [Structured Summary]`;

      let result;
      try {
        result = await model.generateContent(prompt);
      } catch (aiErr) {
        console.warn("Primary refinement failed, trying simple prompt...", aiErr);
        const simplePrompt = `Clean this transcript and summarize it briefly. Transcript: ${summaryMeeting.transcript}`;
        result = await model.generateContent(simplePrompt);
      }

      const responseText = result.response.text();
      let newTranscript = "";
      let newSummary = "";

      if (responseText.includes("TRANSCRIPT:") && responseText.includes("SUMMARY:")) {
        const parts = responseText.split("SUMMARY:");
        newTranscript = parts[0].replace("TRANSCRIPT:", "").trim();
        newSummary = parts[1].trim();
      } else {
        newSummary = responseText.trim();
        newTranscript = summaryMeeting.transcript;
      }

      // Manual fallback if AI still returns refusal
      if (!newSummary || newSummary.toLowerCase().includes("not enough discussion")) {
        newSummary = generateManualFallback(summaryMeeting.transcript);
      }

      const updated = await updateMeeting(summaryMeeting.id || summaryMeeting._id, {
        transcript: newTranscript,
        summary: newSummary
      });

      setSummaryMeeting(updated);
      setPastList(prev => prev.map(m => (m.id === updated.id || m._id === updated._id) ? updated : m));
      showToast("Transcript Refined!", "success");
    } catch (err) {
      console.error("AI Error:", err);
      setAiError("Failed to refine with AI.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (inMeeting) {
      initSpeechRecognition();
      return () => {
        if (jitsiRef.current) {
          jitsiRef.current.dispose();
          jitsiRef.current = null;
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, [inMeeting]);

  const [permissionError, setPermissionError] = useState(null);

  useEffect(() => {
    // Check if we are in a secure context
    if (!window.isSecureContext) {
      setPermissionError("Camera and Microphone require a secure HTTPS connection. Please check your URL.");
    }
  }, []);

  const startMeeting = async (meeting) => {
    const meetingToStart = meeting || {
      id: genMeetingCode(),
      title: "Quick Meeting",
      host: "You",
      participants: 1,
      type: "video" // Default for quick meeting
    };

    setActiveMeeting(meetingToStart);
    setInMeeting(true);
    setAudioMuted(false);
    setVideoOff(meetingToStart.type === "audio");
  };

  const sendChatMsg = () => {
    const text = chatInput.trim();
    if (!text) return;

    if (jitsiRef.current) {
      jitsiRef.current.executeCommand("sendChatMessage", text);
    }

    setChatMsgs((p) => [...p, { sender: "You", text, time: (new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }]);
    setChatInput("");
  };

  const handleScreenShare = () => {
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand("toggleShareScreen");
    } else {
      setScreenSharing((s) => !s);
      showToast(screenSharing ? "Screen sharing stopped" : "🖥️ Screen sharing started", "info");
    }
  };

  const handleInvite = () => {
    const room = jitsiRoomName || genMeetingCode();
    setInviteLink(`https://meet.jit.si/${room}`);
    setLinkCopied(false);
    setInviteOpen(true);
  };

  const copyInviteLink = () => {
    const room = jitsiRoomName || genMeetingCode();
    const link = `https://meet.jit.si/${room}`;
    navigator.clipboard?.writeText(link).catch(() => { });
    setLinkCopied(true);
    showToast("📋 Invite link copied!", "success");
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleScheduleSubmit = () => {
    setScheduleErr("");
    if (!scheduleForm.title.trim()) {
      setScheduleErr("Meeting title is required.");
      return;
    }
    if (!scheduleForm.date) {
      setScheduleErr("Please select a date.");
      return;
    }
    if (!scheduleForm.time) {
      setScheduleErr("Please select a time.");
      return;
    }
    const partList = scheduleForm.participants ? scheduleForm.participants.split(",").map((s) => s.trim()).filter(Boolean) : ["You"];
    const newMeeting = {
      title: scheduleForm.title.trim(),
      date: scheduleForm.date,
      time: scheduleForm.time,
      duration: scheduleForm.duration || "30 min",
      participantList: selectedParticipants.map(p => p.name),
      participantIds: selectedParticipants.map(p => p.id),
      notes: scheduleForm.notes || "No notes added.",
      type: scheduleForm.type,
      status: "upcoming"
    };

    createMeeting(newMeeting)
      .then(async (saved) => {
        setUpcomingList((p) => [...p, saved]);
        setScheduleOpen(false);
        setScheduleForm({ title: "", date: "", time: "", duration: "30 min", participants: "", notes: "", type: "video" });
        setSelectedParticipants([]);
        setParticipantSearch("");
        showToast("✅ \"" + newMeeting.title + "\" scheduled successfully!", "success");

        // Notify participants
        try {
          await createAnnouncement({
            title: "New Meeting Scheduled",
            message: `You are invited to: ${newMeeting.title} on ${newMeeting.date} at ${newMeeting.time}.`,
            priority: "High"
          });
        } catch (nErr) {
          console.error("Notification failed", nErr);
        }
      })
      .catch((error) => {
        showToast(error.message || "Unable to schedule meeting", "error");
      });
  };

  if (inMeeting) {
    const isInsecureIP = !window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

    return <div className="h-screen bg-[#1A1953] flex flex-col overflow-hidden">
      <style>{`
        .leftwatermark, .watermark {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `}</style>
      {isInsecureIP && (
        <div className="bg-amber-500 text-black text-[11px] py-1 px-4 text-center font-bold flex items-center justify-center gap-2">
          <AlertCircle className="h-3 w-3" />
          Browser blocked Camera/Mic/ScreenShare because you are using an IP address. Please use http://localhost:3000 instead.
        </div>
      )}
      <style>{`
        .Watermark__WatermarkContainer-sc-o9a1f6-0 {
          display: none !important;
        }
      `}</style>
      {screenSharing && <div className="flex items-center justify-center gap-2 py-2 bg-[#088395]/90 text-white text-sm font-medium">
        <Monitor className="h-4 w-4 animate-pulse" />
        You are sharing your screen
        <button onClick={handleScreenShare} className="ml-2 underline text-white/80 hover:text-white">Stop Sharing</button>
      </div>}

      <div className="px-4 py-2 bg-[#162E93] flex items-center justify-between flex-shrink-0 border-b border-white/5">
        <div>
          <h2 className="text-white text-sm font-semibold truncate max-w-[200px]">{activeMeeting?.title || "Meeting"}</h2>
          <p className="text-[10px] text-gray-400">
            {participants.length + 1} participants · {fmtSeconds(meetingSeconds)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-8 text-xs font-medium rounded-lg px-3 gap-1.5"
            onClick={handleInvite}
          >
            <Link2 className="h-3.5 w-3.5" />
            Invite
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${chatOpen ? "flex-1" : "w-full"} relative bg-black flex items-center justify-center overflow-hidden h-[calc(100vh-120px)]`}>
          {permissionError && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 text-center">
              <div className="max-w-md space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="text-white text-xl font-semibold">Media Access Blocked</h3>
                <p className="text-gray-300">{permissionError}</p>
                <Button onClick={() => window.location.reload()}>Retry Connection</Button>
              </div>
            </div>
          )}

          <div
            ref={jitsiContainerRef}
            className="w-full h-full"
            style={{ minHeight: 'calc(100vh - 160px)' }}
          >
            {/* Jitsi iframe will be injected here */}
          </div>

          {!jitsiRef.current && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4 z-10">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl bg-[#162E93] text-white">
                  {(getCurrentUser()?.name || "U").slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-lg">Initializing Meeting...</p>
            </div>
          )}
        </div>

        {chatOpen && <div className="w-72 flex flex-col border-l border-[#162E93]/60 bg-[#1A1953]/90 flex-shrink-0">
          <div className="px-4 py-3 border-b border-[#162E93]/40 flex items-center justify-between">
            <p className="text-white text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#088395]" />Meeting Chat
            </p>
            <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMsgs.map((msg, i) => <div key={i} className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}>
              {msg.sender !== "You" && <p className="text-[10px] text-gray-400 mb-0.5 px-1">{msg.sender}</p>}
              <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] ${msg.sender === "You" ? "bg-[#162E93] text-white rounded-br-sm" : "bg-white/10 text-gray-200 rounded-bl-sm"}`}>
                {msg.text}
              </div>
              <p className="text-[10px] text-gray-500 px-1 mt-0.5">{msg.time}</p>
            </div>)}
          </div>

          <div className="p-3 border-t border-[#162E93]/40 flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMsg();
                }
              }}
              placeholder="Message…"
              className="flex-1 h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-lg"
            />
            <button
              onClick={sendChatMsg}
              className="w-8 h-8 rounded-lg bg-[#088395] hover:bg-[#077080] flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>}
      </div>

      <div className="px-6 py-3 bg-[#162E93] flex items-center justify-center gap-4 flex-shrink-0 border-t border-white/5">
        <button
          onClick={() => {
            const newState = !audioMuted;
            setAudioMuted(newState);
            if (jitsiRef.current) {
              jitsiRef.current.executeCommand("toggleAudio");
            }
          }}
          title={audioMuted ? "Unmute" : "Mute"}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${audioMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          {audioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <button
          onClick={() => {
            const newState = !videoOff;
            setVideoOff(newState);
            if (jitsiRef.current) {
              jitsiRef.current.executeCommand("toggleVideo");
            }
          }}
          title={videoOff ? "Turn on camera" : "Turn off camera"}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${videoOff ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          {videoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </button>

        <button
          onClick={handleScreenShare}
          title={screenSharing ? "Stop sharing" : "Share screen"}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${screenSharing ? "bg-[#088395] text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          <Monitor className="h-4 w-4" />
          {screenSharing && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#162E93] animate-pulse" />}
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? "Stop recording" : "Start recording"}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          <Film className="h-4 w-4" />
        </button>

        <button
          onClick={() => setChatOpen(!chatOpen)}
          title="Meeting chat"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${chatOpen ? "bg-[#088395] text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          <MessageSquare className="h-4 w-4" />
          {chatMsgs.length > 2 && !chatOpen && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#162E93]" />}
        </button>

        <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
          <DialogTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
              <UserPlus className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#162E93] text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Invite Members</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Input
                placeholder="Search members..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {allUsers
                    .filter(u => u.id !== getCurrentUser()?.id)
                    .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()))
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-white/20">
                            <AvatarFallback className="bg-white/10 text-xs">
                              {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-white/50">{user.role || "Employee"}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#162E93] text-white hover:bg-[#1a36a8] hover:scale-105 active:scale-95 transition-all shadow-md rounded-full h-8 px-5 font-medium border-none"
                          disabled={invitingUsers[user._id || user.id]}
                          onClick={() => handleInviteUser(user)}
                        >
                          {invitingUsers[user._id || user.id] ? (
                            <span className="flex items-center gap-1.5">
                              <span className="h-3 w-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                              Sending...
                            </span>
                          ) : "Invite"}
                        </Button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="destructive"
          className="h-10 px-5 rounded-full font-bold gap-2 bg-red-600 hover:bg-red-700 shadow-lg active:scale-95 transition-all text-sm"
          onClick={leaveMeeting}
        >
          <Phone className="h-4 w-4 rotate-[135deg]" />
          Leave Meeting
        </Button>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-5 w-5 text-[#162E93]" />Send Invite Link
            </DialogTitle>
            <DialogDescription className="text-xs">Share this link to invite others to join the meeting.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="flex-1 text-xs text-gray-700 font-mono break-all">{inviteLink}</p>
              <button
                onClick={copyInviteLink}
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${linkCopied ? "bg-green-100 text-green-600" : "bg-[#162E93]/10 text-[#162E93] hover:bg-[#162E93]/20"}`}
                title="Copy link"
              >
                {linkCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <Button className="w-full rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-2" onClick={copyInviteLink}>
              {linkCopied ? <><CheckCircle2 className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Invite Link</>}
            </Button>
            <Button variant="outline" className="w-full rounded-xl border-gray-200" onClick={() => setInviteOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
  }

  return <AppLayout userRole={userRole}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Meetings</h1>
          <p className="text-muted-foreground">Schedule and join video meetings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => startMeeting()}>
            <Video className="h-4 w-4 mr-2" />
            Start Meeting
          </Button>
          <Button variant="outline" onClick={() => setScheduleOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingList.length})</TabsTrigger>
          <TabsTrigger value="past">Past Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingList.map((meeting) => <Card key={meeting.id}>
              <CardHeader>
                <CardTitle className="text-base">{meeting.title}</CardTitle>
                <CardDescription>Hosted by {typeof meeting.host === "object" ? (meeting.host.name ?? "Someone") : (meeting.host || "Someone")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{meeting.participants} participants</span>
                  <Badge variant="outline">{meeting.duration}</Badge>
                </div>
                {meeting.notes && <p className="text-xs text-muted-foreground line-clamp-2">{meeting.notes}</p>}
                <Button className="w-full" onClick={() => startMeeting(meeting)}>
                  {meeting.type === "audio" ? <Phone className="h-4 w-4 mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                  {meeting.type === "audio" ? "Join Audio Call" : "Join Video Meeting"}
                </Button>
              </CardContent>
            </Card>)}
            {upcomingList.length === 0 && <div className="col-span-3 text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No upcoming meetings. Schedule one above!</p>
            </div>}
          </div>
        </TabsContent>
 
        <TabsContent value="past" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastList.map((meeting) => <Card key={meeting.id}>
              <CardHeader>
                <CardTitle className="text-base">{meeting.title}</CardTitle>
                <CardDescription>Hosted by {typeof meeting.host === "object" ? (meeting.host.name ?? "Someone") : (meeting.host || "Someone")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{meeting.participants} participants</span>
                  <Badge variant="outline">{meeting.duration}</Badge>
                </div>
                {meeting.recording && <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <PlayCircle className="h-3 w-3" />Recording Available
                </Badge>}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSummaryMeeting(meeting)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Summary
                </Button>
              </CardContent>
            </Card>)}
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <Dialog open={scheduleOpen} onOpenChange={(open) => {
      setScheduleOpen(open);
      if (!open) setScheduleErr("");
    }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>Fill in the details to create a new meeting</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sch-title">Meeting Title <span className="text-red-500">*</span></Label>
            <Input
              id="sch-title"
              placeholder="e.g. Weekly Team Standup"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm((p) => ({ ...p, title: e.target.value }))}
              className="rounded-xl border-gray-200 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Meeting Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleForm(p => ({ ...p, type: "video" }))}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${scheduleForm.type === "video"
                  ? "bg-[#162E93] text-white border-[#162E93]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <Video className="h-4 w-4" /> Video Call
              </button>
              <button
                type="button"
                onClick={() => setScheduleForm(p => ({ ...p, type: "audio" }))}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${scheduleForm.type === "audio"
                  ? "bg-[#162E93] text-white border-[#162E93]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <Phone className="h-4 w-4" /> Audio Only
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sch-date">Date <span className="text-red-500">*</span></Label>
              <Input
                id="sch-date"
                type="date"
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))}
                className="rounded-xl border-gray-200 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sch-time">Time <span className="text-red-500">*</span></Label>
              <Input
                id="sch-time"
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))}
                className="rounded-xl border-gray-200 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sch-duration">Duration</Label>
            <Input
              id="sch-duration"
              placeholder="e.g. 30 min, 1 hour, 2 hours"
              value={scheduleForm.duration}
              onChange={(e) => setScheduleForm((p) => ({ ...p, duration: e.target.value }))}
              className="rounded-xl border-gray-200 h-10"
            />
          </div>

          <div className="space-y-1.5 relative">
            <Label>Participants <span className="text-red-500">*</span></Label>
            <div className="flex flex-wrap gap-1.5 p-2 min-h-[42px] bg-white border border-gray-200 rounded-xl">
              {selectedParticipants.map((p) => (
                <Badge key={p.id} variant="secondary" className="flex items-center gap-1 py-1 pl-2 pr-1 rounded-lg bg-blue-50 text-[#162E93] border-blue-100">
                  {p.name}
                  <button onClick={() => setSelectedParticipants(prev => prev.filter(x => x.id !== p.id))} className="hover:bg-blue-100 rounded-md p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm p-0.5"
                placeholder={selectedParticipants.length === 0 ? "Search employees..." : ""}
                value={participantSearch}
                onChange={(e) => {
                  setParticipantSearch(e.target.value);
                  setShowParticipantList(true);
                }}
                onFocus={() => setShowParticipantList(true)}
              />
            </div>

            {showParticipantList && (
              <div className="absolute z-[60] left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[200px] overflow-y-auto custom-scrollbar">
                {allUsers
                  .filter(u => u.name?.toLowerCase().includes(participantSearch.toLowerCase()))
                  .filter(u => !selectedParticipants.find(p => p.id === (u.id || u._id)))
                  .map(user => (
                    <div
                      key={user.id || user._id}
                      className="flex items-center gap-2 p-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        const safeName = typeof user.name === "object" ? (user.name.name ?? "Unknown") : (user.name || "Unknown");
                        setSelectedParticipants(prev => [...prev, { id: user.id || user._id, name: safeName }]);
                        setParticipantSearch("");
                        setShowParticipantList(false);
                      }}
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-blue-100 text-[#162E93]">
                          {(typeof user.name === "object" ? (user.name.name ?? "U") : (user.name || "U")).split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        <span className="text-[11px] text-gray-500 uppercase tracking-tight">{user.role || "Employee"}</span>
                      </div>
                    </div>
                  ))}
                {allUsers.filter(u => u.name?.toLowerCase().includes(participantSearch.toLowerCase())).length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">No employees found</div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sch-notes">Notes / Agenda (optional)</Label>
            <Textarea
              id="sch-notes"
              placeholder="Meeting agenda or notes…"
              rows={3}
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))}
              className="rounded-xl border-gray-200 resize-none text-sm"
            />
          </div>

          {scheduleErr && <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{scheduleErr}
          </div>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" className="rounded-xl border-gray-200" onClick={() => {
              setScheduleOpen(false);
              setScheduleErr("");
            }}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-2" onClick={handleScheduleSubmit}>
              <CheckCircle2 className="h-4 w-4" />Schedule Meeting
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={!!summaryMeeting} onOpenChange={(open) => {
      if (!open) setSummaryMeeting(null);
    }}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-[#162E93]" />Meeting Summary
          </DialogTitle>
        </DialogHeader>
        {summaryMeeting && <div className="space-y-5 mt-2">
          <div className="p-4 bg-[#162E93]/5 border border-[#162E93]/15 rounded-xl">
            <p className="text-lg font-semibold text-gray-900">{summaryMeeting.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Hosted by {typeof summaryMeeting.host === "object" ? (summaryMeeting.host.name ?? "—") : (summaryMeeting.host || "—")}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: "Date", value: summaryMeeting.date },
              { icon: Clock, label: "Time", value: summaryMeeting.time },
              { icon: Clock, label: "Duration", value: summaryMeeting.duration }
            ].map((item) => <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-xs font-semibold text-gray-800 text-center">{item.value}</p>
            </div>)}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#088395]" />
              Participants ({summaryMeeting.participants})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(summaryMeeting.participantList || []).map((p, i) => <Badge key={i} variant="secondary" className="text-xs rounded-full">{p}</Badge>)}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#088395]" />
              Notes & Description
            </p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed">
              {summaryMeeting.notes}
            </div>
          </div>

          {summaryMeeting.recording && <div>
            <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
              <Film className="h-4 w-4 text-[#088395]" />
              Recording
            </p>
            <div className="flex items-center gap-3 p-3.5 bg-[#088395]/6 border border-[#088395]/20 rounded-xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#088395]/15 flex items-center justify-center">
                <Film className="h-5 w-5 text-[#088395]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">Meeting_Recording.mp4</p>
                <p className="text-xs text-gray-400 mt-0.5">Video · MP4 · ~120 MB</p>
              </div>
              <button
                onClick={() => showToast("Downloading Meeting_Recording.mp4\u2026", "success")}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#088395] hover:bg-[#077080] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>}

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#088395]" />
              AI Summary & Transcript
            </p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap mb-3">
              {summaryMeeting.summary || "Summary generation in progress..."}
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-muted-foreground max-h-32 overflow-y-auto">
              <strong>Transcript:</strong><br />
              {summaryMeeting.transcript || "No transcript available."}
            </div>
            {summaryMeeting.transcript && !summaryMeeting.transcript.includes("AI Refined") && (
              <button
                disabled={aiLoading}
                onClick={handleRefineTranscript}
                className="mt-2 text-[10px] font-bold text-[#162E93] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" />
                Refine Transcript & Summary with AI
              </button>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
              <FileDown className="h-4 w-4 text-[#162E93]" />
              Downloads
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3.5 bg-[#162E93]/5 border border-[#162E93]/15 rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#162E93]/12 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#162E93]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">Meeting_Summary.txt</p>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([summaryMeeting.summary || ""], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Summary_${summaryMeeting.title}.txt`;
                    a.click();
                    showToast("Summary downloaded", "success");
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#162E93] hover:bg-[#1A1953] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Summary
                </button>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">Meeting_Transcript.txt</p>
                </div>
                <button
                  disabled={!summaryMeeting.transcript}
                  onClick={() => {
                    const blob = new Blob([summaryMeeting.transcript || ""], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Transcript_${summaryMeeting.title}.txt`;
                    a.click();
                    showToast("Transcript downloaded", "success");
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Transcript
                </button>
              </div>

              <Separator className="my-2" />

              <div className="p-4 bg-gradient-to-br from-[#162E93]/10 to-[#088395]/10 border border-[#162E93]/20 rounded-2xl">
                <p className="text-sm font-bold text-[#162E93] mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  AI Meeting Intelligence
                </p>
                <p className="text-xs text-gray-600 mb-0 leading-relaxed">
                  This meeting was automatically analyzed by Gemini 1.5 Flash. You can download the AI-generated results above.
                </p>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full rounded-xl border-gray-200" onClick={() => setSummaryMeeting(null)}>
            Close Summary
          </Button>
        </div>}
      </DialogContent>
    </Dialog>
  </AppLayout>;
}

export { Meetings as default };
