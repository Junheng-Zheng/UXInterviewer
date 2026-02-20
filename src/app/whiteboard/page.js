'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Clock, House, Redo2, MessageCircleQuestionMark, Play, Pause, Trash2 } from 'lucide-react';
import ExcalidrawWrapper from '../Components/ExcalidrawWrapper';
import useStore from '../../store/module';
import { AudioLines, Sparkles, X, Keyboard, MousePointer2, SplinePointer, } from 'lucide-react';
import { UserSearch, HeartHandshake } from 'lucide-react';
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
  
  // Clear whiteboard confirmation modal state
  const [showClearWhiteboardModal, setShowClearWhiteboardModal] = useState(false);
  
  // Input mode state (speech or keyboard)
  const [inputMode, setInputMode] = useState('keyboard'); // 'speech' or 'keyboard'
  const [isMicActive, setIsMicActive] = useState(false);
  const [audioLevels, setAudioLevels] = useState(Array(20).fill(0));
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const visualizationIntervalRef = useRef(null);
  const visualizationWatchdogRef = useRef(null);
  const lastVisualizationUpdateRef = useRef(null);
  
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
  const recognitionAbortedRef = useRef(false); // Track if recognition was aborted to prevent restart loop
  const excalidrawDataRef = useRef(null);
  const isSubmittedRef = useRef(false);
  const isPausedRef = useRef(false);
  const timeRemainingRef = useRef(timeRemaining);
  const interviewStartTimeRef = useRef(null); // Track when interview started
  const aiJustFinishedRef = useRef(false); // Track if AI just finished speaking

  const excalidrawAPIRef = useRef(null);
  const conversationBoxRef = useRef(null);
  const hasInitialGreetingRef = useRef(false);
  const hasCheckedContinuationRef = useRef(false);
  const inputModeRef = useRef(inputMode);
  const isMicActiveRef = useRef(isMicActive);
  
  // Track if localStorage has been loaded
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);
  
  // Stable initialData reference for ExcalidrawWrapper - will be set once from localStorage
  // Initialize with default data to prevent controlled/uncontrolled input error
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
        recognitionAbortedRef.current = false; // Clear aborted flag when intentionally stopped
      } catch (e) {
        console.warn("Error stopping recognition:", e);
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        recognitionAbortedRef.current = false;
      }
    }
  };

  // Start speech recognition safely
  const startRecognition = () => {
    const showInterview = timeRemainingRef.current > 0 && !isSubmittedRef.current && !isPausedRef.current;
    // Only start recognition if in speech mode and microphone is active
    if (showInterview && inputModeRef.current === 'speech' && isMicActiveRef.current && recognitionRef.current && !isRecognitionRunningRef.current) {
      try {
        // Clear aborted flag before starting
        recognitionAbortedRef.current = false;
        recognitionRef.current.start();
        isRecognitionRunningRef.current = true;
        setIsListening(true);
        console.log('Speech recognition started');
      } catch (e) {
        console.warn("Error starting recognition:", e);
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        // If error is because already running, mark as aborted
        if (e.message && e.message.includes('already')) {
          recognitionAbortedRef.current = true;
        }
      }
    } else {
      console.log('Speech recognition not started - conditions:', {
        showInterview,
        inputMode: inputModeRef.current,
        isMicActive: isMicActiveRef.current,
        hasRecognition: !!recognitionRef.current,
        isRunning: isRecognitionRunningRef.current
      });
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
  const generateAIResponse = useCallback(async (userTranscript, isInitialGreeting = false) => {
    // Allow empty transcript only for initial greeting
    if (!isInitialGreeting && (!userTranscript || userTranscript.trim().length === 0)) {
      return;
    }

    // Get current values from store directly (not from closure) to ensure we have latest values
    const currentDesign = useStore.getState().design;
    const currentTarget = useStore.getState().target;
    const currentTohelp = useStore.getState().tohelp;
    const currentSelectedModel = useStore.getState().selectedModel;

    // Validate required parameters before proceeding
    if (!currentDesign || !currentTarget || !currentTohelp) {
      console.warn('⚠️ Cannot generate AI response - missing interview parameters:', { 
        design: currentDesign, 
        target: currentTarget, 
        tohelp: currentTohelp 
      });
      if (isInitialGreeting) {
        // Reset flag to allow retry when params are available
        hasInitialGreetingRef.current = false;
      }
      return;
    }

    setConversationState("processing");
    setIsProcessingAI(true);
    setErrorMessage(null);
    stopAudio(); // Stop any current audio

    try {
      // Add user message to conversation history IMMEDIATELY (only if not initial greeting)
      // This ensures the message appears in the UI right away, even if API calls fail
      let updatedHistory = [...conversationHistory];
      let userMessageAdded = false;
      if (!isInitialGreeting && userTranscript && userTranscript.trim().length > 0) {
        const userMessage = {
          role: "user",
          content: userTranscript.trim(),
          timestamp: new Date(),
        };
        updatedHistory = [...updatedHistory, userMessage];
        userMessageAdded = true;
      
      // Keep conversation history bounded (last 20 messages to avoid token limits)
      updatedHistory = updatedHistory.slice(-20);
        
        // Update conversation history state synchronously
      setConversationHistory(updatedHistory);
      
        // Use a small delay to ensure state update propagates and React renders before clearing
        // This prevents the message from disappearing before it appears in history
        // Using requestAnimationFrame to ensure DOM update happens first
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Clear current user message AFTER adding to history and ensuring it's rendered
        setCurrentUserMessage("");
        currentUserMessageRef.current = "";
            setInterimTranscript("");
            console.log('✅ User message cleared from currentUserMessage (now in conversation history)');
          }, 100); // Increased delay to ensure React has rendered
        });
        
        console.log('✅ User message added to conversation history:', userTranscript.substring(0, 50));
      }

      // Get current whiteboard data - prefer API, fallback to onChange data
      let whiteboardData = null;
      if (excalidrawAPIRef.current) {
        try {
          const elements = excalidrawAPIRef.current.getSceneElements().filter(el => !el.isDeleted);
          const appState = excalidrawAPIRef.current.getAppState();
          whiteboardData = { elements, appState };
        } catch (error) {
          console.warn("Error getting whiteboard data from API, using onChange data:", error);
          whiteboardData = excalidrawDataRef.current;
        }
      } else if (excalidrawDataRef.current) {
        whiteboardData = excalidrawDataRef.current;
      }

      // Call interviewer chat API with timeout
      console.log('📤 Calling interviewer chat API...', {
        transcriptLength: userTranscript.trim().length,
        historyLength: updatedHistory.slice(0, -1).length,
        hasDesign: !!currentDesign,
        hasTarget: !!currentTarget,
        hasTohelp: !!currentTohelp,
        hasWhiteboard: !!whiteboardData
      });
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏰ Interviewer chat API request timed out after 60 seconds');
        controller.abort();
      }, 60000); // 60 second timeout
      
      const requestStartTime = Date.now();
      let response;
      try {
        console.log('📡 Sending fetch request to /api/interviewer/chat...');
        response = await fetch("/api/interviewer/chat", {
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
            design: currentDesign,
            target: currentTarget,
            tohelp: currentTohelp,
            whiteboard: whiteboardData,
          }),
          signal: controller.signal,
        });
        const requestDuration = Date.now() - requestStartTime;
        console.log(`✅ Fetch request completed in ${requestDuration}ms, status: ${response.status}`);
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStartTime;
        console.error(`❌ Fetch request failed after ${requestDuration}ms:`, fetchError);
        if (fetchError.name === 'AbortError') {
          throw new Error("Request timed out. The AI is taking too long to respond. Please try again.");
        }
        throw fetchError;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Interviewer chat API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || errorData.error || `Failed to generate AI response (${response.status})`);
      }

      console.log('✅ Interviewer chat API response received, parsing JSON...');
      const data = await response.json().catch((parseError) => {
        console.error('❌ Error parsing API response:', parseError);
        throw new Error("Invalid response from AI. Please try again.");
      });
      
      const aiResponse = data.response;
      console.log('✅ AI response received:', {
        hasResponse: !!aiResponse,
        responseLength: aiResponse?.length || 0,
        preview: aiResponse?.substring(0, 100)
      });

      if (!aiResponse) {
        console.error('❌ No response in API data:', data);
        throw new Error("No response received from AI");
      }

      // Add AI message to conversation history IMMEDIATELY
      // This ensures the response is visible even if TTS fails
      const aiMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      
      console.log('✅ Adding AI response to conversation history immediately');
      setConversationHistory((prev) => [...prev, aiMessage]);
      
      // Update interviewer message display
      setInterviewerMessage({
        visible: aiResponse.substring(0, Math.min(50, aiResponse.length)),
        fading: aiResponse.substring(Math.min(50, aiResponse.length))
      });

      // Update state to show response is ready (even before TTS)
      setConversationState("waiting");
      conversationStateRef.current = "waiting";
      setIsProcessingAI(false);
      isProcessingAIRef.current = false;

      // Generate audio using TTS with timeout (non-blocking - response already shown)
      console.log('🎤 Generating TTS audio for response:', aiResponse.substring(0, 100));
      const ttsController = new AbortController();
      const ttsTimeoutId = setTimeout(() => ttsController.abort(), 30000); // 30 second timeout for TTS
      
      let ttsResponse;
      try {
        ttsResponse = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: aiResponse,
        }),
          signal: ttsController.signal,
        });
        clearTimeout(ttsTimeoutId);
      } catch (ttsFetchError) {
        clearTimeout(ttsTimeoutId);
        console.warn('⚠️ TTS request failed, continuing without audio:', ttsFetchError);
        // Don't throw - allow response to be displayed even if TTS fails
        // Response is already in conversation history, so user can see it
        setErrorMessage("AI response received but audio generation failed. You can continue the conversation.");
        // Resume recognition so user can speak again
        setTimeout(() => {
          if (inputModeRef.current === 'speech' && isMicActiveRef.current) {
            startRecognition();
          }
        }, 1000);
        return; // Exit early, response is already in conversation history
      }

      if (!ttsResponse.ok) {
        const errorData = await ttsResponse.json().catch(() => ({}));
        console.warn('⚠️ TTS API returned error, continuing without audio:', {
          status: ttsResponse.status,
          statusText: ttsResponse.statusText,
          error: errorData
        });
        // Don't throw - response is already shown
        setErrorMessage("AI response received but audio generation failed. You can continue the conversation.");
        setTimeout(() => {
          if (inputModeRef.current === 'speech' && isMicActiveRef.current) {
            startRecognition();
          }
        }, 1000);
        return; // Exit early, response is already in conversation history
      }

      const ttsData = await ttsResponse.json();
      console.log('✅ TTS response received:', {
        hasAudio: !!ttsData.audio,
        audioLength: ttsData.audio?.length || 0,
        mimeType: ttsData.mimeType,
        size: ttsData.size
      });
      
      if (!ttsData.audio) {
        console.error('❌ TTS response missing audio data:', ttsData);
        throw new Error("No audio data received from TTS service");
      }

      // Play audio
      console.log('🔊 Creating audio blob from TTS data...');
      let audioBlob;
      try {
        audioBlob = new Blob(
        [Uint8Array.from(atob(ttsData.audio), (c) => c.charCodeAt(0))],
        { type: ttsData.mimeType || "audio/mpeg" }
      );
        console.log('✅ Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
      } catch (blobError) {
        console.error('❌ Error creating audio blob:', blobError);
        throw new Error("Failed to create audio file from TTS data");
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('✅ Audio URL created:', audioUrl.substring(0, 50) + '...');

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
        console.log('▶️ Attempting to play audio...');
        await audioRef.current.play();
        console.log('✅ Audio playback started successfully');
        // If successful, mark audio as unlocked for future plays
        audioUnlockedRef.current = true;
        pendingAudioRef.current = null;
      } catch (playError) {
        // Autoplay was blocked - user needs to interact first
        console.warn("⚠️ Audio autoplay blocked:", playError);
        console.warn("Audio error details:", {
          name: playError.name,
          message: playError.message,
          code: playError.code
        });
        setIsAISpeaking(false);
        setConversationState("waiting");
        
        // Store the audio URL so we can play it after user interaction
        pendingAudioRef.current = audioUrl;
        setHasPendingAudio(true);
        
        // Show a message that user needs to interact
        setErrorMessage("Audio ready. Click anywhere to hear the response.");
      }
    } catch (error) {
      console.error("❌ Error generating AI response:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      let userFriendlyMessage = error.message || "An error occurred. Please try again.";
      
      // Check if it's a timeout error
      if (error.message.includes("timed out") || error.message.includes("timeout")) {
        userFriendlyMessage = "The AI is taking too long to respond. Please try speaking again.";
      } else if (error.message.includes("TTS") || error.message.includes("audio") || error.message.includes("11Labs")) {
        userFriendlyMessage = `TTS Error: ${error.message}. The conversation will continue without audio.`;
      } else if (error.message.includes("Failed to generate audio")) {
        userFriendlyMessage = `Audio generation failed: ${error.message}. The conversation will continue without audio.`;
      }
      
      setErrorMessage(userFriendlyMessage);
      setConversationState("waiting");
      conversationStateRef.current = "waiting";
      setIsProcessingAI(false);
      isProcessingAIRef.current = false;
      
      // Resume recognition so user can try again
      setTimeout(() => {
        if (inputModeRef.current === 'speech' && isMicActiveRef.current && !isAISpeakingRef.current) {
          startRecognition();
          console.log('🔄 Resumed speech recognition after error');
        }
      }, 1000);
      
      // If initial greeting failed, reset flag to allow retry
      if (isInitialGreeting) {
        console.log('🔄 Initial greeting failed, will retry...');
        hasInitialGreetingRef.current = false;
      }
    } finally {
      // Ensure processing state is cleared even if there was an early return
      setIsProcessingAI(false);
      isProcessingAIRef.current = false;
    }
  }, [conversationHistory]); // design, target, tohelp removed - we get them directly from store when called

  // Handle silence detection - when user stops speaking
  const handleSilenceDetected = () => {
    // Use refs to get the latest values
    const userMsg = currentUserMessageRef.current.trim();
    const state = conversationStateRef.current;
    const processing = isProcessingAIRef.current;
    
    console.log('🔊 handleSilenceDetected called:', {
      userMsg: userMsg.substring(0, 50),
      userMsgLength: userMsg.length,
      state,
      processing,
      isAISpeaking: isAISpeakingRef.current
    });
    
    // Require at least 3 characters to prevent noise from triggering responses
    if (state === "user_turn" && userMsg.length >= 3 && !processing && !isAISpeakingRef.current) {
      const finalTranscript = userMsg;
      setInterimTranscript("");
      console.log('✅ Conditions met! Generating AI response for:', finalTranscript.substring(0, 50));
      
      // DON'T clear the message here - let generateAIResponse handle it after adding to history
      // This ensures the message stays visible until it's in the conversation history
      
      // Set state to processing to prevent duplicate triggers
      setConversationState("processing");
      conversationStateRef.current = "processing";
      setIsProcessingAI(true);
      isProcessingAIRef.current = true;
      
      generateAIResponse(finalTranscript).catch((error) => {
        console.error('❌ Error in generateAIResponse from handleSilenceDetected:', error);
        // Show error message to user
        setErrorMessage(error.message || "Failed to generate AI response. Please try again.");
        // Reset state on error so user can try again
        setConversationState("waiting");
        conversationStateRef.current = "waiting";
        setIsProcessingAI(false);
        isProcessingAIRef.current = false;
        // Resume recognition so user can speak again
        setTimeout(() => {
          if (inputModeRef.current === 'speech' && isMicActiveRef.current) {
            startRecognition();
          }
        }, 1000);
      });
    } else {
      console.log('⚠️ Silence detected but conditions not met:', {
        state,
        expectedState: "user_turn",
        stateMatch: state === "user_turn",
        userMsgLength: userMsg.length,
        minLength: 3,
        lengthOk: userMsg.length >= 3,
        processing,
        isAISpeaking: isAISpeakingRef.current,
        allConditions: state === "user_turn" && userMsg.length >= 3 && !processing && !isAISpeakingRef.current
      });
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
    console.log('🔄 resetSilenceTimer called, current state:', state);
    
    // Always allow user to speak - if state is invalid or unexpected, reset to "waiting" first
    // This ensures silence timer works even after page reload when state might not be properly initialized
    if (state !== "waiting" && state !== "user_turn" && state !== "processing" && state !== "ai_turn") {
      console.log('⚠️ Invalid conversation state detected:', state, '- resetting to "waiting"');
      setConversationState("waiting");
      conversationStateRef.current = "waiting";
    }
    
    // Only set up silence timer if we're in a state where user can speak
    // Also allow if state is "processing" or "ai_turn" (user can interrupt)
    const currentState = conversationStateRef.current;
    if (currentState === "waiting" || currentState === "user_turn" || currentState === "processing" || currentState === "ai_turn") {
      // If AI is speaking or processing, stop it and switch to user turn
      if (currentState === "ai_turn" || currentState === "processing") {
        stopAudio();
        setIsProcessingAI(false);
      setConversationState("user_turn");
        conversationStateRef.current = "user_turn";
        console.log('✅ Set conversation state to user_turn (interrupted AI), starting silence timer');
      } else if (currentState !== "user_turn") {
        // Only update state if it's not already "user_turn" to avoid unnecessary re-renders
        setConversationState("user_turn");
        conversationStateRef.current = "user_turn";
        console.log('✅ Set conversation state to user_turn, starting silence timer');
      } else {
        // State is already "user_turn", just reset the timer (no state update needed)
        console.log('✅ Resetting silence timer (state already user_turn)');
      }
      
      console.log('⏰ Setting up silence timer, will fire in', SILENCE_THRESHOLD_MS, 'ms');
      silenceTimerRef.current = setTimeout(() => {
        // Check refs again at execution time
        const timerState = conversationStateRef.current;
        const userMsg = currentUserMessageRef.current.trim();
        const processing = isProcessingAIRef.current;
        const aiSpeaking = isAISpeakingRef.current;
        
        console.log('⏰ Silence timer FIRED:', {
          timerState,
          userMsgLength: userMsg.length,
          userMsgPreview: userMsg.substring(0, 50),
          processing,
          aiSpeaking,
          timerId: silenceTimerRef.current
        });
        
        // Only trigger if we have a meaningful message (at least 3 chars) and we're in user_turn state
        if (timerState === "user_turn" && userMsg.length >= 3 && !processing && !aiSpeaking) {
          console.log('✅ Timer conditions met, calling handleSilenceDetected');
          handleSilenceDetected();
        } else {
          console.log('⚠️ Silence timer fired but conditions not met for response:', {
            state: timerState,
            expectedState: "user_turn",
            stateMatch: timerState === "user_turn",
            msgLength: userMsg.length,
            minLength: 3,
            lengthOk: userMsg.length >= 3,
            processing,
            aiSpeaking,
            allConditions: timerState === "user_turn" && userMsg.length >= 3 && !processing && !aiSpeaking
          });
        }
      }, SILENCE_THRESHOLD_MS);
      
      console.log('✅ Silence timer set up with ID:', silenceTimerRef.current);
    } else {
      console.log('⚠️ Cannot set up silence timer, invalid state after reset:', currentState);
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
    
    // Clear localStorage for this session
    if (design && target && tohelp) {
      const storageKey = getLocalStorageKey();
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_interview_state`);
      console.log('Discarded whiteboard data and interview state');
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
    
    // Clear localStorage for this session
    if (design && target && tohelp) {
      const storageKey = getLocalStorageKey();
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_interview_state`);
      console.log('Cleared whiteboard data and interview state for restart');
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
    timeRemainingRef.current = initialTime;
    setIsPaused(false);
    isPausedRef.current = false;
    
    // Clear conversation history
    setConversationHistory([]);
    setCurrentUserMessage("");
    currentUserMessageRef.current = "";
    setInterimTranscript("");
    setTranscript("");
    
    // Reset AI greeting
    hasInitialGreetingRef.current = false;
    
    // Reset continuation check
    hasCheckedContinuationRef.current = false;
    
    // Close modal
    setShowRestartModal(false);
    
    console.log('Interview restarted');
  };

  // Handle clear whiteboard button click
  const handleClearWhiteboard = () => {
    setShowClearWhiteboardModal(true);
  };

  // Confirm clear whiteboard
  const confirmClearWhiteboard = () => {
    // Clear whiteboard only (don't reset timer, conversation, etc.)
    if (excalidrawAPIRef.current) {
      const currentAppState = excalidrawAPIRef.current.getAppState();
      excalidrawAPIRef.current.updateScene({
        elements: [],
        files: {},
        appState: {
          ...currentAppState,
          viewBackgroundColor: "#ffffff",
          zenModeEnabled: true,
          currentItemFontFamily: 2,
        },
      });

      // Update ref to empty state
      excalidrawDataRef.current = {
        elements: [],
        appState: {
          ...currentAppState,
          viewBackgroundColor: "#ffffff",
          zenModeEnabled: true,
          currentItemFontFamily: 2,
        },
        files: {},
      };

      // Save empty whiteboard to localStorage
      if (design && target && tohelp) {
        const storageKey = getLocalStorageKey();
        const emptyData = {
          elements: [],
          appState: {
            ...currentAppState,
            viewBackgroundColor: "#ffffff",
            zenModeEnabled: true,
            currentItemFontFamily: 2,
          },
          files: {},
          scrollToContent: false,
        };
        
        try {
          localStorage.setItem(storageKey, JSON.stringify(emptyData));
          console.log('✅ Cleared whiteboard (preserved timer and conversation)');
        } catch (error) {
          console.error('Error saving cleared whiteboard:', error);
        }
      }
    }
    
    // Close modal
    setShowClearWhiteboardModal(false);
  };

  // Start microphone for voice visualization
  const startMicrophone = async () => {
    // Prevent starting if already active (check refs, not state)
    if (micStreamRef.current && isMicActiveRef.current) {
      console.log('Microphone already active, skipping start');
      return Promise.resolve();
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (visualizationIntervalRef.current) {
      clearInterval(visualizationIntervalRef.current);
      visualizationIntervalRef.current = null;
    }
    if (visualizationWatchdogRef.current) {
      clearInterval(visualizationWatchdogRef.current);
      visualizationWatchdogRef.current = null;
    }
    
    try {
      console.log('Starting microphone...');
      // Get microphone stream (needed for speech recognition permissions)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      setIsMicActive(true);
      isMicActiveRef.current = true;
      console.log('Microphone started successfully, starting wave decay animation');
      startWaveDecayAnimation();
      return Promise.resolve();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsMicActive(false);
      isMicActiveRef.current = false;
      alert('Could not access microphone. Please check permissions.');
      return Promise.reject(err);
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (visualizationIntervalRef.current) {
      clearInterval(visualizationIntervalRef.current);
      visualizationIntervalRef.current = null;
    }
    if (visualizationWatchdogRef.current) {
      clearInterval(visualizationWatchdogRef.current);
      visualizationWatchdogRef.current = null;
    }
    setIsMicActive(false);
    setAudioLevels(Array(20).fill(0));
    console.log('Microphone stopped');
  };

  // Trigger wave animation when transcription happens
  const triggerWaveAnimation = () => {
    // Use ref to check if mic is active (more reliable than state)
    if (!isMicActiveRef.current) return;
    
    const barCount = 20;
      const halfCount = Math.floor(barCount / 2);
      
    // Create artificial wave pattern that peaks in the center
    const mirroredBars = [];
      for (let i = 0; i < halfCount; i++) {
        const distanceFromCenter = i / halfCount;
      // Create a wave pattern with random variation for natural look
      const baseLevel = 0.7 + Math.random() * 0.3; // 0.7 to 1.0 (increased for better visibility)
      const falloff = 1 - Math.pow(distanceFromCenter, 1.3); // Gentler falloff for wider waves
        const level = baseLevel * falloff;
        mirroredBars.push(level);
      }
      
      // Reverse to create left side (smallest to largest)
      const leftSide = [...mirroredBars].reverse();
      // Combine: left side + right side
      const finalBars = [...leftSide, ...mirroredBars];
      
      setAudioLevels(finalBars);
    lastVisualizationUpdateRef.current = Date.now();
  };

  // Decay animation for waves (gradually reduce levels when no transcription)
  const startWaveDecayAnimation = () => {
    if (visualizationIntervalRef.current) {
      clearInterval(visualizationIntervalRef.current);
    }
    
    visualizationIntervalRef.current = setInterval(() => {
      if (!isMicActiveRef.current) {
        if (visualizationIntervalRef.current) {
          clearInterval(visualizationIntervalRef.current);
          visualizationIntervalRef.current = null;
        }
        setAudioLevels(Array(20).fill(0));
        return;
      }
      
      // Gradually decay the wave levels
      setAudioLevels(prevLevels => {
        const now = Date.now();
        const timeSinceLastUpdate = lastVisualizationUpdateRef.current 
          ? now - lastVisualizationUpdateRef.current 
          : Infinity;
        
        // If no transcription in the last 500ms, start decaying (increased from 300ms for better visibility)
        if (timeSinceLastUpdate > 500) {
          const decayRate = 0.92; // Decay by 8% each frame (slower decay for better visibility)
          return prevLevels.map(level => Math.max(0, level * decayRate));
        }
        
        // Otherwise maintain current levels (they'll be updated by triggerWaveAnimation)
        return prevLevels;
      });
    }, 50); // Update every 50ms for smooth decay
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
        
        if (micStreamRef.current && isMicActiveRef.current) {
          return; // Already initialized
        }
        
        console.log('Initializing microphone on mount...');
        await startMicrophone();
      } catch (err) {
        console.error('Error initializing microphone:', err);
      }
    };
    
    const timer = setTimeout(initMic, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          conversationHistory: conversationHistory, // Include conversation history/transcript
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Only run once when we have design params
    if (isLocalStorageLoaded) return;
    
    // Wait for design params to be loaded before attempting to load from localStorage
    if (!design || !target || !tohelp) {
      console.log('⏳ Waiting for interview parameters to load...');
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
    
      const storageKey = getLocalStorageKey();
      console.log('🔍 Attempting to load whiteboard data with key:', storageKey);
    console.log('📋 Current localStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('whiteboard_')));
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
          
          console.log('📦 Set initialData from localStorage');
        } catch (error) {
          console.error('❌ Error loading whiteboard data from localStorage:', error);
          excalidrawInitialDataRef.current = defaultData;
        }
      } else {
        console.log('ℹ️ No saved whiteboard data found, using default');
        excalidrawInitialDataRef.current = defaultData;
      }

    // Load interview state (timer + conversation)
    const interviewStateKey = `${storageKey}_interview_state`;
    const savedInterviewState = localStorage.getItem(interviewStateKey);
    
    if (savedInterviewState) {
      try {
        const parsedState = JSON.parse(savedInterviewState);
        console.log('✅ Loaded interview state from localStorage:', {
          timeRemaining: parsedState.timeRemaining,
          conversationCount: parsedState.conversationHistory?.length || 0
        });
        
        // Restore timer
        if (typeof parsedState.timeRemaining === 'number') {
          setTimeRemaining(parsedState.timeRemaining);
          timeRemainingRef.current = parsedState.timeRemaining;
        }
        
        // Restore paused state
        if (typeof parsedState.isPaused === 'boolean') {
          setIsPaused(parsedState.isPaused);
          isPausedRef.current = parsedState.isPaused;
        }
        
        // Restore conversation history
        if (Array.isArray(parsedState.conversationHistory)) {
          setConversationHistory(parsedState.conversationHistory);
          
          // Mark that we've already had the initial greeting
          if (parsedState.conversationHistory.length > 0) {
            hasInitialGreetingRef.current = true;
          }
          
          // CRITICAL: Clear any accumulated user message from previous session
          // This ensures silence detection works correctly after reload
          setCurrentUserMessage("");
          currentUserMessageRef.current = "";
          setInterimTranscript("");
          console.log('🧹 Cleared currentUserMessage after reload to ensure fresh start');
          
          // Ensure conversation state is set correctly based on last message
          // If last message was from assistant, set state to "waiting" so user can speak
          const lastMessage = parsedState.conversationHistory[parsedState.conversationHistory.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            setConversationState("waiting");
            conversationStateRef.current = "waiting";
            console.log('✅ Set conversation state to "waiting" after reload (last message was from assistant)');
          } else if (lastMessage && lastMessage.role === 'user') {
            // Last message was from user - will be handled by continuation logic
            setConversationState("waiting");
            conversationStateRef.current = "waiting";
            console.log('✅ Set conversation state to "waiting" after reload (last message was from user, continuation will handle)');
    } else {
            // No messages or empty history - ensure state is waiting
            setConversationState("waiting");
            conversationStateRef.current = "waiting";
            console.log('✅ Set conversation state to "waiting" after reload (no messages)');
          }
        } else {
          // No conversation history - ensure state is waiting and clear any message
          setConversationState("waiting");
          conversationStateRef.current = "waiting";
          setCurrentUserMessage("");
          currentUserMessageRef.current = "";
          setInterimTranscript("");
        }
        
        // Restore interview start time
        if (parsedState.interviewStartTime) {
          interviewStartTimeRef.current = parsedState.interviewStartTime;
        }
        
        // Restore input mode and microphone state
        if (parsedState.inputMode === 'speech' || parsedState.inputMode === 'keyboard') {
          setInputMode(parsedState.inputMode);
          inputModeRef.current = parsedState.inputMode;
        }
        
        if (typeof parsedState.isMicActive === 'boolean') {
          setIsMicActive(parsedState.isMicActive);
          isMicActiveRef.current = parsedState.isMicActive;
        }
      } catch (error) {
        console.error('❌ Error loading interview state from localStorage:', error);
      }
    } else {
      console.log('ℹ️ No saved interview state found, starting fresh');
    }
    
    // Mark as loaded to trigger re-render and show ExcalidrawWrapper
    setIsLocalStorageLoaded(true);
    console.log('✅ localStorage loading complete');
  }, [design, target, tohelp, getLocalStorageKey, isLocalStorageLoaded]);
  
  // Restore speech mode after state is loaded from localStorage
  useEffect(() => {
    // Only restore if localStorage was loaded and we have interview state
    if (!isLocalStorageLoaded || !design || !target || !tohelp) {
      return;
    }
    
    // Ensure conversation state is properly initialized before restoring speech
    // This is critical for silence detection to work after reload
    if (conversationStateRef.current !== "waiting" && conversationStateRef.current !== "user_turn") {
      console.log('🔄 Fixing conversation state after reload:', conversationStateRef.current, '-> "waiting"');
      setConversationState("waiting");
      conversationStateRef.current = "waiting";
    }
    
    // Check if we should restore speech mode (use refs to get latest values)
    const shouldRestoreSpeech = inputModeRef.current === 'speech' && isMicActiveRef.current;
    
    if (shouldRestoreSpeech) {
      console.log('🔄 Restoring speech mode after page refresh...');
      // Use a small delay to ensure all state updates have propagated
      const timer = setTimeout(async () => {
        try {
          // Ensure conversation state is "waiting" before starting recognition
          setConversationState("waiting");
          conversationStateRef.current = "waiting";
          
          // Start microphone
          await startMicrophone();
          // Small delay to ensure mic is active
          setTimeout(() => {
            if (isMicActiveRef.current && inputModeRef.current === 'speech') {
              // Ensure state is still correct before starting recognition
              if (conversationStateRef.current !== "waiting" && conversationStateRef.current !== "user_turn") {
                setConversationState("waiting");
                conversationStateRef.current = "waiting";
              }
              startRecognition();
              console.log('✅ Speech recognition restored after refresh, conversation state:', conversationStateRef.current);
            }
          }, 300);
        } catch (error) {
          console.error('❌ Error restoring speech mode:', error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalStorageLoaded, design, target, tohelp]);

  // Track last save time to debounce saves
  const saveTimeoutRef = useRef(null);
  const saveInterviewTimeoutRef = useRef(null);

  // Function to save whiteboard data to localStorage
  const saveToLocalStorage = useCallback((elements, appState, files) => {
    if (!design || !target || !tohelp) {
      return; // Silently skip if params not ready
    }

    // Check if there are actually any elements or files to save
    const elementsCount = elements?.length || 0;
    const filesCount = files ? Object.keys(files).length : 0;
    
    // If there's nothing to save and no previous data, skip
    if (elementsCount === 0 && filesCount === 0) {
      // Only skip if we haven't saved anything before (to allow clearing)
      // But don't spam saves for empty canvas
      if (!saveTimeoutRef.current) {
        return; // Skip if no pending save and nothing to save
      }
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: save 2 seconds after last change (increased from 1 second)
    saveTimeoutRef.current = setTimeout(() => {
      const storageKey = getLocalStorageKey();
      // Removed logging here to reduce console spam - only log on successful save
      
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
        // Only log when there's actual content (reduce console spam)
        const actualElementsCount = elements?.length || 0;
        const actualFilesCount = Object.keys(serializableFiles).length;
        if (actualElementsCount > 0 || actualFilesCount > 0) {
          console.log('✅ Saved whiteboard:', {
            elements: actualElementsCount,
            files: actualFilesCount,
            size: (jsonString.length / 1024).toFixed(2) + ' KB'
          });
        }
      } catch (error) {
        console.error('❌ Error saving whiteboard data to localStorage:', error);
      }
    }, 2000); // Increased debounce to 2 seconds to reduce save frequency
  }, [design, target, tohelp, getLocalStorageKey]);

  // Function to save interview state (timer + conversation) to localStorage
  const saveInterviewStateToLocalStorage = useCallback(() => {
    if (!design || !target || !tohelp) {
      console.log('⚠️ Skipping interview state save - missing params');
      return;
    }

    // Clear previous timeout
    if (saveInterviewTimeoutRef.current) {
      clearTimeout(saveInterviewTimeoutRef.current);
    }

    // Debounce: save 500ms after last change
    saveInterviewTimeoutRef.current = setTimeout(() => {
      const storageKey = `${getLocalStorageKey()}_interview_state`;
      
      const interviewState = {
        timeRemaining,
        isPaused,
        conversationHistory,
        interviewStartTime: interviewStartTimeRef.current,
        inputMode,
        isMicActive,
        lastSaved: Date.now(),
      };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(interviewState));
        console.log('✅ Saved interview state (timer + conversation):', {
          key: storageKey,
          timeRemaining,
          conversationCount: conversationHistory.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error saving interview state:', error);
      }
    }, 500);
  }, [design, target, tohelp, getLocalStorageKey, timeRemaining, isPaused, conversationHistory, inputMode, isMicActive]);

  // Auto-save interview state when important state changes (NOT timer - timer is saved separately)
  useEffect(() => {
    if (isLocalStorageLoaded && design && target && tohelp) {
      saveInterviewStateToLocalStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationHistory, isPaused, inputMode, isMicActive, isLocalStorageLoaded, design, target, tohelp]);

  // Save timer state separately - only every 10 seconds to avoid constant saves
  // Use refs to avoid recreating interval when timeRemaining changes every second
  useEffect(() => {
    if (!isLocalStorageLoaded || !design || !target || !tohelp) return;
    
    const timerSaveInterval = setInterval(() => {
      if (timeRemainingRef.current > 0 && !isSubmittedRef.current) {
        const storageKey = `${getLocalStorageKey()}_interview_state`;
        
        const interviewState = {
          timeRemaining: timeRemainingRef.current,
          isPaused: isPausedRef.current,
          conversationHistory,
          interviewStartTime: interviewStartTimeRef.current,
          inputMode: inputModeRef.current,
          isMicActive: isMicActiveRef.current,
          lastSaved: Date.now(),
        };
        
        try {
          localStorage.setItem(storageKey, JSON.stringify(interviewState));
          console.log('✅ Saved interview state (timer periodic save):', {
            key: storageKey,
            timeRemaining: timeRemainingRef.current,
            conversationCount: conversationHistory.length,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('❌ Error saving interview state:', error);
        }
      }
    }, 10000); // Save timer state every 10 seconds
    
    return () => clearInterval(timerSaveInterval);
  }, [isLocalStorageLoaded, design, target, tohelp, getLocalStorageKey, conversationHistory]);

  // Save immediately before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force immediate save (bypass debounce) when page is closing
      if (design && target && tohelp) {
        const storageKey = getLocalStorageKey();
        
        // Save whiteboard data
        if (excalidrawDataRef.current) {
          const { elements, appState, files } = excalidrawDataRef.current;
        
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
        
        // Save interview state (timer + conversation)
        const interviewStateKey = `${storageKey}_interview_state`;
        const interviewState = {
          timeRemaining: timeRemainingRef.current,
          isPaused: isPausedRef.current,
          conversationHistory,
          interviewStartTime: interviewStartTimeRef.current,
          inputMode: inputModeRef.current,
          isMicActive: isMicActiveRef.current,
          lastSaved: Date.now(),
        };
        
        try {
          localStorage.setItem(interviewStateKey, JSON.stringify(interviewState));
          console.log('💾 Force saved interview state on page unload');
        } catch (error) {
          console.error('Error force saving interview state on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [design, target, tohelp, getLocalStorageKey, conversationHistory]);

  // Auto-scroll conversation box to bottom when messages change
  useEffect(() => {
    if (conversationBoxRef.current) {
      conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;
    }
  }, [conversationHistory, currentUserMessage, interimTranscript, isProcessingAI]);

// Generate initial AI greeting when interview is fully ready
  useEffect(() => {
  // Don't generate greeting if we already have conversation history (from localStorage)
  // But allow continuation logic to handle it if last message was from user
  if (conversationHistory.length > 0) {
      hasInitialGreetingRef.current = true;
    // Don't return early - let continuation logic check if we need to respond
    // The continuation logic will handle responding to user messages
    return;
  }

  // Check if all required conditions are met
  const allParamsReady = design && target && tohelp;
  
  if (
    isLocalStorageLoaded &&
    allParamsReady &&
    !hasInitialGreetingRef.current
  ) {
    // Set flag immediately to prevent multiple triggers
    hasInitialGreetingRef.current = true;
    
    // Function to attempt greeting generation
    const attemptGreeting = () => {
      // Double-check conditions before attempting
      if (!design || !target || !tohelp) {
        console.warn('⚠️ Cannot generate greeting - parameters not ready:', { design, target, tohelp });
        hasInitialGreetingRef.current = false;
        return;
      }
      
      console.log('🎤 Attempting to generate initial AI greeting...', {
        design,
        target,
        tohelp,
        isLocalStorageLoaded
      });
      
      generateAIResponse("", true).catch((error) => {
        console.error('❌ Error generating initial greeting:', error);
        // Reset flag to allow retry
        hasInitialGreetingRef.current = false;
      });
    };
    
    // Try immediately with a small delay to ensure everything is ready
    const timer1 = setTimeout(attemptGreeting, 800);
    
    // Retry after 2 seconds if first attempt might have failed
    const timer2 = setTimeout(() => {
      // Check if greeting was actually sent (conversation history should have assistant message)
      const hasAssistantMessage = conversationHistory.some(msg => msg.role === 'assistant');
      if (!hasAssistantMessage && !isProcessingAI && !hasInitialGreetingRef.current) {
        console.log('🔄 Retrying initial greeting after delay...');
        attemptGreeting();
      }
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  } else if (!allParamsReady && isLocalStorageLoaded && !hasInitialGreetingRef.current) {
    // If params aren't ready yet but localStorage is loaded, wait a bit and check again
      const timer = setTimeout(() => {
      if (design && target && tohelp && !hasInitialGreetingRef.current && conversationHistory.length === 0) {
        console.log('⏳ Parameters became available, triggering greeting...');
        hasInitialGreetingRef.current = true;
        generateAIResponse("", true).catch((error) => {
          console.error('❌ Error generating initial greeting:', error);
          hasInitialGreetingRef.current = false;
        });
      }
      }, 1000);
    
      return () => clearTimeout(timer);
    }
}, [isLocalStorageLoaded, design, target, tohelp, conversationHistory, generateAIResponse, isProcessingAI]);

  // Continue conversation after refresh if last message was from user
  useEffect(() => {
    // Only check once after localStorage is loaded
    if (!isLocalStorageLoaded || hasCheckedContinuationRef.current) {
      return;
    }
    
    // Only proceed if we have conversation history and all params are ready
    if (!design || !target || !tohelp) {
      console.log('⏳ Waiting for interview params before checking continuation...');
      return;
    }
    
    if (conversationHistory.length === 0) {
      // No conversation history, mark as checked
      hasCheckedContinuationRef.current = true;
      return;
    }
    
    // Check if the last message was from the user (meaning AI needs to respond)
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    console.log('🔍 Checking conversation continuation:', {
      lastMessageRole: lastMessage?.role,
      lastMessageContent: lastMessage?.content?.substring(0, 50),
      conversationLength: conversationHistory.length
    });
    
    if (lastMessage && lastMessage.role === 'user' && lastMessage.content && lastMessage.content.trim().length > 0) {
      // Mark that we've checked to prevent duplicate responses
      hasCheckedContinuationRef.current = true;
      
      // User sent a message but AI hasn't responded yet - continue the conversation
      console.log('🔄 Last message was from user, continuing conversation after refresh...', {
        userMessage: lastMessage.content.trim().substring(0, 100)
      });
      
      // Wait a bit to ensure everything is initialized, then generate response
      const timer1 = setTimeout(() => {
        // Double-check conditions before generating response
        if (!isProcessingAI && !isAISpeaking && design && target && tohelp) {
          console.log('✅ Generating AI response to continue conversation...');
          // Ensure conversation state is set before generating response
          setConversationState("processing");
          conversationStateRef.current = "processing";
          generateAIResponse(lastMessage.content.trim(), false).catch((error) => {
            console.error('❌ Error continuing conversation after refresh:', error);
            // Reset flag to allow retry
            hasCheckedContinuationRef.current = false;
            // Reset conversation state on error
            setConversationState("waiting");
            conversationStateRef.current = "waiting";
          });
        } else {
          console.warn('⚠️ Conditions not met for continuation (attempt 1):', {
            isProcessingAI,
            isAISpeaking,
            hasDesign: !!design,
            hasTarget: !!target,
            hasTohelp: !!tohelp
          });
          // Reset conversation state if conditions aren't met
          setConversationState("waiting");
          conversationStateRef.current = "waiting";
        }
      }, 2000); // First attempt after 2 seconds
      
      // Retry after 4 seconds if first attempt didn't work
      const timer2 = setTimeout(() => {
        // Check if we're still processing or if AI is speaking (means response is being generated)
        // If not processing and not speaking, and we still have the user message as last, retry
        if (!isProcessingAI && !isAISpeaking && design && target && tohelp) {
          // Check current conversation state - if last message is still from user, retry
          const currentLastMessage = conversationHistory[conversationHistory.length - 1];
          if (currentLastMessage && currentLastMessage.role === 'user' && 
              currentLastMessage.content === lastMessage.content.trim()) {
            console.log('🔄 Retrying conversation continuation (no response yet)...');
            hasCheckedContinuationRef.current = false; // Reset to allow retry
            setConversationState("processing");
            conversationStateRef.current = "processing";
            generateAIResponse(lastMessage.content.trim(), false).catch((error) => {
              console.error('❌ Error on retry continuing conversation:', error);
              // Reset conversation state on error
              setConversationState("waiting");
              conversationStateRef.current = "waiting";
            });
          }
        }
      }, 4000); // Retry after 4 seconds
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
      
      return () => clearTimeout(timer);
    } else {
      // Last message was from assistant or no valid last message, mark as checked
      console.log('ℹ️ Last message was from assistant or empty, no continuation needed');
      hasCheckedContinuationRef.current = true;
      // Ensure conversation state is set to "waiting" so user can speak
      setConversationState("waiting");
      conversationStateRef.current = "waiting";
    }
  }, [isLocalStorageLoaded, conversationHistory, design, target, tohelp, generateAIResponse, isProcessingAI, isAISpeaking]);

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
        recognitionAbortedRef.current = false; // Clear aborted flag when recognition successfully starts
        // Record start time when recognition begins
        if (!recognitionStartTimeRef.current) {
          recognitionStartTimeRef.current = Date.now();
        }
        setIsListening(true);
        // Ensure conversation state is set to "waiting" when recognition starts
        // This is especially important after page reload
        setConversationState("waiting");
        conversationStateRef.current = "waiting";
        console.log('✅ Speech recognition started, set conversation state to "waiting"');
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
          
          // Trigger wave animation for final text
          triggerWaveAnimation();
          
          // Ensure conversation state allows user to speak
          // Always set to "user_turn" when user speaks, regardless of previous state
          // This is important after page reload when state might not be properly initialized
          const currentState = conversationStateRef.current;
          if (currentState !== "user_turn") {
            console.log('🔄 Setting conversation state to "user_turn" (user spoke, previous state:', currentState + ')');
            setConversationState("user_turn");
            conversationStateRef.current = "user_turn";
          }
          
          // Accumulate user message for conversation
          setCurrentUserMessage((prev) => {
            const updated = (prev + " " + finalTextTrimmed).trim();
            // Update ref immediately (don't wait for useEffect)
            currentUserMessageRef.current = updated;
            console.log('📝 Updated currentUserMessage (final):', updated.substring(0, 50), 'length:', updated.length);
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
          // Trigger wave animation for interim text (continuous updates)
          triggerWaveAnimation();
          
          // Ensure conversation state allows user to speak
          // Always set to "user_turn" when user speaks, regardless of previous state
          // This is important after page reload when state might not be properly initialized
          const currentState = conversationStateRef.current;
          if (currentState !== "user_turn") {
            console.log('🔄 Setting conversation state to "user_turn" (interim speech detected, previous state:', currentState + ')');
            setConversationState("user_turn");
            conversationStateRef.current = "user_turn";
          }
          
          // Reset silence timer on any speech activity (interim text means user is still speaking)
          // Don't add interim text to currentUserMessage - it's temporary
          // The timer will fire when interim text stops coming (user stops speaking)
          resetSilenceTimer();
        } else {
          setInterimTranscript("");
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        
        if (event.error === "aborted") {
          // Recognition was aborted (usually because it's already running)
          // Don't restart - the onend handler will check if restart is needed
          recognitionAbortedRef.current = true;
          console.log('⚠️ Speech recognition aborted (likely already running)');
        } else if (event.error === "no-speech") {
          // Restart recognition if no speech detected, interview is active, and mic is active
          recognitionAbortedRef.current = false; // Clear aborted flag for no-speech
          const showInterview = timeRemainingRef.current > 0 && !isSubmittedRef.current;
          if (showInterview && !isPausedRef.current && isMicActiveRef.current) {
            setTimeout(() => {
              startRecognition();
            }, 500);
          }
        } else if (event.error === "not-allowed") {
          alert("Microphone access denied. Please enable microphone permissions.");
          recognitionAbortedRef.current = false;
        } else {
          // For other errors, clear aborted flag
          recognitionAbortedRef.current = false;
        }
      };

      recognition.onend = () => {
        const wasAborted = recognitionAbortedRef.current;
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        console.log('🔴 Speech recognition ended. Current state:', {
          conversationState: conversationStateRef.current,
          hasSilenceTimer: !!silenceTimerRef.current,
          currentUserMessage: currentUserMessageRef.current.substring(0, 50),
          messageLength: currentUserMessageRef.current.trim().length,
          wasAborted
        });
        
        // If recognition was aborted, don't restart immediately - it's likely already running
        if (wasAborted) {
          console.log('⚠️ Recognition was aborted, skipping restart to prevent loop');
          recognitionAbortedRef.current = false; // Clear flag for next time
          return;
        }
        
        // Check if we have a pending user message that should trigger a response
        // This is a FALLBACK in case the silence timer didn't fire for some reason
        const userMsg = currentUserMessageRef.current.trim();
        const state = conversationStateRef.current;
        const processing = isProcessingAIRef.current;
        const aiSpeaking = isAISpeakingRef.current;
        
        // If we have a user message and we're in user_turn state, and no silence timer is active,
        // it means the timer should have fired but didn't - trigger response manually
        if (state === "user_turn" && userMsg.length >= 3 && !processing && !aiSpeaking) {
          if (!silenceTimerRef.current) {
            // No timer active - it should have fired already, but didn't
            // This is a fallback to ensure the response is generated
            console.log('⚠️ Recognition ended with pending user message but no silence timer - triggering response as fallback');
            // Small delay to ensure state is stable
            setTimeout(() => {
              // Double-check conditions before generating
              const finalUserMsg = currentUserMessageRef.current.trim();
              const finalState = conversationStateRef.current;
              const finalProcessing = isProcessingAIRef.current;
              const finalAISpeaking = isAISpeakingRef.current;
              
              if (finalState === "user_turn" && finalUserMsg.length >= 3 && !finalProcessing && !finalAISpeaking) {
                console.log('✅ Fallback: Generating AI response for pending message');
                handleSilenceDetected();
              }
            }, 100);
          } else {
            console.log('⏳ Silence timer still active, will fire soon');
          }
        }
        
        // Only restart recognition if interview is still active, AI is not speaking, and mic is active
        // Also check that recognition is not already running (double-check)
        const showInterview = timeRemainingRef.current > 0 && !isSubmittedRef.current;
        if (showInterview && !isPausedRef.current && isMicActiveRef.current && !isRecognitionRunningRef.current) {
          setTimeout(() => {
            // Double-check again before starting
            if (!isRecognitionRunningRef.current && !isAISpeakingRef.current) {
            startRecognition();
            }
          }, 500);
        }
      };

      recognitionRef.current = recognition;

      return () => {
        stopRecognition();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          if (!isAISpeaking && inputMode === 'speech' && isMicActive && !isRecognitionRunningRef.current) {
            console.log('Attempting to start speech recognition...');
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
    <button 
      onClick={handleClearWhiteboard}
      aria-label="Clear whiteboard"
      className="text-gray-700 hover:text-black transition-colors cursor-pointer"
      title="Clear whiteboard"
    >
      <Trash2 size={24} strokeWidth={1.2}/>
    </button>

    {/* <MessageCircleQuestionMark size={24} strokeWidth={1.2}/> */}
  </div>
        <div className="flex-1 w-full h-full relative rounded-xl overflow-visible">
         {isLocalStorageLoaded ? (
           <ExcalidrawWrapper
             initialData={excalidrawInitialDataRef.current || {
               elements: [],
               appState: {
                 viewBackgroundColor: "#ffffff",
                 zenModeEnabled: true,
                 currentItemFontFamily: 2,
               },
               files: {},
             }}
             onReady={(api) => {
               excalidrawAPIRef.current = api;
             }}
             onChange={(elements, appState, files) => {
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
              <p className="font-serif px-3 text-lg py-1 rounded-lg bg-red-100 flex items-center gap-2">
              <SplinePointer size={16} strokeWidth={1.2} />
              DESIGN</p>{' '}
              <p className="font-normal">{design || ''}</p>
            </div>
          </div>
          <div className="bg-gray-100 pl-2 pr-5 py-2 rounded-lg w-fit">
            <div className="text-base flex items-center gap-2 text-black">
              <div className="font-serif px-3 text-lg py-1 rounded-lg bg-blue-100 flex items-center gap-2">
              <UserSearch size={16} strokeWidth={1.2} />
              FOR</div>{' '}
              <p className="font-normal">{target || ''}</p>
            </div>
          </div>
          <div className="bg-gray-100 pl-2 pr-5 py-2 rounded-lg w-fit">
              <div className="text-base flex items-center gap-2 text-black">
              <div className="font-serif px-3 text-lg py-1 rounded-lg bg-pink-100 flex items-center gap-2">
              <HeartHandshake size={16} strokeWidth={1.2} />
              TO HELP</div>{' '}
              <p className="font-normal">{tohelp || ''}</p>
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
                      inputMode === 'keyboard' ? 'bg-black/80 text-white' : 'bg-white'
                    }`}
                  >
                    <Keyboard size={16} strokeWidth={1.2} /> Text
                  </button>
                                    <button 
                    onClick={async () => {
                      if (inputMode !== 'speech') {
                        setInputMode('speech');
                        setShowAskQuestions(true);
                        // Start microphone and wait for it to be active
                        try {
                          await startMicrophone();
                          // Small delay to ensure state updates propagate
                          setTimeout(() => {
                            if (isMicActiveRef.current && inputModeRef.current === 'speech') {
                              startRecognition();
                            }
                          }, 200);
                        } catch (error) {
                          console.error('Failed to start microphone:', error);
                        }
                      }
                    }}
                    className={`h-full px-3 py-2 rounded-xl pointer-events-auto gap-2 cursor-pointer flex items-center justify-center ${
                      inputMode === 'speech' ? 'bg-black/80 text-white' : 'bg-white'
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
      <div className="absolute top-6 right-6  rounded-xl px-3 py-3 z-50 flex items-center gap-3">
             <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2 pl-2" >
              <button
          onClick={() => setIsPaused((prev) => !prev)}
          className="ml-2 text-black hover:text-gray-600"
        >
          {isPaused ? <Play size={16} strokeWidth={1.2} /> : <Pause size={16} strokeWidth={1.2} />}
        </button>
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl">
          <Clock className="w-5 h-5  text-black" size={16} strokeWidth={1.3} />
        <span className={`${timeRemaining < 300 ? 'text-red-400' : 'text-black'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      </div>

        <button
          onClick={handleSubmit}
          disabled={isGrading}
          className="px-3 py-2 bg-black/80 rounded-lg flex items-center gap-2 text-white hover:bg-black/90 font-serif text-xl cursor-pointer transition-colors disabled:opacity-50"
        >
          {isGrading ? "Grading..." : "Submit"}
          <Sparkles size={16} strokeWidth={1.2} />
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

      {/* Clear Whiteboard Confirmation Modal */}
      {showClearWhiteboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowClearWhiteboardModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full ">
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-serif text-black">
                  Clear Whiteboard?
                </h2>
                <p className="text-base text-gray-600">
                  This will clear all drawings and shapes on the whiteboard. Your timer and conversation history will be preserved.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearWhiteboardModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 cursor-pointer hover:bg-gray-200 text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearWhiteboard}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-100 cursor-pointer hover:bg-red-200 text-black transition-colors"
                >
                  Clear Whiteboard
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

