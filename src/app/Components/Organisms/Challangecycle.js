"use client";
import Button from "../Atoms/Button";
import Dynamiccontainer from "../Atoms/Dynamiccontainer";
import Dropdown from "../Molecules/Dropdown";
import { useState } from "react";
import useStore from "../../../store/module";

import { useEffect } from "react";

import Counter from "../Atoms/Counter";
const Challangecycle = () => {
  const design = [
    "a FAQ page",
    "a landing page",
    "a product page",
    "a pricing page",
    "a signup page",
    "a login page",
    "a dashboard page",
    "a settings page",
    "a profile page",
    "a blog page",
    "a contact page",
    "a about page",
    "a services page",
    "a products page",
    "a testimonials page",
    "a faq page",
    "a contact page",
    "a about page",
    "a services page",
  ];
  const target = [
    "a finance tracking app",
    "a fitness tracking app",
    "a productivity app",
    "a task management app",
    "a calendar app",
    "a notes app",
    "a music player app",
    "a video player app",
  ];
  const tohelp = [
    "accountants",
    "fitness trainers",
    "productivity experts",
    "task management experts",
    "calendar experts",
    "notes experts",
    "music players",
    "video players",
  ];

  const [designLocked, setDesignLocked] = useState(false);
  const [targetLocked, setTargetLocked] = useState(false);
  const [tohelpLocked, setTohelpLocked] = useState(false);

  const designValue = useStore((state) => state.design);
  const targetValue = useStore((state) => state.target);
  const tohelpValue = useStore((state) => state.tohelp);

  const setDesign = useStore((state) => state.setDesign);
  const setTarget = useStore((state) => state.setTarget);
  const setTohelp = useStore((state) => state.setTohelp);

  const [reloadRotation, setreloadRotation] = useState(0);

  const [time, setTime] = useState(15);
  const [showModal, setShowModal] = useState(false);
  const setMinusTime = () => {
    if (time > 5) {
      setTime(time - 5);
    }
  };
  const setPlusTime = () => {
    setTime(time + 5);
  };

  const reloadChallenge = () => {
    if (!designLocked) {
      setDesign(design[Math.floor(Math.random() * design.length)]);
    }
    if (!targetLocked) {
      setTarget(target[Math.floor(Math.random() * target.length)]);
    }
    if (!tohelpLocked) {
      setTohelp(tohelp[Math.floor(Math.random() * tohelp.length)]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reloadChallenge();
  }, []);

  return (
    <Dynamiccontainer className="h-dvh relative w-full flex gap-5 xl:gap-8 md:gap-6 flex-col justify-center">
      {showModal && (
        <div className="inset-0 absolute z-10 flex items-center justify-center  bg-black/10">
          <button
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={() => setShowModal(false)}
          ></button>
          <div className="w-[400px] z-20  flex flex-col gap-4 p-6 rounded-[12px]  bg-white">
            <div className="flex gap-2 items-center">
              <p className="text-[12px] text-white bg-tertiary rounded-full px-3 py-1">
                UI/UX
              </p>
              <p className="text-[12px] text-white bg-tertiary rounded-full px-3 py-1">
                Easy
              </p>
              <p className="text-[12px] text-white bg-tertiary rounded-full px-3 py-1">
                {time} minutes
              </p>
            </div>
            <div className="text-[36px] shoulder flex flex-col gap-1 font-bold leading-[36px] tracking-[-0.8px] ">
              <p>DESIGN {designValue}</p>
              <p>FOR {targetValue}</p>
              <p>TO HELP {tohelpValue}</p>
            </div>

            <div className="flex gap-2 items-center ">
              <Dropdown
                text="Interviewer"
                options={[
                  { label: "John Doe", value: "john-doe" },
                  { label: "Jane Doe", value: "jane-doe" },
                ]}
              >
                John Doe
              </Dropdown>
              <Dropdown
                text="Model"
                options={[
                  { label: "GPT-4", value: "gpt-4" },
                  { label: "Claude 3.5 Sonnet", value: "claude-3.5-sonnet" },
                  { label: "GPT-4o-mini", value: "gpt-4o-mini" },
                ]}
              >
                GPT-4
              </Dropdown>
            </div>

            <Button
              variant="primary"
              icon="fa-solid fa-play"
              className="w-full"
              onClick={() => {}}
            >
              Start Interview
            </Button>
            <button
              className="cursor-pointer hover:scale-95 transition-all duration-300 text-tertiary"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* <div className="w-[400px] h-[400px] bg-purple-500 blur-[400px] absolute top-50 left-50 rounded-full z-[-1]"></div> */}
      <div className="flex  lg:items-end flex-col-reverse gap-4  lg:flex-row  lg:justify-between w-full">
        <Button
          onClick={() => {
            reloadChallenge();
            setreloadRotation(reloadRotation + 180);
          }}
        >
          Reload Challenge{" "}
          <i
            className="fa-solid fa-refresh transition-all duration-300"
            style={{ transform: `rotate(${reloadRotation}deg)` }}
          ></i>
        </Button>
        <div className="flex items-center flex-wrap gap-3 xl:gap-5">
          <Dropdown
            text="Category"
            options={[{ label: "UI/UX", value: "uiux" }]}
          >
            UI/UX
          </Dropdown>
          <Dropdown
            text="Difficulty"
            options={[
              { label: "Easy", value: "easy" },
              { label: "Medium", value: "medium" },
              { label: "Hard", value: "hard" },
            ]}
          >
            Medium
          </Dropdown>
          <Counter
            text="Time Limit"
            onMinus={setMinusTime}
            onPlus={setPlusTime}
          >
            {time} min
          </Counter>
        </div>
      </div>
      <div className="flex gap-3 md:gap-2 xl:gap-1 shoulder text-[40px] leading-[40px] tracking-[-0.8px] md:text-[56px] md:leading-[56px] md:tracking-[-1.6px] lg:text-[72px] lg:leading-[72px] lg:tracking-[-1.6px] xl:text-[96px]  xl:leading-[96px] xl:tracking-[-1.6px] flex-col">
        <div className="flex  items-center gap-3 xl:gap-5">
          <button
            className="cursor-pointer text-[12px] xl:text-[16px] flex items-center justify-center"
            onClick={() => setDesignLocked(!designLocked)}
          >
            {designLocked ? (
              <i className="fa-solid fa-lock"></i>
            ) : (
              <i className="fa-solid fa-unlock"></i>
            )}
          </button>
          <h1>
            <strong>DESIGN</strong> {designValue}
          </h1>
        </div>
        <div className="flex items-center gap-3 xl:gap-5">
          <button
            className="cursor-pointer text-[12px] xl:text-[16px] flex items-center justify-center"
            onClick={() => setTargetLocked(!targetLocked)}
          >
            {targetLocked ? (
              <i className="fa-solid fa-lock"></i>
            ) : (
              <i className="fa-solid fa-unlock"></i>
            )}
          </button>
          <h1>
            <strong>FOR</strong> {targetValue}
          </h1>
        </div>
        <div className="flex items-center gap-3 xl:gap-5">
          <button
            className="cursor-pointer text-[12px] xl:text-[16px] flex items-center justify-center"
            onClick={() => setTohelpLocked(!tohelpLocked)}
          >
            {tohelpLocked ? (
              <i className="fa-solid fa-lock"></i>
            ) : (
              <i className="fa-solid fa-unlock"></i>
            )}
          </button>
          <h1>
            <strong>TO HELP</strong> {tohelpValue}
          </h1>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          icon="fa-solid fa-play"
          variant="primary"
          onClick={() => {
            setShowModal(true);
          }}
        >
          Start Interview
        </Button>
      </div>
    </Dynamiccontainer>
  );
};

export default Challangecycle;
