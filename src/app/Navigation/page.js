"use client";
import { useState } from "react";
import History from "../Pages/History";
import Whiteboard from "../Pages/Whiteboard";
import Button from "../Components/Atoms/Button";
import Link from "next/link";
const Navigation = () => {
  const [navSelected, setNavSelected] = useState("Whiteboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className="text-black/80 p-12 flex flex-col gap-4">
      {/* <div className="absolute inset-0 bg-grid pointer-events-none" /> */}
      {/* header */}
      <div className="flex z-20 items-center border-b-[0.5px] border-gray-200 pb-4 justify-between">
        <div className="flex items-center gap-3 rounded-full text-xs px-2.5 py-2 bg-gray-100">
          {["Whiteboard", "History"].map((item) => (
            <button
              key={item}
              onClick={() => setNavSelected(item)}
              className={`cursor-pointer flex items-center justify-center p-2 rounded-full transition-all duration-300
                ${
                  navSelected === item
                    ? "w-[120px] bg-gray-200 gap-2"
                    : "w-[40px]"
                }`}
            >
              <i
                className={`fa-solid ${
                  item === "Whiteboard"
                    ? "fa-pencil"
                    : item === "History"
                    ? "fa-calendar"
                    : "fa-gear"
                }`}
              />
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  navSelected === item
                    ? "max-w-[80px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                {item}
              </div>
            </button>
          ))}
        </div>
        <div className="relative">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-[42px] h-[42px] rounded-full bg-black"
          />
          <div
            className={`w-[200px] scale-95 transition-all duration-300 opacity-0 absolute translate-y-[12px] right-0 bg-white z-20 border border-gray-200 rounded-lg p-4  h-fit flex flex-col gap-2 ${
              settingsOpen ? "scale-100 opacity-100" : ""
            }`}
          >
            <Link href="/Settings">
              <Button icon="fa-solid fa-gear" className="w-full">
                Settings
              </Button>
            </Link>
            <Button icon="fa-solid fa-sign-out" className="w-full">
              Logout
            </Button>
          </div>
        </div>
      </div>
      {/* content */}
      {navSelected === "Whiteboard" && <Whiteboard />}
      {navSelected === "History" && <History />}
    </div>
  );
};

export default Navigation;
