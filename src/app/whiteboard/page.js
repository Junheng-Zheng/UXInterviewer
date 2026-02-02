'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Clock, House, Redo2, MessageCircleQuestionMark, Play, Pause } from 'lucide-react';
import ExcalidrawWrapper from '../Components/ExcalidrawWrapper';
import useStore from '../../store/module';
import { AudioLines, Sparkles, X, Keyboard, MousePointer2 } from 'lucide-react';
import "@excalidraw/excalidraw/index.css";

// Import exportToBlob for screenshot capture
let exportToBlob = null;
if (typeof window !== 'undefined') {
  import("@excalidraw/excalidraw").then((m) => {
    exportToBlob = m.exportToBlob;
  });
}

export default function WhiteboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get interview parameters from store
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const selectedModel = useStore((state) => state.selectedModel);
  const setEvaluation = useStore((state) => state.setEvaluation);
  
  // Get setters for restoring from localStorage
  const setDesign = useStore((state) => state.setDesign);
  const setTarget = useStore((state) => state.setTarget);
  const setTohelp = useStore((state) => state.setTohelp);
  const setSelectedModel = useStore((state) => state.setSelectedModel);
  const setScreenshot = useStore((state) => state.setScreenshot);
  
  // Get time from URL params, default to 1800 seconds (30 minutes)
  const initialTime = parseInt(searchParams.get('time') || '1800', 10);
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  
  // Excalidraw state
  // const [excalidrawJson, setExcalidrawJson] = useState({
  //   elements: [],
  //   appState: {
  //     viewBackgroundColor: "#ffffff",
  //     zenModeEnabled: true,
  //     currentItemFontFamily: 2,
  //   },
  //   files: {},
  // });
  // const [excalidrawKey, setExcalidrawKey] = useState(0); // Key to force re-render
  
  // Generate unique localStorage key for this interview session
  const getLocalStorageKey = useCallback(() => {
    return `whiteboard_${design}_${target}_${tohelp}`.replace(/\s+/g, '_');
  }, [design, target, tohelp]);
  
  // Generate localStorage key for session state (timer, conversation, etc.)
  const getSessionStorageKey = useCallback(() => {
    return `session_${design}_${target}_${tohelp}`.replace(/\s+/g, '_');
  }, [design, target, tohelp]);
  
  // Speech recognition state
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  
  // Conversation state management
  const [conversationState, setConversationState] = useState("waiting"); // "user_turn", "ai_turn", "waiting", "processing"
  const [conversationHistory, setConversationHistory] = useState([]); // Array of {role: "user"|"assistant", content: string, timestamp: Date}
  const [currentUserMessage, setCurrentUserMessage] = useState(""); // Accumulated user speech
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasPendingAudio, setHasPendingAudio] = useState(false);
  
  // Ask questions modal state
  const [showAskQuestions, setShowAskQuestions] = useState(true); // Show by default
  const [question, setQuestion] = useState('');
  
  // Home confirmation modal state
  const [showHomeModal, setShowHomeModal] = useState(false);
  
  // Restart confirmation modal state
  const [showRestartModal, setShowRestartModal] = useState(false);
  
  // Input mode state (speech or keyboard)
  const [inputMode, setInputMode] = useState('keyboard'); // 'speech' or 'keyboard'
  const [isMicActive, setIsMicActive] = useState(false);
  const [audioLevels, setAudioLevels] = useState(Array(20).fill(0));
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Audio playback
  const audioRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioUnlockedRef = useRef(false); // Track if user has interacted to unlock audio
  const pendingAudioRef = useRef(null); // Store audio URL if play was blocked
  
  // Silence detection
  const silenceTimerRef = useRef(null);
  const lastSpeechTimeRef = useRef(null);
  const conversationStateRef = useRef("waiting");
  const currentUserMessageRef = useRef("");
  const isProcessingAIRef = useRef(false);
  const isAISpeakingRef = useRef(false);
  const SILENCE_THRESHOLD_MS = 1750; // 1.75 seconds
  
  const recognitionStartTimeRef = useRef(null);
  const recognitionRef = useRef(null);
  const isRecognitionRunningRef = useRef(false);
  const excalidrawDataRef = useRef(null);
  const isSubmittedRef = useRef(false);
  const isPausedRef = useRef(false);
  const timeRemainingRef = useRef(timeRemaining);
  const interviewStartTimeRef = useRef(null); // Track when interview started
  const aiJustFinishedRef = useRef(false); // Track if AI just finished speaking

  const excalidrawAPIRef = useRef(null);
  const conversationBoxRef = useRef(null);
  const hasInitialGreetingRef = useRef(false);
  const inputModeRef = useRef(inputMode);
  const isMicActiveRef = useRef(isMicActive);
  
  // Track if localStorage has been loaded
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);
  
  // Stable initialData reference for ExcalidrawWrapper - will be set once from localStorage
  // Initialize with default empty data
  const excalidrawInitialDataRef = useRef({
    elements: [],
    appState: {
      viewBackgroundColor: "#ffffff",
      zenModeEnabled: true,
      currentItemFontFamily: 2,
    },
    files: {},
  });
  
  const [interviewerMessage, setInterviewerMessage] = useState({
    visible: "",
    fading: ""
  });

  // Stop audio playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioSourceRef.current) {
        audioSourceRef.current = null;
      }
      setIsAISpeaking(false);
    }
  };

  // Stop speech recognition safely
  const stopRecognition = () => {
    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.stop();
        isRecognitionRunningRef.current = false;
        setIsListening(false);
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
    }
  };

  // Start speech recognition safely
  const startRecognition = () => {
    const showInterview = timeRemainingRef.current > 0 && !isSubmittedRef.current && !isPausedRef.current;
    // Only start recognition if in speech mode
    if (showInterview && inputModeRef.current === 'speech' && recognitionRef.current && !isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.start();
        isRecognitionRunningRef.current = true;
        setIsListening(true);
      } catch (e) {
        console.warn("Error starting recognition:", e);
      }
    }
  };

  // Play pending audio manually (when user clicks play button)
  const playPendingAudio = async () => {
    if (pendingAudioRef.current && audioRef.current) {
      try {
        // Stop recognition before AI speaks
        stopRecognition();
        
        audioRef.current.src = pendingAudioRef.current;
        audioSourceRef.current = pendingAudioRef.current;
        setIsAISpeaking(true);
        setConversationState("ai_turn");
        setErrorMessage(null);
        setHasPendingAudio(false);
        audioUnlockedRef.current = true;
        
        await audioRef.current.play();
        pendingAudioRef.current = null;
      } catch (err) {
        console.error("Failed to play pending audio:", err);
        setErrorMessage("Failed to play audio. Please check your audio settings.");
        setIsAISpeaking(false);
        setConversationState("waiting");
        // Resume recognition on error
        startRecognition();
      }
    }
  };

  // Clean up audio and timers on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Clean up when interview is paused or submitted
  useEffect(() => {
    if (isPaused || isSubmitted) {
      stopAudio();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      setConversationState("waiting");
      setIsProcessingAI(false);
    }
  }, [isPaused, isSubmitted]);

  // Unlock audio on user click (anywhere on the page)
  useEffect(() => {
    const handleUserInteraction = async () => {
      audioUnlockedRef.current = true;
      
      // If there's pending audio, try to play it
      if (pendingAudioRef.current && audioRef.current && !isAISpeaking) {
        try {
          // Stop recognition before AI speaks
          stopRecognition();
          
          audioRef.current.src = pendingAudioRef.current;
          audioSourceRef.current = pendingAudioRef.current;
          setIsAISpeaking(true);
          setConversationState("ai_turn");
          setErrorMessage(null);
          setHasPendingAudio(false);
          
          await audioRef.current.play();
          pendingAudioRef.current = null;
        } catch (err) {
          console.error("Failed to play pending audio:", err);
          setIsAISpeaking(false);
          setConversationState("waiting");
          // Resume recognition on error
          startRecognition();
        }
      }
    };

    // Listen for clicks anywhere on the document
    document.addEventListener("click", handleUserInteraction, { once: false });
    document.addEventListener("touchstart", handleUserInteraction, { once: false });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [isAISpeaking]);

  // Generate AI response and play audio
  const generateAIResponse = async (userTranscript, isInitialGreeting = false) => {
    // Allow empty transcript only for initial greeting
    if (!isInitialGreeting && (!userTranscript || userTranscript.trim().length === 0)) {
      return;
    }

    setConversationState("processing");
    setIsProcessingAI(true);
    setErrorMessage(null);
    stopAudio(); // Stop any current audio

    try {
      // Add user message to conversation history (only if not initial greeting)
      let updatedHistory = [...conversationHistory];
      if (!isInitialGreeting && userTranscript && userTranscript.trim().length > 0) {
        const userMessage = {
          role: "user",
          content: userTranscript.trim(),
          timestamp: new Date(),
        };
        updatedHistory = [...updatedHistory, userMessage];
      }
      
      // Keep conversation history bounded (last 20 messages to avoid token limits)
      updatedHistory = updatedHistory.slice(-20);
      setConversationHistory(updatedHistory);
      
      // Clear current user message AFTER adding to history
      if (!isInitialGreeting && userTranscript && userTranscript.trim().length > 0) {
        setCurrentUserMessage("");
        currentUserMessageRef.current = "";
      }

      // Call interviewer chat API
      const response = await fetch("/api/interviewer/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: userTranscript.trim(),
          conversationHistory: updatedHistory.slice(0, -1).map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          design,
          target,
          tohelp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to generate AI response");
      }

      const data = await response.json();
      const aiResponse = data.response;

      if (!aiResponse) {
        throw new Error("No response received from AI");
      }

      // Add AI message to conversation history
      const aiMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setConversationHistory((prev) => [...prev, aiMessage]);
      
      // Update interviewer message display
      setInterviewerMessage({
        visible: aiResponse.substring(0, Math.min(50, aiResponse.length)),
        fading: aiResponse.substring(Math.min(50, aiResponse.length))
      });

      // Generate audio using TTS
      const ttsResponse = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: aiResponse,
        }),
      });

      if (!ttsResponse.ok) {
        const errorData = await ttsResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to generate audio");
      }

      const ttsData = await ttsResponse.json();
      
      if (!ttsData.audio) {
        throw new Error("No audio data received");
      }

      // Play audio
      const audioBlob = new Blob(
        [Uint8Array.from(atob(ttsData.audio), (c) => c.charCodeAt(0))],
        { type: ttsData.mimeType || "audio/mpeg" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener("ended", () => {
          setIsAISpeaking(false);
          setConversationState("waiting");
          if (audioSourceRef.current) {
            URL.revokeObjectURL(audioSourceRef.current);
            audioSourceRef.current = null;
          }
          
          // Clear any accumulated user message to prevent false triggers
          setCurrentUserMessage("");
          currentUserMessageRef.current = "";
          setInterimTranscript("");
          
          // Set flag to ignore immediate speech detection
          aiJustFinishedRef.current = true;
          
          // Add delay before resuming recognition to avoid picking up residual audio
          setTimeout(() => {
            aiJustFinishedRef.current = false;
            startRecognition();
          }, 1500); // 1.5 second delay
        });
        audioRef.current.addEventListener("error", (e) => {
          console.error("Audio playback error:", e);
          setIsAISpeaking(false);
          setConversationState("waiting");
          setErrorMessage("Failed to play audio. Please check your audio settings.");
          
          // Clear user message on error too
          setCurrentUserMessage("");
          currentUserMessageRef.current = "";
          setInterimTranscript("");
          
          // Set flag to ignore immediate speech detection
          aiJustFinishedRef.current = true;
          
          // Resume recognition with delay on error too
          setTimeout(() => {
            aiJustFinishedRef.current = false;
            startRecognition();
          }, 1500);
        });
      }

      // Clear accumulated user message before AI speaks to prevent false triggers
      setCurrentUserMessage("");
      currentUserMessageRef.current = "";
      setInterimTranscript("");
      
      // Clear any pending silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      // Stop recognition before AI speaks
      stopRecognition();
      
      audioRef.current.src = audioUrl;
      audioSourceRef.current = audioUrl;
      setIsAISpeaking(true);
      setConversationState("ai_turn");
      
      // Try to play audio - handle autoplay restrictions
      try {
        await audioRef.current.play();
        // If successful, mark audio as unlocked for future plays
        audioUnlockedRef.current = true;
        pendingAudioRef.current = null;
      } catch (playError) {
        // Autoplay was blocked - user needs to interact first
        console.warn("Audio autoplay blocked:", playError);
        setIsAISpeaking(false);
        setConversationState("waiting");
        
        // Store the audio URL so we can play it after user interaction
        pendingAudioRef.current = audioUrl;
        setHasPendingAudio(true);
        
        // Show a message that user needs to interact
        setErrorMessage("Audio ready. Click to hear the response.");
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      setErrorMessage(error.message || "An error occurred. Please try again.");
      setConversationState("waiting");
      setIsProcessingAI(false);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Handle silence detection - when user stops speaking
  const handleSilenceDetected = () => {
    // Use refs to get the latest values
    const userMsg = currentUserMessageRef.current.trim();
    const state = conversationStateRef.current;
    const processing = isProcessingAIRef.current;
    
    // Require at least 3 characters to prevent noise from triggering responses
    if (state === "user_turn" && userMsg.length >= 3 && !processing) {
      const finalTranscript = userMsg;
      setInterimTranscript("");
      generateAIResponse(finalTranscript);
    }
  };

  // Reset silence timer when speech is detected
  const resetSilenceTimer = () => {
    // Ignore speech detected immediately after AI finished speaking
    if (aiJustFinishedRef.current) {
      console.log("Ignoring speech detected immediately after AI finished");
      return;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    lastSpeechTimeRef.current = Date.now();
    
    const state = conversationStateRef.current;
    // Only set up silence timer if we're in a state where user can speak
    if (state === "waiting" || state === "user_turn") {
      setConversationState("user_turn");
      silenceTimerRef.current = setTimeout(() => {
        // Check refs again at execution time
        const currentState = conversationStateRef.current;
        const userMsg = currentUserMessageRef.current.trim();
        const processing = isProcessingAIRef.current;
        
        if (currentState === "user_turn" && userMsg.length > 0 && !processing) {
          handleSilenceDetected();
        }
      }, SILENCE_THRESHOLD_MS);
    }
  };

  // Handle ask question form submission
  const handleAskQuestion = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    console.log('Question submitted:', question);
    
    // Unlock audio on user interaction
    audioUnlockedRef.current = true;
    
    // Generate AI response with the text input
    generateAIResponse(question);
    
    setQuestion('');
    // Don't close the modal or switch modes - stay in keyboard mode
  };

  // Handle home button click
  const handleGoHome = () => {
    setShowHomeModal(true);
  };

  // Confirm going home (discard progress)
  const confirmGoHome = () => {
    // Stop all audio and recognition
    stopAudio();
    stopRecognition();
    stopMicrophone();
    
    // Clear localStorage for this session (both whiteboard and session state)
    if (design && target && tohelp) {
      const storageKey = getLocalStorageKey();
      const sessionKey = getSessionStorageKey();
      localStorage.removeItem(storageKey);
      localStorage.removeItem(sessionKey);
      console.log('Discarded whiteboard and session data');
    }
    
    // Navigate to home
    router.push('/');
  };

  // Handle restart button click
  const handleRestart = () => {
    setShowRestartModal(true);
  };

  // Confirm restart interview
  const confirmRestart = () => {
    // Stop all audio and recognition
    stopAudio();
    stopRecognition();
    stopMicrophone();
    
    // Clear localStorage for this session (both whiteboard and session state)
    if (design && target && tohelp) {
      const storageKey = getLocalStorageKey();
      const sessionKey = getSessionStorageKey();
      localStorage.removeItem(storageKey);
      localStorage.removeItem(sessionKey);
      console.log('Cleared whiteboard and session data for restart');
    }
    
    // Reset whiteboard
    // setExcalidrawJson({
    //   elements: [],
    //   appState: {
    //     viewBackgroundColor: "#ffffff",
    //     zenModeEnabled: true,
    //     currentItemFontFamily: 2,
    //   },
    //   files: {},
    // });
    // setExcalidrawKey((prev) => prev + 1);

    excalidrawAPIRef.current?.updateScene({
  elements: [],
  files: {},
  appState: {
    ...excalidrawAPIRef.current.getAppState(),
    viewBackgroundColor: "#ffffff",
    zenModeEnabled: true,
    currentItemFontFamily: 2,
  },
});


    
    // Reset timer
    setTimeRemaining(initialTime);
    setIsPaused(false);
    
    // Clear conversation history
    setConversationHistory([]);
    setCurrentUserMessage("");
    setInterimTranscript("");
    setTranscript("");
    
    // Reset AI greeting
    hasInitialGreetingRef.current = false;
    
    // Close modal
    setShowRestartModal(false);
    
    console.log('Interview restarted');
  };

  // Start microphone for voice visualization
  const startMicrophone = async () => {
    // Prevent starting if already active (check refs, not state)
    if (micStreamRef.current && audioContextRef.current && analyserRef.current) {
      console.log('Microphone already active, skipping start');
      return;
    }
    
    // Clean up any existing resources first
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    try {
      console.log('Starting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; // Higher resolution for more detail
      analyser.smoothingTimeConstant = 0.7; // Balance between smooth and responsive
      analyser.minDecibels = -90; // Capture quieter sounds
      analyser.maxDecibels = -10; // Better dynamic range
      analyserRef.current = analyser;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      setIsMicActive(true);
      console.log('Microphone started successfully, starting visualization');
      visualizeAudio();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsMicActive(false); // Reset on error
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop microphone
  const stopMicrophone = () => {
    console.log('Stopping microphone...');
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsMicActive(false);
    setAudioLevels(Array(20).fill(0));
    console.log('Microphone stopped');
  };

  // Visualize audio level
  const visualizeAudio = () => {
    if (!analyserRef.current) {
      return;
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const barCount = 20;
    
    const animate = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average audio level across all frequencies
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      const baseLevel = Math.min(1, (average / 255) * 4); // Amplify by 4x
      
      // Create symmetrical bars from center
      const mirroredBars = [];
      const halfCount = Math.floor(barCount / 2);
      
      // Create bars growing from center outward
      for (let i = 0; i < halfCount; i++) {
        // Distance from center (0 = center, increases outward)
        const distanceFromCenter = i / halfCount;
        // Apply falloff - center is full, edges diminish
        const falloff = 1 - Math.pow(distanceFromCenter, 2); // Quadratic falloff
        const level = baseLevel * falloff;
        mirroredBars.push(level);
      }
      
      // Reverse to create left side (smallest to largest)
      const leftSide = [...mirroredBars].reverse();
      // Combine: left side + right side
      const finalBars = [...leftSide, ...mirroredBars];
      
      setAudioLevels(finalBars);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (isMicActive) {
      // Stop both microphone AND speech recognition
      stopMicrophone();
      stopRecognition();
      
      // Clear any accumulated transcription
      setCurrentUserMessage("");
      currentUserMessageRef.current = "";
      setInterimTranscript("");
      
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      console.log('Muted: Stopped microphone and speech recognition');
    } else {
      // Start both microphone AND speech recognition (if in speech mode)
      startMicrophone();
      if (inputMode === 'speech') {
        setTimeout(() => {
          startRecognition();
          console.log('Unmuted: Started microphone and speech recognition');
        }, 100);
      }
    }
  };

  // Cleanup microphone on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  // Stop microphone when switching to keyboard mode
  useEffect(() => {
    if (inputMode === 'keyboard') {
      stopMicrophone();
    }
  }, [inputMode]);

  // Auto-start microphone on mount only if in speech mode
  useEffect(() => {
    const initMic = async () => {
      try {
        // Only initialize if in speech mode
        if (inputMode !== 'speech') {
          return;
        }
        
        if (micStreamRef.current || audioContextRef.current) {
          return; // Already initialized
        }
        
        console.log('Initializing microphone on mount...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyserRef.current = analyser;
        
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        setIsMicActive(true);
        console.log('Microphone initialized successfully');
        visualizeAudio();
      } catch (err) {
        console.error('Error initializing microphone:', err);
      }
    };
    
    const timer = setTimeout(initMic, 100);
    return () => clearTimeout(timer);
  }, [inputMode]); // Re-run when inputMode changes

  // Handle submit
  const handleSubmit = async () => {
    // Validate that interview parameters are set
    if (!design || !target || !tohelp) {
      alert("Interview parameters are missing. Please start the interview from the setup page.");
      router.push('/Refactor');
      return;
    }
    
    setIsPaused(true);
    setIsGrading(true);
    
    // Navigate to grading page immediately
    router.push('/grading');
    
    // Stop speech recognition and audio immediately when submitting
    stopAudio();
    stopRecognition();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  
    try {
      // Capture screenshot from Excalidraw
      let screenshotBase64 = null;
      
      // Get current Excalidraw data directly from the API (most up-to-date)
      let elements, appState;
      
      // Try to get current state from Excalidraw API first
      if (excalidrawAPIRef.current) {
        try {
          elements = excalidrawAPIRef.current.getSceneElements();
          appState = excalidrawAPIRef.current.getAppState();
          console.log("Got state from Excalidraw API:", elements.length, "elements");
        } catch (apiError) {
          console.warn("Could not get state from Excalidraw API, falling back to onChange data:", apiError);
          // Fallback to onChange data if API methods aren't available
          if (excalidrawDataRef.current) {
            ({ elements, appState } = excalidrawDataRef.current);
            console.log("Using onChange data:", elements?.length || 0, "elements");
          }
        }
      } else if (excalidrawDataRef.current) {
        // Fallback to onChange callback data if API isn't available
        ({ elements, appState } = excalidrawDataRef.current);
        console.log("Using onChange data (no API):", elements?.length || 0, "elements");
      } else {
        throw new Error("No Excalidraw data available. Please draw something first.");
      }
      
      // Filter out deleted elements (Excalidraw marks deleted elements with isDeleted: true)
      if (elements && Array.isArray(elements)) {
        elements = elements.filter(element => !element.isDeleted);
        console.log("After filtering deleted elements:", elements.length, "elements");
      }
      
      if (!elements || !Array.isArray(elements) || elements.length === 0) {
        throw new Error("Excalidraw canvas is empty. Please add some elements before submitting.");
      }
      
      // Log for debugging
      console.log("Capturing screenshot with", elements.length, "elements");

      // Wait for exportToBlob to be available if not loaded yet
      if (!exportToBlob) {
        const excalidrawModule = await import("@excalidraw/excalidraw");
        exportToBlob = excalidrawModule.exportToBlob;
      }
      
      if (!exportToBlob) {
        throw new Error("Failed to load Excalidraw export function");
      }

      try {
        // Export Excalidraw as PNG blob with proper settings
        const blob = await exportToBlob({
          elements,
          appState: {
            ...(appState || {}),
            exportBackground: true, // Ensure background is exported
            exportWithDarkMode: false, // Use light mode for consistent export
          },
          mimeType: "image/png",
        });
        
        // Validate blob size (should be at least a few KB for a real image)
        if (blob.size < 1000) {
          console.warn("Screenshot blob is suspiciously small:", blob.size, "bytes");
        }
        
        console.log("Screenshot blob size:", (blob.size / 1024).toFixed(2), "KB");
        
        // Convert blob to base64
        screenshotBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result.split(",")[1]; // Remove data:image/png;base64, prefix
            console.log("Base64 screenshot length:", base64String.length, "chars");
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (exportError) {
        console.error("Error capturing screenshot:", exportError);
        throw new Error("Failed to capture screenshot. Please try again.");
      }
      
      if (!screenshotBase64 || screenshotBase64.length < 100) {
        throw new Error("Unable to capture screenshot from Excalidraw - screenshot appears to be empty or invalid");
      }
      
      console.log("Screenshot captured successfully, base64 length:", screenshotBase64.length);
  
      // Calculate completion time (time taken to complete the submission)
      const completionTimeSeconds = initialTime - timeRemaining;
      const completionTimeMinutes = Math.floor(completionTimeSeconds / 60);
      
      // Prepare excalidraw data for saving
      const excalidrawDataToSave = {
        elements,
        appState: appState || {},
      };
  
      const response = await fetch("/api/grade-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          design,
          target,
          tohelp,
          screenshot: screenshotBase64,
          excalidrawData: excalidrawDataToSave,
          model: selectedModel,
          completionTimeSeconds: completionTimeSeconds,
          completionTimeMinutes: completionTimeMinutes,
        }),
      });
  
      const evaluation = await response.json();

      if (!response.ok) {
        // Handle rate limiting with better messaging
        if (response.status === 429) {
          const retryMessage = evaluation.retryAfter
            ? `Rate limit exceeded. Please try again in ${evaluation.retryAfter} seconds.`
            : evaluation.message || "Rate limit exceeded. Please try again in a few moments.";
          throw new Error(retryMessage);
        }
        
        // Build detailed error message
        let errorMessage = evaluation.message || evaluation.error || "Failed to grade submission";
        if (evaluation.details) {
          errorMessage += `\n\nDetails: ${evaluation.details}`;
        }
        if (evaluation.rawContent) {
          errorMessage += `\n\nRaw response preview: ${evaluation.rawContent}`;
        }
        
        console.error("API Error Response:", evaluation);
        throw new Error(errorMessage);
      }

      console.log("Evaluation received from API:", evaluation);
      setEvaluation(evaluation);
      // Store the screenshot for display on results page
      setScreenshot(screenshotBase64);
      console.log("Screenshot stored:", screenshotBase64 ? `${screenshotBase64.substring(0, 50)}...` : "null");
      console.log("Evaluation complete - grading page will automatically update");
      
      // Clear localStorage for this session after successful submission
      if (design && target && tohelp) {
        const storageKey = getLocalStorageKey();
        const sessionKey = getSessionStorageKey();
        localStorage.removeItem(storageKey);
        localStorage.removeItem(sessionKey);
        console.log('Cleared interview data from localStorage after successful submission');
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      alert(error.message || "Failed to grade submission. Please try again.");
    } finally {
      setIsGrading(false);
    }
  };

  // Load test JSON into Excalidraw
const loadTestJSON = async () => {
  try {
    const response = await fetch("/test-excalidraw.json");
    const data = await response.json();

    if (!data.elements || !Array.isArray(data.elements)) {
      alert("Invalid Excalidraw JSON");
      return;
    }

    excalidrawAPIRef.current?.updateScene({
      elements: data.elements,
      files: data.files || {},
      appState: {
        ...excalidrawAPIRef.current.getAppState(),
        ...data.appState,
        scrollToContent: true,
        zoomToFitOnFileOpen: true,
      },
    });
  } catch (err) {
    console.error("Failed to load test JSON:", err);
  }
};


  // Update refs when state changes so event handlers can access current values
  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);
  
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    currentUserMessageRef.current = currentUserMessage;
  }, [currentUserMessage]);

  useEffect(() => {
    isProcessingAIRef.current = isProcessingAI;
  }, [isProcessingAI]);

  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
  }, [isAISpeaking]);

  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);

  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0 || isPaused || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isPaused, isSubmitted]);

  // Save interview parameters to localStorage when they change
  useEffect(() => {
    if (design && target && tohelp) {
      const interviewParams = { design, target, tohelp, selectedModel };
      localStorage.setItem('current_interview_params', JSON.stringify(interviewParams));
      console.log('Saved interview parameters to localStorage');
    }
  }, [design, target, tohelp, selectedModel]);

  // Load interview parameters from localStorage on mount if missing from store
  useEffect(() => {
    if (!design || !target || !tohelp) {
      const savedParams = localStorage.getItem('current_interview_params');
      
      if (savedParams) {
        try {
          const params = JSON.parse(savedParams);
          console.log('Loaded interview parameters from localStorage:', params);
          
          // Restore to Zustand store
          if (params.design) setDesign(params.design);
          if (params.target) setTarget(params.target);
          if (params.tohelp) setTohelp(params.tohelp);
          if (params.selectedModel) setSelectedModel(params.selectedModel);
          
          // Don't show warning if we restored from localStorage
          return;
        } catch (error) {
          console.error('Error loading interview parameters:', error);
        }
      }
      
      // If still no params after trying localStorage, show warning
      console.warn("Interview parameters missing:", { design, target, tohelp });
      const timer = setTimeout(() => {
        if (confirm("Interview parameters are missing. Would you like to go to the setup page?")) {
          router.push('/Refactor');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Load whiteboard data from localStorage on mount - BEFORE rendering ExcalidrawWrapper
  useEffect(() => {
    console.log('📂 Load whiteboard effect running:', {
      isLocalStorageLoaded,
      hasDesign: !!design,
      hasTarget: !!target,
      hasTohelp: !!tohelp
    });
    
    // Only run once when we have design params
    if (isLocalStorageLoaded) {
      console.log('⏭️ Already loaded, skipping');
      return;
    }
    
    // Wait until we have the interview params before loading
    if (!design || !target || !tohelp) {
      console.log('⏳ Waiting for interview params before loading whiteboard data');
      return;
    }
    
    // Default data structure
    const defaultData = {
      elements: [],
      appState: {
        viewBackgroundColor: "#ffffff",
        zenModeEnabled: true,
        currentItemFontFamily: 2,
      },
      files: {},
    };
    
    // Now we have params, try to load from localStorage
    const storageKey = getLocalStorageKey();
    console.log('🔍 Attempting to load whiteboard data with key:', storageKey);
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Log what we're loading
        const numElements = parsedData.elements?.length || 0;
        const numFiles = parsedData.files ? Object.keys(parsedData.files).length : 0;
        console.log('✅ Loaded whiteboard data from localStorage:', {
          key: storageKey,
          elementsCount: numElements,
          filesCount: numFiles,
          dataSize: (savedData.length / 1024).toFixed(2) + ' KB'
        });
        
        // Sanitize appState to remove/fix problematic properties
        if (parsedData.appState) {
          delete parsedData.appState.collaborators;
          delete parsedData.appState.openMenu;
          delete parsedData.appState.isLoading;
        }
        
        // Set the initialData ref with loaded data
        excalidrawInitialDataRef.current = {
          elements: parsedData.elements || [],
          appState: {
            ...defaultData.appState,
            ...(parsedData.appState || {}),
          },
          files: parsedData.files || {},
        };
        
        console.log('📦 Set initialData from localStorage with', numElements, 'elements');
      } catch (error) {
        console.error('❌ Error loading whiteboard data from localStorage:', error);
        excalidrawInitialDataRef.current = defaultData;
      }
    } else {
      console.log('ℹ️ No saved whiteboard data found, using default empty canvas');
      excalidrawInitialDataRef.current = defaultData;
    }
    
    // Mark as loaded to trigger re-render and show ExcalidrawWrapper
    setIsLocalStorageLoaded(true);
  }, [design, target, tohelp, getLocalStorageKey, isLocalStorageLoaded]);

  // Track if session state has been loaded
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // Load session state (timer, conversation, etc.) from localStorage on mount
  useEffect(() => {
    // Only run once when we have design params
    if (isSessionLoaded) return;
    
    // Wait until we have the interview params before loading
    if (!design || !target || !tohelp) {
      console.log('⏳ Waiting for interview params before loading session state');
      return;
    }
    
    // Now we have params, try to load session state
    const sessionKey = getSessionStorageKey();
    console.log('🔍 Attempting to load session state with key:', sessionKey);
    const savedSession = localStorage.getItem(sessionKey);
    
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        
        console.log('✅ Loaded session state from localStorage:', {
          key: sessionKey,
          timeRemaining: parsedSession.timeRemaining,
          conversationCount: parsedSession.conversationHistory?.length || 0,
          hasInitialGreeting: parsedSession.hasInitialGreeting,
          lastSaved: parsedSession.lastSaved ? new Date(parsedSession.lastSaved).toISOString() : 'unknown',
        });
        
        // Restore timer (only if there's meaningful time remaining)
        if (parsedSession.timeRemaining !== undefined && parsedSession.timeRemaining > 0) {
          setTimeRemaining(parsedSession.timeRemaining);
          timeRemainingRef.current = parsedSession.timeRemaining;
          console.log('⏱️ Restored timer to:', parsedSession.timeRemaining, 'seconds');
        }
        
        // Restore conversation history
        if (parsedSession.conversationHistory && Array.isArray(parsedSession.conversationHistory)) {
          // Convert timestamp strings back to Date objects
          const restoredHistory = parsedSession.conversationHistory.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
          setConversationHistory(restoredHistory);
          console.log('💬 Restored conversation history:', restoredHistory.length, 'messages');
        }
        
        // Restore current user message
        if (parsedSession.currentUserMessage) {
          setCurrentUserMessage(parsedSession.currentUserMessage);
          currentUserMessageRef.current = parsedSession.currentUserMessage;
        }
        
        // Restore input mode
        if (parsedSession.inputMode) {
          setInputMode(parsedSession.inputMode);
          inputModeRef.current = parsedSession.inputMode;
          console.log('🎤 Restored input mode:', parsedSession.inputMode);
        }
        
        // Restore initial greeting flag
        if (parsedSession.hasInitialGreeting) {
          hasInitialGreetingRef.current = true;
          console.log('👋 Initial greeting already sent, skipping');
        }
        
      } catch (error) {
        console.error('❌ Error loading session state from localStorage:', error);
      }
    } else {
      console.log('ℹ️ No saved session state found, starting fresh interview');
    }
    
    // Mark session as loaded
    setIsSessionLoaded(true);
  }, [design, target, tohelp, getSessionStorageKey, isSessionLoaded]);

  // Track last save time to debounce saves
  const saveTimeoutRef = useRef(null);

  // Function to save whiteboard data to localStorage
  const saveToLocalStorage = useCallback((elements, appState, files) => {
    console.log('📝 saveToLocalStorage called with:', {
      elementsCount: elements?.length || 0,
      filesCount: files ? Object.keys(files).length : 0,
      hasDesign: !!design,
      hasTarget: !!target,
      hasTohelp: !!tohelp
    });

    if (!design || !target || !tohelp) {
      console.warn('⚠️ Skipping save - missing interview params:', { design, target, tohelp });
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: save 1 second after last change
    saveTimeoutRef.current = setTimeout(() => {
      const storageKey = getLocalStorageKey();
      console.log('Saving to localStorage with key:', storageKey);
      
      // Sanitize appState before saving to avoid serialization issues
      const cleanAppState = appState ? { ...appState } : {};
      delete cleanAppState.collaborators; // Remove collaborators (not serializable)
      delete cleanAppState.openMenu; // Remove UI state
      delete cleanAppState.isLoading; // Remove transient state
      
      // Convert files object to a serializable format
      const serializableFiles = files ? Object.fromEntries(
        Object.entries(files).map(([key, file]) => {
          // For each file, save the essential data
          return [key, {
            mimeType: file.mimeType,
            id: file.id,
            dataURL: file.dataURL,
            created: file.created,
            lastRetrieved: file.lastRetrieved,
          }];
        })
      ) : {};
      
      const dataToSave = {
        elements,
        appState: cleanAppState,
        files: serializableFiles,
        scrollToContent: false,
      };
      
      try {
        const jsonString = JSON.stringify(dataToSave);
        localStorage.setItem(storageKey, jsonString);
        console.log('✅ Successfully saved whiteboard data to localStorage:', {
          key: storageKey,
          elementsCount: elements?.length || 0,
          filesCount: Object.keys(serializableFiles).length,
          dataSize: (jsonString.length / 1024).toFixed(2) + ' KB'
        });
      } catch (error) {
        console.error('❌ Error saving whiteboard data to localStorage:', error);
      }
    }, 1000);
  }, [design, target, tohelp, getLocalStorageKey]);

  // Track last session save time to debounce saves
  const sessionSaveTimeoutRef = useRef(null);

  // Function to save session state (timer, conversation, etc.) to localStorage
  const saveSessionToLocalStorage = useCallback(() => {
    if (!design || !target || !tohelp) {
      return;
    }

    // Clear previous timeout
    if (sessionSaveTimeoutRef.current) {
      clearTimeout(sessionSaveTimeoutRef.current);
    }

    // Debounce: save 500ms after last change
    sessionSaveTimeoutRef.current = setTimeout(() => {
      const sessionKey = getSessionStorageKey();
      
      const sessionData = {
        timeRemaining: timeRemainingRef.current,
        conversationHistory: conversationHistory,
        currentUserMessage: currentUserMessageRef.current,
        inputMode: inputModeRef.current,
        hasInitialGreeting: hasInitialGreetingRef.current,
        lastSaved: Date.now(),
      };
      
      try {
        const jsonString = JSON.stringify(sessionData);
        localStorage.setItem(sessionKey, jsonString);
        console.log('✅ Saved session state to localStorage:', {
          key: sessionKey,
          timeRemaining: sessionData.timeRemaining,
          conversationCount: sessionData.conversationHistory.length,
          hasInitialGreeting: sessionData.hasInitialGreeting,
        });
      } catch (error) {
        console.error('❌ Error saving session state to localStorage:', error);
      }
    }, 500);
  }, [design, target, tohelp, getSessionStorageKey, conversationHistory]);

  // Save session state whenever relevant state changes
  useEffect(() => {
    saveSessionToLocalStorage();
  }, [timeRemaining, conversationHistory, inputMode, saveSessionToLocalStorage]);

  // Save immediately before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force immediate save (bypass debounce) when page is closing
      if (design && target && tohelp) {
        // Save whiteboard data
        if (excalidrawDataRef.current) {
          const { elements, appState, files } = excalidrawDataRef.current;
          const storageKey = getLocalStorageKey();
          
          const cleanAppState = appState ? { ...appState } : {};
          delete cleanAppState.collaborators;
          delete cleanAppState.openMenu;
          delete cleanAppState.isLoading;
          
          const serializableFiles = files ? Object.fromEntries(
            Object.entries(files).map(([key, file]) => [key, {
              mimeType: file.mimeType,
              id: file.id,
              dataURL: file.dataURL,
              created: file.created,
              lastRetrieved: file.lastRetrieved,
            }])
          ) : {};
          
          const dataToSave = {
            elements,
            appState: cleanAppState,
            files: serializableFiles,
            scrollToContent: false,
          };
          
          try {
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            console.log('💾 Force saved whiteboard on page unload');
          } catch (error) {
            console.error('Error force saving whiteboard on unload:', error);
          }
        }
        
        // Save session state (timer, conversation, etc.)
        const sessionKey = getSessionStorageKey();
        const sessionData = {
          timeRemaining: timeRemainingRef.current,
          conversationHistory: conversationHistory,
          currentUserMessage: currentUserMessageRef.current,
          inputMode: inputModeRef.current,
          hasInitialGreeting: hasInitialGreetingRef.current,
          lastSaved: Date.now(),
        };
        
        try {
          localStorage.setItem(sessionKey, JSON.stringify(sessionData));
          console.log('💾 Force saved session state on page unload');
        } catch (error) {
          console.error('Error force saving session state on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [design, target, tohelp, getLocalStorageKey, getSessionStorageKey, conversationHistory]);

  // Auto-scroll conversation box to bottom when messages change
  useEffect(() => {
    if (conversationBoxRef.current) {
      conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;
    }
  }, [conversationHistory, currentUserMessage, interimTranscript, isProcessingAI]);

  // Generate initial AI greeting when interview starts (only if session is loaded and no previous greeting)
  useEffect(() => {
    // Wait for session to be loaded before deciding on initial greeting
    if (!isSessionLoaded) return;
    
    if (design && target && tohelp && !hasInitialGreetingRef.current) {
      hasInitialGreetingRef.current = true;
      // Small delay to let everything initialize
      const timer = setTimeout(() => {
        generateAIResponse("", true); // Empty transcript, isInitialGreeting = true
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, target, tohelp, isSessionLoaded]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn("Speech Recognition API not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        isRecognitionRunningRef.current = true;
        // Record start time when recognition begins
        if (!recognitionStartTimeRef.current) {
          recognitionStartTimeRef.current = Date.now();
        }
        setIsListening(true);
        setConversationState("waiting");
      };

      recognition.onresult = (event) => {
        // Ignore all transcription results while AI is speaking
        if (isAISpeakingRef.current || conversationStateRef.current === "ai_turn") {
          console.log("Ignoring speech recognition during AI speech");
          return;
        }
        
        let interimText = "";
        let finalText = "";
        let hasNewFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + " ";
            hasNewFinal = true;
          } else {
            interimText += transcript;
          }
        }

        // User interaction detected - unlock audio for future plays
        if (finalText || interimText) {
          audioUnlockedRef.current = true;
          
          // If there's pending audio, try to play it now
          if (pendingAudioRef.current && audioRef.current && !isAISpeaking) {
            // Stop recognition before AI speaks
            stopRecognition();
            
            audioRef.current.src = pendingAudioRef.current;
            audioSourceRef.current = pendingAudioRef.current;
            setIsAISpeaking(true);
            setConversationState("ai_turn");
            setErrorMessage(null);
            setHasPendingAudio(false);
            
            audioRef.current.play().then(() => {
              pendingAudioRef.current = null;
            }).catch((err) => {
              console.error("Failed to play pending audio:", err);
              setIsAISpeaking(false);
              setConversationState("waiting");
              // Resume recognition on error
              startRecognition();
            });
          }
        }

        // If we're in AI turn or processing, stop audio when user starts speaking
        // Only allow interruption if recognition was intentionally running (not during AI speech)
        const currentState = conversationStateRef.current;
        if ((currentState === "ai_turn" || currentState === "processing") && 
            (finalText || interimText) && 
            isRecognitionRunningRef.current) {
          stopAudio();
          setConversationState("user_turn");
          setIsProcessingAI(false);
          // Clear any pending silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
        }

        // Add final words to transcript
        if (finalText) {
          const finalTextTrimmed = finalText.trim();
          setTranscript((prev) => prev + finalTextTrimmed + " ");
          
          // Accumulate user message for conversation
          setCurrentUserMessage((prev) => {
            const updated = (prev + " " + finalTextTrimmed).trim();
            // Reset silence timer when we get final text
            if (hasNewFinal) {
              resetSilenceTimer();
            }
            return updated;
          });
        }
        
        // Update interim transcript for real-time display
        if (interimText) {
          setInterimTranscript(interimText);
          // Reset silence timer on any speech activity
          resetSilenceTimer();
        } else {
          setInterimTranscript("");
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          // Restart recognition if no speech detected, interview is active, and mic is active
          const showInterview = timeRemainingRef.current > 0 && !isSubmittedRef.current;
          if (showInterview && !isPausedRef.current && isMicActiveRef.current) {
            setTimeout(() => {
              startRecognition();
            }, 500);
          }
        } else if (event.error === "not-allowed") {
          alert("Microphone access denied. Please enable microphone permissions.");
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        // Only restart recognition if interview is still active, AI is not speaking, and mic is active
        const showInterview = timeRemainingRef.current > 0 && !isSubmittedRef.current;
        if (showInterview && !isPausedRef.current && isMicActiveRef.current) {
          setTimeout(() => {
            startRecognition();
          }, 500);
        }
      };

      recognitionRef.current = recognition;

      return () => {
        stopRecognition();
      };
    }
  }, []);

  // Always listen (start recognition when interview is active and in speech mode)
  useEffect(() => {
    if (!recognitionRef.current) return;

    const showInterview = timeRemaining > 0 && !isSubmitted;
    
    // If not in speech mode, make sure recognition is stopped
    if (inputMode !== 'speech') {
      stopRecognition();
      return;
    }
    
    // If microphone is muted, stop recognition
    if (!isMicActive) {
      stopRecognition();
      return;
    }
    
    if (showInterview && !isPaused) {
      if (isAISpeaking) {
        // Immediately stop recognition when AI starts speaking
        stopRecognition();
        // Clear any accumulated user message and interim transcript
        setCurrentUserMessage("");
        currentUserMessageRef.current = "";
        setInterimTranscript("");
        // Clear silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else {
        // Start recognition when interview is active, AI is not speaking, and mic is active
        const timeoutId = setTimeout(() => {
          // Double-check all conditions before starting
          if (!isAISpeaking && inputMode === 'speech' && isMicActive) {
            startRecognition();
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    } else {
      // Stop recognition when interview ends, is paused, or results are shown
      stopRecognition();
    }
  }, [isSubmitted, isPaused, timeRemaining, isAISpeaking, inputMode, isMicActive]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style jsx global>{`
        /* Hide scrollbar */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
        
        /* Hamburger Menu - Multiple selectors to catch it */
        .excalidraw .layer-ui__wrapper__footer-left,
        .excalidraw .layer-ui__wrapper__footer-left button,
        .excalidraw button[title="Menu"],
        .excalidraw button[aria-label="Menu"],
        .excalidraw .main-menu-trigger,
        .excalidraw .dropdown-menu-button,
        
        /* Help/Question mark */
        .excalidraw .layer-ui__wrapper__footer-right,
        .excalidraw .layer-ui__wrapper__footer-right button,
        .excalidraw button[aria-label="Help"],
        .excalidraw .help-icon,
        
        /* Library button */
        .excalidraw button[title="Library"],
        .excalidraw .library-button,
        
        /* Top corners */
        .excalidraw .layer-ui__wrapper__top-left > button:first-child,
        .excalidraw .layer-ui__wrapper__top-right {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          left: -9999px !important;
        }
        
        /* Force hide footer sections */
        .excalidraw .layer-ui__wrapper__footer {
          justify-content: center !important;
        }
      `}</style>
      <div className="relative text-sm flex w-full h-screen ">
        {/* Excalidraw Canvas - Full Screen */}
              {/* <div className = "absolute top-0 left-0 w-full flex justify-between h-full">
        {Array.from({length: 256}).map((_, index) => (
          <div key={index} className="w-px h-full bg-gray-50 rounded-full" />
        ))}
      </div> */}
      <div className = "py-9 px-6 flex flex-col gap-6 h-full border-r  border-gray-200">
    <button 
      onClick={handleGoHome}
      aria-label="Return to home (discard progress)"
      className="text-gray-700 hover:text-black transition-colors cursor-pointer"
      title="Return to home"
    >
      <House size={24} strokeWidth={1.2}/>
    </button>
    <button 
      onClick={handleRestart}
      aria-label="Restart interview"
      className="text-gray-700 hover:text-black transition-colors cursor-pointer"
      title="Restart interview"
    >
      <Redo2 size={24} strokeWidth={1.2}/>
    </button>
    {/* <MessageCircleQuestionMark size={24} strokeWidth={1.2}/> */}
  </div>
        <div className="flex-1 w-full h-full relative rounded-xl overflow-visible">
         {isLocalStorageLoaded ? (
           <ExcalidrawWrapper
             initialData={excalidrawInitialDataRef.current}
             onReady={(api) => {
               excalidrawAPIRef.current = api;
             }}
            onChange={(elements, appState, files) => {
              console.log('🔄 ExcalidrawWrapper onChange fired:', {
                elementsCount: elements?.length || 0,
                filesCount: files ? Object.keys(files).length : 0,
              });
              excalidrawDataRef.current = { elements, appState, files };
              saveToLocalStorage(elements, appState, files);
            }}
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center bg-white">
             <p className="text-black font-light text-lg">Loading whiteboard...</p>
           </div>
         )}


      <div className = "absolute h-full left-0 p-8 z-50 pointer-events-none flex-col flex justify-between top-0">
        <div className="flex  flex-col gap-2 items-start w-full">
          <div className="bg-gray-100 pl-2 pr-5 py-2 rounded-lg w-fit">
            <div className="text-base flex items-center gap-2 text-black">
              <p className="font-serif px-3 text-lg py-1 rounded-lg bg-red-100">DESIGN</p>{' '}
              <p className="font-normal">{design || 'a landing page'}</p>
            </div>
          </div>
          <div className="bg-gray-100 pl-2 pr-5 py-2 rounded-lg w-fit">
            <div className="text-base flex items-center gap-2 text-black">
              <p className="font-serif px-3 text-lg py-1 rounded-lg bg-blue-100">FOR</p>{' '}
              <p className="font-normal">{target || 'a hospital recipient page'}</p>
            </div>
          </div>
          <div className="bg-gray-100 pl-2 pr-5 py-2 rounded-lg w-fit">
              <div className="text-base flex items-center gap-2 text-black">
              <p className="font-serif px-3 text-lg py-1 rounded-lg bg-pink-100">TO HELP</p>{' '}
              <p className="font-normal">{tohelp || 'neurodivergent people'}</p>
            </div>
          </div>
        </div>

        <div className = " flex-col flex gap-3">
          <div ref={conversationBoxRef} className = "h-[200px] pointer-events-auto backdrop-blur-sm w-full bg-gray-100/50 border p-3 border-gray-100  overflow-y-auto rounded-xl z-50 flex flex-col gap-2 scrollbar-hide">
            {/* Conversation history */}
            {conversationHistory.map((msg, index) => (
              <div key={index} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-2 rounded-lg max-w-[300px] ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-black' 
                    : 'bg-white text-black'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* Current user message being typed/spoken */}
            {(currentUserMessage || interimTranscript) && (
              <div className="flex flex-col gap-1 items-end">
                <div className="px-3 py-2 rounded-lg max-w-[300px] bg-blue-100">
                  <p className="text-sm whitespace-pre-wrap">
                    {currentUserMessage} <span className="text-gray-400">{interimTranscript}</span>
                  </p>
                </div>
              </div>
            )}
            
            {/* AI processing indicator */}
            {isProcessingAI && (
              <div className="flex flex-col gap-1 items-start">
                <div className="px-3 py-2 rounded-lg bg-white text-black border border-gray-200">
                  <p className="text-sm text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Thinking...
                  </p>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {/* {errorMessage && (
              <div className="flex flex-col gap-1 items-center">
                <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200">
                  <p className="text-sm">{errorMessage}</p>
                </div>
              </div>
            )} */}
            
           
          </div>
            <div className="w-full  h-fit  gap-2 flex p-2 bg-white border border-gray-100  overflow-hidden rounded-xl z-50 ">
              {inputMode === 'keyboard' ? (
                <>
                  <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        // Unlock audio on first keypress
                        audioUnlockedRef.current = true;
                        
                        // Submit on Enter key
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAskQuestion(e);
                        }
                      }}
                      placeholder="Ask a question"
                      className="w-full rounded-lg bg-gray-50 px-3 pointer-events-auto py-2 resize-none outline-none text-sm text-black"
                    />
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleAskQuestion(e);
                    }}
                    className="px-3 py-2 pointer-events-auto text-sm bg-white border border-gray-100  text-black cursor-pointer rounded-xl hover:bg-gray-100"
                  >
                    Ask
                  </button>
                </>
              ) : (
                <>
                  {/* Wavelength Visualization */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg flex-1">
                    <div className="flex items-center justify-center gap-1 flex-1 h-full">
                      {audioLevels.map((level, i) => {
                        // Calculate distance from center for visual effect
                        const center = audioLevels.length / 2;
                        const distanceFromCenter = Math.abs(i - center) / center;
                        
                        // Height calculation - invisible when silent, tall when loud
                        const minHeight = 2;
                        const maxHeight = 1000;
                        const height = isMicActive && level > 0.01
                          ? minHeight + level * (maxHeight - minHeight)
                          : 0; // Completely invisible when silent
                        
                        // Dynamic width - center bars slightly wider
                        const width = 1 + (1 - distanceFromCenter) * 0.5;
                        
                        return (
                          <div
                            key={i}
                            className="bg-red-400 rounded-full transition-all duration-75 ease-out"
                            style={{
                              height: `${height}%`,
                              width: `${width * 4}px`,
                              opacity: level > 0.01 ? 0.5 + level * 0.5 : 0
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {/* Mic Button */}
                  <button 
                    onClick={toggleMicrophone}
                    className={`px-3 py-2 text-sm pointer-events-auto flex items-center gap-2 cursor-pointer rounded-xl transition-colors ${
                      isMicActive 
                        ? 'bg-white border border-gray-100 hover:bg-gray-100' 
                        : 'bg-red-200 hover:bg-red-300'
                    }`}
                  >
                    {isMicActive ? <Mic size={16} /> : <MicOff size={16} />}
                    {isMicActive ? 'Mute' : 'Unmute'}
                  </button>
                </>
              )}
            </div>
        <div className="items-center relative flex  w-fit h-fit rounded-xl  bg-gray-100">

           <div className = "flex w-fit p-2 px-4  font-serif text-lg bg items-center gap-2">
          Input
           </div>
            <div className = "w-px  self-stretch bg-gray-200" />

                <div className = "flex gap-2  p-2 items-center rounded-xl">
                  <button 
                    onClick={() => {
                      if (inputMode !== 'keyboard') {
                        setInputMode('keyboard');
                        setShowAskQuestions(true);
                        stopMicrophone(); // Stop mic when switching to keyboard mode
                        stopRecognition(); // Stop speech recognition when switching to keyboard mode
                        // Clear any transcription state
                        setCurrentUserMessage("");
                        currentUserMessageRef.current = "";
                        setInterimTranscript("");
                      }
                    }}
                    className={`h-full px-3 py-2 rounded-xl  pointer-events-auto gap-2 flex-nowrap cursor-pointer flex items-center justify-center ${
                      inputMode === 'keyboard' ? 'bg-red-100' : 'bg-white'
                    }`}
                  >
                    <Keyboard size={16} strokeWidth={1.2} /> Text
                  </button>
                                    <button 
                    onClick={async () => {
                      if (inputMode !== 'speech') {
                        setInputMode('speech');
                        setShowAskQuestions(true);
                        // Small delay to ensure state updates, then start mic
                        setTimeout(() => startMicrophone(), 50);
                      }
                    }}
                    className={`h-full px-3 py-2 rounded-xl pointer-events-auto gap-2 cursor-pointer flex items-center justify-center ${
                      inputMode === 'speech' ? 'bg-red-100' : 'bg-white'
                    }`}
                  >
                    <AudioLines size={16} strokeWidth={1.2} /> Speech
                  </button>

                </div>
          <div className = "w-px  self-stretch bg-gray-200" />
          <div className = "flex w-fit  p-2 items-center gap-2">
            <button className="px-3 py-2 bg-blue-100 h-fit text-black cursor-pointer pointer-events-auto flex-nowrap rounded-xl flex items-center gap-2">
              <Sparkles size={16} strokeWidth={1.2} />
            Feedback
          </button>
          </div>
      
        </div>
       
        </div>

      </div>

        </div>


      {/* Load Test Diagram Button (Top Right, left of Timer) */}
      {/* <div className="absolute top-6 right-[300px] z-50">
        <button
          onClick={loadTestJSON}
          className="flex items-center gap-2 bg-white border border-[#e4e4e4] rounded-xl px-4 py-3 hover:bg-[#f5f5f5] transition-colors"
          title="Load test diagram"
        >
          <i className="fa-solid fa-file-import text-black"></i>
          <span className="text-black font-normal text-sm">Load Test Diagram</span>
        </button>
      </div> */}

      {/* Timer (Top Right Overlay) */}
      <div className="absolute top-6 right-6 bg-white border border-[#e4e4e4] rounded-xl px-3 py-3 z-50 flex items-center gap-3">
              <button
          onClick={() => setIsPaused((prev) => !prev)}
          className="ml-2 text-black hover:text-gray-600"
        >
          {isPaused ? <Play size={16} strokeWidth={1.2} /> : <Pause size={16} strokeWidth={1.2} />}
        </button>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
          <Clock className="w-5 h-5  text-black" size={16} strokeWidth={1.3} />
        <span className={`${timeRemaining < 300 ? 'text-[#ef4444]' : 'text-black'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>

        <button
          onClick={handleSubmit}
          disabled={isGrading}
          className="px-3 py-2 bg-blue-100 rounded-lg hover:bg-blue-200  cursor-pointer transition-colors disabled:opacity-50"
        >
          {isGrading ? "Grading..." : "Submit"}
        </button>
      </div>

      {/* Interviewer Card (Bottom Left Overlay) */}

      {/* Home Confirmation Modal */}
      {showHomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowHomeModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full ">
            <div className="flex flex-col gap-6">
                            {/* Title */}
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-serif text-black">
                  Return to Home?
                </h2>
                <p className="text-base text-gray-600">
                  Your progress will not be saved and will be discarded. This action cannot be undone.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHomeModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 cursor-pointer hover:bg-gray-200 text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmGoHome}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-100 cursor-pointer hover:bg-red-200 text-black transition-colors"
                >
                  Discard & Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restart Confirmation Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowRestartModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full ">
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-serif text-black">
                  Restart Interview?
                </h2>
                <p className="text-base text-gray-600">
                  This will clear your whiteboard, reset the timer, and start fresh. Your current progress will be lost.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRestartModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 cursor-pointer hover:bg-gray-200 text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestart}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-100 cursor-pointer hover:bg-red-200 text-black transition-colors"
                >
                  Restart Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     
    </div>
    </>
  );
}


  // <div className="absolute left-3 bottom-3 w-[360px] border border-[#e4e4e4] rounded-xl p-6 bg-white/70 backdrop-blur-sm z-50 flex gap-2.5 items-start">

  //       {/* Message Content */}
  //         <div className="flex-1 font-normal gap-1 flex flex-col min-w-0">
            
  //           {/* Status indicators */}
  //           <div className="flex items-center gap-2 mt-2">
  //             {isListening && conversationState === "user_turn" && (
  //               <div className="flex items-center gap-1">
  //                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
  //                 <span className="text-xs text-gray-600">Listening</span>
  //               </div>
  //             )}
  //             {isProcessingAI && (
  //               <div className="flex items-center gap-1">
  //                 <i className="fa-solid fa-spinner fa-spin text-[#3168f5]"></i>
  //                 <span className="text-xs text-gray-600">Thinking...</span>
  //               </div>
  //             )}
  //             {hasPendingAudio && (
  //               <button
  //                 onClick={playPendingAudio}
  //                 className="px-2 py-1 bg-[#3168f5] text-white text-xs rounded hover:bg-[#2557d4]"
  //               >
  //                 <i className="fa-solid fa-play mr-1"></i>
  //                 Play Response
  //               </button>
  //             )}
  //           </div>

  //                     <h3 className="text-xl text-black font-serif">Interviewer</h3>
  //           {conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'assistant'&&  (
  //             <p className="text-sm text-black whitespace-pre-wrap">
  //               <span>{conversationHistory[conversationHistory.length - 1].content}</span>
  //             </p>
  //           )
  //           }

  //         </div>
  //     </div>
