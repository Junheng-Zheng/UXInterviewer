'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Clock } from 'lucide-react';
import ExcalidrawWrapper from '../Components/ExcalidrawWrapper';
import useStore from '../../store/module';
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
  const setScreenshot = useStore((state) => state.setScreenshot);
  
  // Get time from URL params, default to 1800 seconds (30 minutes)
  const initialTime = parseInt(searchParams.get('time') || '1800', 10);
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  
  // Excalidraw state
  const [excalidrawJson, setExcalidrawJson] = useState(null);
  const [excalidrawKey, setExcalidrawKey] = useState(0); // Key to force re-render
  
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
    if (showInterview && recognitionRef.current && !isRecognitionRunningRef.current) {
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
    router.push('/refactor/grading');
    
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
        console.error("Invalid JSON structure: missing elements array");
        alert("The test JSON file doesn't contain valid Excalidraw elements.");
        return;
      }

      // Set the JSON data with scrollToContent and zoomToFitOnFileOpen to auto-zoom
      // This will automatically zoom and scroll to fit all content (equivalent to Shift+1)
      setExcalidrawJson({
        ...data,
        scrollToContent: true,
        zoomToFitOnFileOpen: true,
      });
      setExcalidrawKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error loading test JSON:", error);
      alert("Failed to load test diagram. Make sure test-excalidraw.json exists in the public folder.");
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

  // Check if interview parameters are set on mount
  useEffect(() => {
    if (!design || !target || !tohelp) {
      console.warn("Interview parameters missing:", { design, target, tohelp });
      const timer = setTimeout(() => {
        if (confirm("Interview parameters are missing. Would you like to go to the setup page?")) {
          router.push('/Refactor');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []); // Run only on mount

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
          // Restart recognition if no speech detected and interview is active
          const showInterview = timeRemainingRef.current > 0 && !isSubmittedRef.current;
          if (showInterview && !isPausedRef.current) {
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
        // Only restart recognition if interview is still active and AI is not speaking
        const showInterview = timeRemainingRef.current > 0 && !isSubmittedRef.current;
        if (showInterview && !isPausedRef.current) {
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

  // Always listen (start recognition when interview is active)
  useEffect(() => {
    if (!recognitionRef.current) return;

    const showInterview = timeRemaining > 0 && !isSubmitted;
    
    if (showInterview && !isPaused) {
      // Start recognition when interview is active (only if not during AI speech)
      const timeoutId = setTimeout(() => {
        // Don't start if AI is speaking
        if (!isAISpeaking) {
          startRecognition();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      // Stop recognition when interview ends, is paused, or results are shown
      stopRecognition();
    }
  }, [isSubmitted, isPaused, timeRemaining, isAISpeaking]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style jsx global>{`
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
      <div className="relative text-sm p-8 w-full h-screen bg-gray-200 ">
        {/* Excalidraw Canvas - Full Screen */}
              <div className = "absolute top-0 left-0 w-full flex justify-between h-full">
        {Array.from({length: 256}).map((_, index) => (
          <div key={index} className="w-px h-full bg-gray-50 rounded-full" />
        ))}
      </div>

        <div className="w-full h-full relative rounded-xl overflow-hidden">
          <ExcalidrawWrapper 
            key={excalidrawKey}
            initialData={excalidrawJson}
            onReady={(api) => {
              excalidrawAPIRef.current = api;
            }}
            onChange={(elements, appState, files) => {
              excalidrawDataRef.current = { elements, appState, files };
            }}
          />


        <div className="absolute left-12 bottom-12 w-[360px] border border-[#e4e4e4] rounded-xl p-6 bg-white/70 backdrop-blur-sm z-50 flex gap-2.5 items-start">

        {/* Message Content */}
          <div className="flex-1 font-normal gap-1 flex flex-col min-w-0">
            
            {/* Status indicators */}
            <div className="flex items-center gap-2 mt-2">
              {isListening && conversationState === "user_turn" && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600">Listening</span>
                </div>
              )}
              {isProcessingAI && (
                <div className="flex items-center gap-1">
                  <i className="fa-solid fa-spinner fa-spin text-[#3168f5]"></i>
                  <span className="text-xs text-gray-600">Thinking...</span>
                </div>
              )}
              {hasPendingAudio && (
                <button
                  onClick={playPendingAudio}
                  className="px-2 py-1 bg-[#3168f5] text-white text-xs rounded hover:bg-[#2557d4]"
                >
                  <i className="fa-solid fa-play mr-1"></i>
                  Play Response
                </button>
              )}
            </div>

                      <h3 className="text-xl text-black font-serif">Interviewer</h3>
            {conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'assistant'&&  (
              <p className="text-sm text-black whitespace-pre-wrap">
                <span>{conversationHistory[conversationHistory.length - 1].content}</span>
              </p>
            )
            }

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
          <span className="text-black font-light text-sm">Load Test Diagram</span>
        </button>
      </div> */}

      {/* Timer (Top Right Overlay) */}
      <div className="absolute top-6 right-6 bg-white border border-[#e4e4e4] rounded-xl px-6 py-3 z-50 flex items-center gap-3">
        <Clock className="w-5 h-5  text-black" strokeWidth={1.3} />
        <span className={`${timeRemaining < 300 ? 'text-[#ef4444]' : 'text-black'}`}>
          {formatTime(timeRemaining)}
        </span>
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          className="ml-2 text-black hover:text-gray-600"
        >
          <i className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`}></i>
        </button>
        <button
          onClick={handleSubmit}
          disabled={isGrading}
          className="ml-2 px-3 py-1 bg-[#3168f5] text-white rounded-lg hover:bg-[#2557d4] transition-colors disabled:opacity-50"
        >
          {isGrading ? "Grading..." : "Submit"}
        </button>
      </div>

      {/* Interviewer Card (Bottom Left Overlay) */}
     
    </div>
    </>
  );
}
