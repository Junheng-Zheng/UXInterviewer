"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useState, useEffect } from "react";
import useStore from "../../store/module";
import Animatedlink from "../Components/Atoms/Animatedlink";
import Profile from "../Components/Molecules/Profile";
import Results from "../Components/Templates/Results";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((m) => m.Excalidraw),
  { ssr: false }
);

const Interview = () => {
  const timeValue = useStore((state) => state.time); // minutes from store
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const selectedModel = useStore((state) => state.selectedModel);

  const [secondsLeft, setSecondsLeft] = useState(timeValue * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [warning, setWarning] = useState(false);
  const [excalidrawJson, setExcalidrawJson] = useState(null);
  const [excalidrawKey, setExcalidrawKey] = useState(0); // Key to force re-render

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

      // Set the JSON data and increment key to force Excalidraw to re-render with new data
      setExcalidrawJson(data);
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
    if (secondsLeft <= 0 || isPaused) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, isPaused]);

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

  return (
    <>
      {secondsLeft > 0 && (
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
              />
            </div>
          </div>
        </div>
      )}

      {secondsLeft <= 0 && <Results />}
    </>
  );
};

export default Interview;
