"use client";
import { useState } from "react";
import History from "../Pages/History";
import Whiteboard from "../Pages/Whiteboard";
const Navigation = () => {
  const [navSelected, setNavSelected] = useState("Whiteboard");
  return (
    <div className="text-black p-12 flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center border-b-[0.5px] border-gray-200 pb-4 justify-between">
        <div className="flex items-center gap-3 rounded-full text-xs px-4 py-2 bg-gray-100">
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
        <div className="w-[42px] h-[42px] rounded-full bg-black" />
      </div>
      {/* content */}
      {navSelected === "Whiteboard" && <Whiteboard />}
      {navSelected === "History" && <History />}
    </div>
  );
};

export default Navigation;
