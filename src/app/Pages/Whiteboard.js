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
  const [selected, setSelected] = useState("Easy");

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

  /* ---------- pools ---------- */
  const [pools, setPools] = useState({
    design: {},
    target: {},
    tohelp: {},
  });

  /* ---------- load CSV ---------- */
  useEffect(() => {
    fetch("/csv/challenges.csv")
      .then((res) => {
        if (!res.ok) throw new Error("CSV not found");
        return res.text();
      })
      .then((text) => {
        const lines = text.trim().split(/\r?\n/).slice(1);

        const grouped = { design: {}, target: {}, tohelp: {} };

        lines.forEach((line) => {
          if (!line.trim()) return;

          const [type, difficulty, domain, ...rest] = line.split(",");
          const value = rest.join(",").trim();
          const domains = domain.split("|");

          grouped[type] ??= {};
          grouped[type][difficulty] ??= {};

          domains.forEach((d) => {
            grouped[type][difficulty][d] ??= [];
            grouped[type][difficulty][d].push(value);
          });
        });

        setPools(grouped);
      })
      .catch(console.error);
  }, []);

  /* ---------- helpers ---------- */
  const randomFrom = (arr, prev) => {
    if (!arr || arr.length === 0) return null;
    if (arr.length === 1) return arr[0];

    let next;
    do {
      next = arr[Math.floor(Math.random() * arr.length)];
    } while (next === prev);

    return next;
  };

  const getSharedDomains = (difficulty) => {
    const d = Object.keys(pools.design[difficulty] || {});
    const t = Object.keys(pools.target[difficulty] || {});
    const h = Object.keys(pools.tohelp[difficulty] || {});

    return d.filter((domain) => t.includes(domain) && h.includes(domain));
  };

  /* ---------- actions ---------- */
  const reloadChallenge = () => {
    const domains = getSharedDomains(selected);
    if (!domains.length) return;

    const domain = domains[Math.floor(Math.random() * domains.length)];

    const d = pools.design[selected][domain];
    const t = pools.target[selected][domain];
    const h = pools.tohelp[selected][domain];

    setDesign(randomFrom(d, design));
    setTarget(randomFrom(t, target));
    setTohelp(randomFrom(h, tohelp));
  };

  /* ---------- auto reload ---------- */
  useEffect(() => {
    if (pools.design[selected]) {
      reloadChallenge();
    }
  }, [selected, pools]);

  /* ---------- render ---------- */
  return (
    <div className="flex z-2 flex-col gap-8">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <button
            className="absolute inset-0"
            onClick={() => setShowModal(false)}
          />

          <div className="w-[400px] z-50 flex flex-col gap-4 p-6 rounded-[24px] bg-white">
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
              className="text-xs hover:scale-95 transition-all"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 p-8 relative">
        <div className="absolute top-0 left-0 border-l border-t border-gray-300 w-[24px] aspect-square" />
        <div className="absolute top-0 right-0 border-r border-t border-gray-300 w-[24px] aspect-square" />
        <div className="absolute bottom-0 left-0 border-l border-b border-gray-300 w-[24px] aspect-square" />
        <div className="absolute bottom-0 right-0 border-r border-b border-gray-300 w-[24px] aspect-square" />

        {/* difficulty */}
        <div className="flex border-b border-gray-200 text-xs gap-4">
          {["Easy", "Medium", "Hard"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={`uppercase group flex flex-col gap-2 font-space-mono ${
                selected === cat ? "text-orange-600" : ""
              }`}
            >
              <span className="group-hover:-translate-y-1 transition-all duration-300">
                {cat}
              </span>
              {selected === cat && (
                <div className="w-full h-px bg-orange-600" />
              )}
            </button>
          ))}
        </div>

        {/* controls */}
        <div className="flex gap-3 items-end">
          <Button
            onClick={() => {
              reloadChallenge();
              setReloadRotation((r) => r + 180);
            }}
          >
            <i
              className="fa-solid fa-refresh transition-all"
              style={{ transform: `rotate(${reloadRotation}deg)` }}
            />
            Refresh Challenge
          </Button>

          <Counter
            onMinus={() => setTime(Math.max(5, time - 5))}
            onPlus={() => setTime(time + 5)}
          >
            {time} min
          </Counter>
        </div>

        {/* challenge */}
        {design && target && tohelp && (
          <div className="text-[48px] shoulder flex flex-col gap-3 font-bold leading-[48px]">
            <div className="pb-3 border-b border-gray-200">
              <Decryptedtext text={`DESIGN ${design}`} animateOn="view" />
            </div>
            <div className="pb-3 border-b border-gray-200">
              <Decryptedtext text={`FOR ${target}`} animateOn="view" />
            </div>
            <div className="pb-3 border-b border-gray-200">
              <Decryptedtext text={`TO HELP ${tohelp}`} animateOn="view" />
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-3">
          <p className="uppercase font-space-grotesk">Interviewer Settings</p>

          <div className="flex gap-2 items-end">
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

        <button
          onClick={() => setShowModal(true)}
          className="flex px-6 py-4 rounded-full bg-orange-500 text-white gap-2 font-space-grotesk"
        >
          Start Interview
          <i className="fa-solid fa-play" />
        </button>
      </div>
    </div>
  );
};

export default Whiteboard;
