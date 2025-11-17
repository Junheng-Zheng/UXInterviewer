"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import Script from "next/script";
import Animatedlink from "./Components/Atoms/Animatedlink";
import Challengecycle from "./Components/Organisms/Challangecycle";
import Interview from "./Components/Templates/Interview";
import Profile from "./Components/Molecules/Profile";
import Profilenavbar from "./Components/Organisms/Profilenavbar";
import { useState, useEffect } from "react";
import Results from "./Components/Templates/Results";
import useStore from "../store/module";
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((m) => m.Excalidraw),
  { ssr: false }
);

export default function Home() {
  const [seconds, setSeconds] = useState(0.05 * 60); // 6 seconds for test
  const [isPaused, setIsPaused] = useState(false);
  const [warning, setWarning] = useState(false);

  const { design, target, tohelp } = useStore();
  console.log(design, target, tohelp);
  // TIMER
  useEffect(() => {
    if (seconds <= 0 || isPaused) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, isPaused]);

  // WARNING effect (separate & safe)
  useEffect(() => {
    if (seconds <= 5 && !warning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWarning(true);
    }
  }, [seconds, warning]);

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  return (
    <>
      <Script id="excalidraw-assets" strategy="beforeInteractive">
        {`window.EXCALIDRAW_ASSET_PATH = "https://unpkg.com/@excalidraw/excalidraw/dist/";`}
      </Script>

      <Interview />
      {seconds > 0 && (
        <div className="h-dvh relative p-12">
          {/* TIMER BAR */}
          <div className="px-[20px] py-[16px] bg-primary rounded-full flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <div className="px-3 py-2 bg-white gap-2 flex items-center rounded-full">
              <button onClick={() => setIsPaused((prev) => !prev)}>
                <i
                  className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`}
                ></i>
              </button>
              <p className={`${warning ? "text-red-500" : "text-primary"}`}>
                {time}
              </p>
            </div>

            <i className="fa-solid fa-microphone text-white"></i>
            <i className="fa-solid fa-volume-high text-white"></i>
          </div>

          {/* NAV BAR */}
          <div className="flex justify-between items-center mb-4">
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
            </div>
            <div className="z-20">
              <Profile />
            </div>
          </div>

          {/* EXCALIDRAW */}
          <div className="h-full w-full">
            <Excalidraw />
          </div>
        </div>
      )}

      {seconds <= 0 && <Results />}
    </>
  );
}
