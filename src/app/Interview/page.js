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
  const excalidrawDataRef = useRef(null);

  const excalidrawRef = useRef(null);
  const setEvaluation = useStore((state) => state.setEvaluation);
  const setScreenshot = useStore((state) => state.setScreenshot);

  // Handle submit
  const handleSubmit = async () => {
    setIsPaused(true);
    setIsGrading(true);
  
    try {
      // Capture screenshot from Excalidraw
      let screenshotBase64 = null;
      
      // Get Excalidraw data from tracked state (onChange callback)
      if (!excalidrawDataRef.current) {
        throw new Error("No Excalidraw data available. Please draw something first.");
      }

      const { elements, appState } = excalidrawDataRef.current;
      
      if (!elements || !Array.isArray(elements) || elements.length === 0) {
        throw new Error("Excalidraw canvas is empty. Please add some elements before submitting.");
      }

      // Wait for exportToBlob to be available if not loaded yet
      if (!exportToBlob) {
        const excalidrawModule = await import("@excalidraw/excalidraw");
        exportToBlob = excalidrawModule.exportToBlob;
      }
      
      if (!exportToBlob) {
        throw new Error("Failed to load Excalidraw export function");
      }

      try {
        // Export Excalidraw as PNG blob
        const blob = await exportToBlob({
          elements,
          appState: appState || {},
          mimeType: "image/png",
          // Note: quality parameter is not used for PNG (lossless format)
        });
        
        // Convert blob to base64
        screenshotBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result.split(",")[1]; // Remove data:image/png;base64, prefix
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (exportError) {
        console.error("Error capturing screenshot:", exportError);
        throw new Error("Failed to capture screenshot. Please try again.");
      }
      
      if (!screenshotBase64) {
        throw new Error("Unable to capture screenshot from Excalidraw");
      }
  
      const response = await fetch("/api/grade-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          design,
          target,
          tohelp,
          screenshot: screenshotBase64, // Send screenshot instead of JSON
          // excalidrawData: compressed, // COMMENTED OUT: JSON data
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
        throw new Error(evaluation.message || evaluation.error || "Failed to grade submission");
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
            {/* EXCALIDRAW */}
            <div className="flex-1 h-full border border-border rounded-lg overflow-hidden">
              <Excalidraw
                key={excalidrawKey}
                initialData={excalidrawJson}
                ref={excalidrawRef}
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
