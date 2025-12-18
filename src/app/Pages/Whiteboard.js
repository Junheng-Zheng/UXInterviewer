"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useStore from "../../store/module";
import Button from "../Components/Atoms/Button";
import Counter from "../Components/Atoms/Counter";
import Dropdown from "../Components/Molecules/Dropdown";
import Decryptedtext from "../Components/UIComponents/Decryptedtext";
const Whiteboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState("EASY");

  /* ---------- store ---------- */
  const design = useStore((s) => s.design);
  const target = useStore((s) => s.target);
  const tohelp = useStore((s) => s.tohelp);
  const time = useStore((s) => s.time);

  const setDesign = useStore((s) => s.setDesign);
  const setTarget = useStore((s) => s.setTarget);
  const setTohelp = useStore((s) => s.setTohelp);
  const setTime = useStore((s) => s.setTime);

  /* ---------- local state ---------- */
  const [reloadRotation, setReloadRotation] = useState(0);

  /* ---------- challenge pools ---------- */
  const designPool = [
    "a FAQ page",
    "a landing page",
    "a product page",
    "a dashboard page",
    "a settings page",
  ];

  const targetPool = [
    "a finance tracking app",
    "a fitness tracking app",
    "a productivity app",
    "a notes app",
  ];

  const tohelpPool = [
    "accountants",
    "fitness trainers",
    "students",
    "product managers",
  ];

  /* ---------- actions ---------- */
  const reloadChallenge = () => {
    setDesign(designPool[Math.floor(Math.random() * designPool.length)]);
    setTarget(targetPool[Math.floor(Math.random() * targetPool.length)]);
    setTohelp(tohelpPool[Math.floor(Math.random() * tohelpPool.length)]);
  };

  useEffect(() => {
    reloadChallenge();
  }, []);

  /* ---------- render ---------- */
  return (
    <div className="flex flex-col gap-8">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          {/* backdrop */}
          <button
            className="absolute inset-0 cursor-pointer"
            onClick={() => setShowModal(false)}
          />

          {/* modal */}
          <div className="w-[400px] z-50 flex flex-col gap-4 p-6 rounded-[12px] bg-white">
            <div className="text-[32px] shoulder flex flex-col gap-1 font-bold leading-[34px] tracking-[-0.8px]">
              <p>DESIGN {design}</p>
              <p>FOR {target}</p>
              <p>TO HELP {tohelp}</p>
            </div>

            <Link href="/Interview">
              <Button
                variant="primary"
                icon="fa-solid fa-play"
                className="w-full"
              >
                Start Interview
              </Button>
            </Link>

            <button
              className=" text-xs hover:scale-95 transition-all"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* header */}
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-pencil" />
        <p className="font-medium uppercase">Whiteboard</p>
      </div>

      <div className="flex flex-col gap-6 p-8 relative">
        <div className="absolute top-0 left-0 border-l border-t border-gray-300 w-[24px]  aspect-square "></div>
        <div className="absolute top-0 right-0 border-r border-t border-gray-300 w-[24px]  aspect-square "></div>
        <div className="absolute bottom-0 left-0 border-l border-b border-gray-300 w-[24px]  aspect-square "></div>
        <div className="absolute bottom-0 right-0 border-r border-b border-gray-300 w-[24px]  aspect-square "></div>
        {/* controls */}
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <Button
            onClick={() => {
              reloadChallenge();
              setReloadRotation((r) => r + 180);
            }}
          >
            <i
              className="fa-solid fa-refresh transition-all duration-300"
              style={{ transform: `rotate(${reloadRotation}deg)` }}
            />
            Refresh Challenge
          </Button>

          <Dropdown
            text="Category"
            options={[{ label: "UI/UX", value: "uiux" }]}
          >
            UI/UX
          </Dropdown>

          {/* <Dropdown
            text="Difficulty"
            options={[
              { label: "Easy", value: "easy" },
              { label: "Medium", value: "medium" },
              { label: "Hard", value: "hard" },
            ]}
          >
            Medium
          </Dropdown> */}
          <div className="flex pb-3 border-b-[0.5px] border-gray-200 text-xs gap-4">
            {["All", "New Feature", "Redesign"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`uppercase relative ${
                  selected === cat ? "text-orange-600" : ""
                }`}
              >
                {cat}
                {selected === cat && (
                  <div className="absolute bottom-0 left-0 w-full h-px translate-y-3 bg-orange-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* challenge text */}
        <div className="text-[48px] shoulder flex flex-col gap-1 font-bold leading-[48px] tracking-[-0.8px]">
          <div className="pb-3 border-b border-gray-200">
            <Decryptedtext
              text={`DESIGN ${design}`}
              animateOn="view"
              revealDirection="center"
              speed={100}
            />
          </div>
          <div className="pb-3 border-b border-gray-200">
            <Decryptedtext
              text={`FOR ${target}`}
              animateOn="view"
              revealDirection="center"
              speed={100}
            />
          </div>
          <div className="pb-3 border-b border-gray-200">
            <Decryptedtext
              text={`TO HELP ${tohelp}`}
              animateOn="view"
              revealDirection="center"
              speed={100}
            />
          </div>
        </div>

        <p className="text-xs">[EXPECTED TIME NEEDED] {time} Minutes</p>
      </div>

      {/* footer */}
      <div className="flex justify-between items-center">
        {/* LEFT — Interviewer settings */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-gear" />
            <p className="font-medium uppercase">INTERVIEWER SETTINGS</p>
          </div>

          <div className="w-full bg-gray-100 h-px" />

          <div className="flex text-xs items-end gap-2">
            <Dropdown
              text="Talking Speed"
              options={[
                { label: "Slow", value: "slow" },
                { label: "Normal", value: "normal" },
                { label: "Fast", value: "fast" },
              ]}
            >
              Normal
            </Dropdown>

            <Dropdown
              text="Voice"
              options={[
                { label: "Kolbe Yang", value: "kolbe" },
                { label: "Alex Chen", value: "alex" },
              ]}
            >
              Kolbe Yang
            </Dropdown>

            <Button icon="fa-solid fa-lock">Test Voice</Button>
          </div>
        </div>

        {/* RIGHT — Interview controls */}
        <div className="flex items-center gap-2">
          <Counter
            text="Time Limit"
            onMinus={() => setTime(Math.max(5, time - 5))}
            onPlus={() => setTime(time + 5)}
          >
            {time} min
          </Counter>
          <Dropdown
            text="Input"
            options={[
              { label: "Text", value: "text" },
              { label: "Voice", value: "voice" },
            ]}
          >
            Text
          </Dropdown>

          <Dropdown
            text="Output"
            options={[
              { label: "Text", value: "text" },
              { label: "Voice", value: "voice" },
            ]}
          >
            Voice
          </Dropdown>

          {/* Start Interview */}
          <button
            onClick={() => setShowModal(true)}
            className="flex px-6 py-4 rounded-full text-white bg-orange-500 items-center gap-2"
          >
            Start Interview
            <i className="fa-solid fa-play" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
