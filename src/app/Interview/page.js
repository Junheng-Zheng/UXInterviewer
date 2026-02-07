"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useState, useEffect, useRef } from "react";
import useStore from "../../store/module";
import Animatedlink from "../Components/Atoms/Animatedlink";
import Profile from "../Components/Profile";
import Results from "../Components/Templates/Results";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((m) => m.Excalidraw),
  { ssr: false }
);

// Import exportToBlob for screenshot capture
let exportToBlob = null;
import("@excalidraw/excalidraw").then((m) => {
  exportToBlob = m.exportToBlob;
});

const Interview = () => {
  const timeValue = useStore((state) => state.time); // minutes from store
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const selectedModel = useStore((state) => state.selectedModel);

  const [secondsLeft, setSecondsLeft] = useState(timeValue * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [warning, setWarning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [excalidrawJson, setExcalidrawJson] = useState(null);
  const [excalidrawKey, setExcalidrawKey] = useState(0); // Key to force re-render
  const [currentExcalidrawData, setCurrentExcalidrawData] = useState(null);
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
  const secondsLeftRef = useRef(secondsLeft);
  const interviewStartTimeRef = useRef(null); // Track when interview started

  const excalidrawRef = useRef(null);
  const excalidrawAPIRef = useRef(null);
  const setEvaluation = useStore((state) => state.setEvaluation);
  const setScreenshot = useStore((state) => state.setScreenshot);

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

  // Play pending audio manually (when user clicks play button)
  const playPendingAudio = async () => {
    if (pendingAudioRef.current && audioRef.current) {
      try {
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
        });
        audioRef.current.addEventListener("error", (e) => {
          console.error("Audio playback error:", e);
          setIsAISpeaking(false);
          setConversationState("waiting");
          setErrorMessage("Failed to play audio. Please check your audio settings.");
        });
      }

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
        setErrorMessage("Audio ready. Click the play button or start speaking to hear the response.");
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
    
    if (state === "user_turn" && userMsg.length > 0 && !processing) {
      const finalTranscript = userMsg;
      // Don't clear currentUserMessage here - let generateAIResponse handle it
      // after the message is added to conversation history
      setInterimTranscript("");
      generateAIResponse(finalTranscript);
    }
  };

  // Reset silence timer when speech is detected
  const resetSilenceTimer = () => {
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
    setIsPaused(true);
    setIsGrading(true);
    
    // Stop speech recognition and audio immediately when submitting
    stopAudio();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        console.log("Speech recognition stopped on submit");
      } catch (e) {
        // Recognition might not be running, ignore
      }
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
      // Use timer-based calculation: initial time - remaining time = time used
      const initialTimeSeconds = timeValue * 60;
      const completionTimeSeconds = initialTimeSeconds - secondsLeft;
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
          timeLimitMinutes: timeValue,
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

      setEvaluation(evaluation);
      // Store the screenshot for display on results page
      setScreenshot(screenshotBase64);
      console.log("Screenshot stored:", screenshotBase64 ? `${screenshotBase64.substring(0, 50)}...` : "null");
      setIsSubmitted(true);
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
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    currentUserMessageRef.current = currentUserMessage;
  }, [currentUserMessage]);

  useEffect(() => {
    isProcessingAIRef.current = isProcessingAI;
  }, [isProcessingAI]);

  // Reset timer whenever `timeValue` changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsLeft(timeValue * 60);
    setWarning(false);
    // Track when interview starts (when timer is initialized)
    if (!interviewStartTimeRef.current) {
      interviewStartTimeRef.current = Date.now();
    }
  }, [timeValue]);

  // TIMER
  useEffect(() => {
    if (secondsLeft <= 0 || isPaused || isSubmitted) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, isPaused, isSubmitted]);

  // WARNING effect
  useEffect(() => {
    if (secondsLeft <= 5 && !warning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWarning(true);
    }
  }, [secondsLeft, warning]);

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
        // Don't clear currentUserMessage here - it should persist across recognition restarts
        // Only clear it after it's been added to conversation history
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
          if (pendingAudioRef.current && audioRef.current) {
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
            });
          }
        }

        // If we're in AI turn or processing, stop audio when user starts speaking
        const currentState = conversationStateRef.current;
        if ((currentState === "ai_turn" || currentState === "processing") && (finalText || interimText)) {
          stopAudio();
          setConversationState("user_turn");
          setIsProcessingAI(false);
          // Clear any pending silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
        }

        // Add final words to transcript with timestamp and newline
        if (finalText) {
          // Calculate elapsed time from start
          const elapsedMs = recognitionStartTimeRef.current 
            ? Date.now() - recognitionStartTimeRef.current 
            : 0;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          const minutes = Math.floor(elapsedSeconds / 60);
          const seconds = elapsedSeconds % 60;
          const timestamp = `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}]`;
          
          const finalTextTrimmed = finalText.trim();
          setTranscript((prev) => prev + `${timestamp} ${finalTextTrimmed}\n\n`);
          
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
          // Use refs to get current state values
          const showInterview = secondsLeftRef.current > 0 && !isSubmittedRef.current;
          if (showInterview && !isPausedRef.current) {
            // Small delay before restarting to avoid rapid restarts
            setTimeout(() => {
              const stillActive = secondsLeftRef.current > 0 && !isSubmittedRef.current && !isPausedRef.current;
              if (stillActive && recognitionRef.current && !isRecognitionRunningRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  // Already started or error, ignore
                }
              }
            }, 500);
          }
        } else if (event.error === "not-allowed") {
          alert("Microphone access denied. Please enable microphone permissions.");
          setIsListening(false);
        } else if (event.error === "aborted") {
          // Aborted error - recognition was stopped unexpectedly
          isRecognitionRunningRef.current = false;
          setIsListening(false);
          // Try to restart if interview is still active
          console.warn("Speech recognition aborted, attempting to restart...");
          const showInterview = secondsLeftRef.current > 0 && !isSubmittedRef.current;
          if (showInterview && !isPausedRef.current) {
            setTimeout(() => {
              const stillActive = secondsLeftRef.current > 0 && !isSubmittedRef.current && !isPausedRef.current;
              if (stillActive && recognitionRef.current && !isRecognitionRunningRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  // Ignore errors on restart
                }
              }
            }, 1000);
          }
        } else {
          // Other errors - log but don't restart automatically
          console.warn("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        // Only restart recognition if interview is still active (not submitted and time remaining)
        // Use refs to get current state values
        const showInterview = secondsLeftRef.current > 0 && !isSubmittedRef.current;
        if (showInterview && !isPausedRef.current) {
          // Add delay before restarting to avoid rapid restarts
          setTimeout(() => {
            const stillActive = secondsLeftRef.current > 0 && !isSubmittedRef.current && !isPausedRef.current;
            if (stillActive && recognitionRef.current && !isRecognitionRunningRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Already started or error, ignore
              }
            }
          }, 500);
        } else {
          console.log("Speech recognition ended - not restarting (interview finished or results shown)");
        }
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, []);

  // Always listen (start recognition when interview is active)
  useEffect(() => {
    if (!recognitionRef.current) return;

    const showInterview = secondsLeft > 0 && !isSubmitted;
    
    if (showInterview && !isPaused) {
      // Start recognition when interview is active
      // Add small delay to avoid race conditions
      const timeoutId = setTimeout(() => {
        if (recognitionRef.current && secondsLeft > 0 && !isSubmitted && !isPaused && !isRecognitionRunningRef.current) {
          try {
            recognitionRef.current.start();
            // onstart handler will set isListening and start time
            
            // Don't auto-send initial greeting - wait for user to speak first
            // This ensures user interaction before any audio playback
          } catch (e) {
            // Already started or error, ignore
            console.warn("Could not start recognition:", e);
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      // Stop recognition when interview ends, is paused, or results are shown
      if (isRecognitionRunningRef.current) {
        try {
          recognitionRef.current.stop();
          isRecognitionRunningRef.current = false;
          setIsListening(false);
          console.log("Speech recognition stopped - interview ended or results shown");
        } catch (e) {
          // Not started, ignore
        }
      }
    }
  }, [isSubmitted, isPaused, secondsLeft]);

  // Explicitly stop recognition when results are shown
  useEffect(() => {
    const showResults = secondsLeft <= 0 || isSubmitted;
    if (showResults && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        console.log("Speech recognition stopped - results page shown");
      } catch (e) {
        // Recognition might not be running, ignore
      }
    }
  }, [isSubmitted, secondsLeft]);

  const timeFormatted = `${String(Math.floor(secondsLeft / 60)).padStart(
    2,
    "0"
  )}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const showInterview = secondsLeft > 0 && !isSubmitted;
  const showResults = secondsLeft <= 0 || isSubmitted;

  return (
    <>
      {showInterview && (
        <div className="h-dvh relative p-12">
          {/* TIMER BAR */}
          <div className="px-[20px] py-[16px] bg-primary rounded-full flex items-center gap-6 absolute left-1/2 -translate-x-1/2 top-4 z-30">
            <div className="px-3 py-2 bg-white gap-2 flex items-center rounded-full">
              <button onClick={() => setIsPaused((prev) => !prev)}>
                <i
                  className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`}
                ></i>
              </button>
              <p className={`${warning ? "text-red-500" : "text-primary"}`}>
                {timeFormatted}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <i className={`fa-solid fa-microphone text-white ${isListening && conversationState === "user_turn" ? "animate-pulse" : ""}`}></i>
              {isAISpeaking && (
                <i className="fa-solid fa-volume-high text-white animate-pulse"></i>
              )}
              {isProcessingAI && (
                <i className="fa-solid fa-spinner fa-spin text-white"></i>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isGrading}
              className="px-4 py-2 bg-white text-primary rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Submit interview"
            >
              {isGrading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Grading...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  Submit
                </>
              )}
            </button>
          </div>

          {/* NAV BAR */}
          <div className="flex justify-between items-center mb-4 pt-16">
            <div className="flex items-center gap-6">
              <Animatedlink className="flex items-center gap-2">
                <i className="fa-solid fa-sign-out scale-x-[-1]"></i>
                Home
              </Animatedlink>

              <Animatedlink className="flex items-center gap-2">
                <i className="fa-solid fa-refresh"></i>
                Restart
              </Animatedlink>

              <Animatedlink className="flex items-center gap-2">
                <i className="fa-solid fa-closed-captioning"></i>
                Captions
              </Animatedlink>

              <button
                onClick={loadTestJSON}
                className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
                title="Load test diagram"
              >
                <i className="fa-solid fa-file-import"></i>
                Load Test Diagram
              </button>
            </div>
            <div className="z-20">
              <Profile />
            </div>
          </div>

          {/* MAIN CONTENT AREA - Split Layout */}
          <div className="h-[calc(100vh-180px)] flex gap-4">
            {/* TRANSCRIPT BOX */}
            <div className="w-80 h-full border border-border rounded-lg overflow-hidden bg-white flex flex-col">
                <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Conversation</h3>
                  <div className="flex items-center gap-2">
                    {conversationState === "user_turn" && isListening && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600">You&apos;re speaking</span>
                      </div>
                    )}
                    {conversationState === "processing" && (
                      <div className="flex items-center gap-1">
                        <i className="fa-solid fa-spinner fa-spin text-primary"></i>
                        <span className="text-xs text-gray-600">Processing...</span>
                      </div>
                    )}
                    {conversationState === "ai_turn" && isAISpeaking && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600">AI speaking</span>
                      </div>
                    )}
                    {conversationState === "waiting" && isListening && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-600">Ready</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Always show conversation if history exists, or if user is currently speaking/transcribing */}
                  {(conversationHistory.length > 0 || currentUserMessage || interimTranscript || transcript) ? (
                    <div className="space-y-4">
                      {/* Display conversation history - this persists and shows all previous messages */}
                      {conversationHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            msg.role === "user"
                              ? "bg-blue-50 ml-4 border-l-2 border-blue-300"
                              : "bg-gray-50 mr-4 border-l-2 border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-600">
                              {msg.role === "user" ? "You" : "Interviewer"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      ))}
                      
                      {/* Show current user input being transcribed (in-progress, not yet in history) */}
                      {(currentUserMessage || interimTranscript) && (conversationState === "user_turn" || conversationState === "waiting") && (
                        <div className="p-3 rounded-lg bg-blue-50 ml-4 border-l-2 border-blue-300 border-dashed opacity-75">
                          <div className="flex items-start gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-600">You</span>
                            <span className="text-xs text-gray-400">Speaking...</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {currentUserMessage}
                            {interimTranscript && (
                              <span className="text-gray-500 italic">{interimTranscript}</span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      {/* Legacy transcript display (for backward compatibility) */}
                      {transcript && conversationHistory.length === 0 && (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {transcript}
                        </p>
                      )}
                      
                      {/* Error message or pending audio notice */}
                      {errorMessage && (
                        <div className={`p-3 rounded-lg border-l-2 ${
                          hasPendingAudio 
                            ? "bg-blue-50 border-blue-300" 
                            : "bg-red-50 border-red-300"
                        }`}>
                          <p className={`text-sm ${hasPendingAudio ? "text-blue-800" : "text-red-800"}`}>
                            {errorMessage}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {hasPendingAudio && (
                              <button
                                onClick={playPendingAudio}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <i className="fa-solid fa-play"></i>
                                Play Audio
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setErrorMessage(null);
                                setHasPendingAudio(false);
                              }}
                              className={`text-xs ${hasPendingAudio ? "text-blue-600 hover:text-blue-800" : "text-red-600 hover:text-red-800"}`}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      {isListening
                        ? "Listening... Start speaking to begin the conversation."
                        : "Waiting to start..."}
                    </p>
                  )}
                </div>
                {(conversationHistory.length > 0 || transcript) && (
                  <div className="px-4 py-2 border-t border-border bg-gray-50 flex justify-between items-center">
                    <button
                      onClick={() => {
                        setTranscript("");
                        setInterimTranscript("");
                        setConversationHistory([]);
                        setCurrentUserMessage("");
                        setErrorMessage(null);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Clear Conversation
                    </button>
                    <span className="text-xs text-gray-400">
                      {conversationHistory.length} messages
                    </span>
                  </div>
                )}
              </div>
            
            {/* EXCALIDRAW */}
            <div className="flex-1 h-full border border-border rounded-lg overflow-hidden">
              <Excalidraw
                key={excalidrawKey}
                initialData={excalidrawJson}
                ref={excalidrawRef}
                onReady={(api) => {
                  excalidrawAPIRef.current = api;
                }}
                onChange={(elements, appState, files) => {
                  excalidrawDataRef.current = { elements, appState, files };
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showResults && <Results />}
    </>
  );
};

export default Interview;

