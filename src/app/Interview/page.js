"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useState, useEffect } from "react";
import useStore from "../../store/module";
import Animatedlink from "../Components/Atoms/Animatedlink";
import Profile from "../Components/Molecules/Profile";
import Results from "../Components/Templates/Results";
import { useRouter } from "next/navigation";
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((m) => m.Excalidraw),
  { ssr: false }
);

const Interview = () => {
  const router = useRouter();
  // GLOBAL STATE
  const { design, target, tohelp, time } = useStore();

  useEffect(() => {
    if (!design || !target || !tohelp || !time) {
      router.replace("/"); // redirect to homepage
    }
  }, [design, target, tohelp, time, router]);

  const timeValue = useStore((state) => state.time); // minutes from store
  const [secondsLeft, setSecondsLeft] = useState(timeValue * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [warning, setWarning] = useState(false);

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
          <div className="px-[20px] py-[16px] bg-primary rounded-full flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
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

      {secondsLeft <= 0 && <Results />}
    </>
  );
};

export default Interview;
