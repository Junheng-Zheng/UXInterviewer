"use client";
import { useState } from "react";
import Listitem from "../Atoms/Listitem";
const Dropdown = ({ children, className, text, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex text-xs relative flex-col gap-2">
      <p className="uppercase ">{text}</p>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} active:scale-90 hover:scale-98 transition-all hover:bg-gray-50 relative gap-9 border border-gray-200 flex items-center justify-center cursor-pointer px-[16px] py-[12px] rounded-full `}
      >
        {children}
        <i
          className={`fa-solid ${
            isOpen && "rotate-180"
          } fa-chevron-down transition-all duration-300`}
        ></i>
      </button>
      <div
        className={`${
          isOpen
            ? "max-h-[300px] border-gray-200 p-1 "
            : "max-h-0 border-transparent"
        } absolute bottom-0 left-0 translate-y-[calc(100%+12px)] z-5   gap-1 flex flex-col overflow-hidden  border   w-full bg-white rounded-[12px] transition-all duration-300`}
      >
        {options &&
          options.map((option, index) => (
            <Listitem
              key={option.value}
              className={`${index !== 0 && "border-t border-gray-200 "}`}
            >
              {option.label}
            </Listitem>
          ))}
      </div>
    </div>
  );
};

export default Dropdown;
