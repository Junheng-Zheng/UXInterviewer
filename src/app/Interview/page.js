"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useState, useEffect, useRef } from "react";
import useStore from "../../store/module";
import Animatedlink from "../Components/Atoms/Animatedlink";
import Profile from "../Components/Molecules/Profile";
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
  const recognitionStartTimeRef = useRef(null);
  const recognitionRef = useRef(null);
  const isRecognitionRunningRef = useRef(false);
  const excalidrawDataRef = useRef(null);
  const isSubmittedRef = useRef(false);
  const isPausedRef = useRef(false);
  const secondsLeftRef = useRef(secondsLeft);

  const excalidrawRef = useRef(null);
  const excalidrawAPIRef = useRef(null);
  const setEvaluation = useStore((state) => state.setEvaluation);
  const setScreenshot = useStore((state) => state.setScreenshot);

  // Handle submit
  const handleSubmit = async () => {
    setIsPaused(true);
    setIsGrading(true);
    
    // Stop speech recognition immediately when submitting
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

  // Reset timer whenever `timeValue` changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsLeft(timeValue * 60);
    setWarning(false);
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
      };

      recognition.onresult = (event) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + " ";
          } else {
            interimText += transcript;
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
          
          setTranscript((prev) => prev + `${timestamp} ${finalText.trim()}\n\n`);
        }
        
        // Update interim transcript for real-time display
        setInterimTranscript(interimText);
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

            <i className="fa-solid fa-microphone text-white"></i>
            <i className="fa-solid fa-volume-high text-white"></i>

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
                  <h3 className="font-semibold text-sm">Transcript</h3>
                  {isListening && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600">Listening...</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {transcript || interimTranscript ? (
                    <div className="space-y-2">
                      {transcript && (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {transcript}
                        </p>
                      )}
                      {interimTranscript && (
                        <p className="text-sm text-gray-500 italic whitespace-pre-wrap">
                          {interimTranscript}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      {isListening
                        ? "Listening... Start speaking to see your transcript here."
                        : "Click to start listening..."}
                    </p>
                  )}
                </div>
                {(transcript || interimTranscript) && (
                  <div className="px-4 py-2 border-t border-border bg-gray-50">
                    <button
                      onClick={() => {
                        setTranscript("");
                        setInterimTranscript("");
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Clear Transcript
                    </button>
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

