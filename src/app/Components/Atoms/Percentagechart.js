"use client";
import { useState, useEffect } from "react";
const Percentagechart = ({ percentage, title, selected = false }) => {
  const [percentageValue, setPercentageValue] = useState(0);
  const [sliderColor, setSliderColor] = useState("#384da8");

  useEffect(() => {
    const interval = setInterval(() => {
      setPercentageValue((prev) => {
        if (prev >= percentage) {
          clearInterval(interval);
          return percentage;
        }
        return prev + 1;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [percentage]);

  useEffect(() => {
    if (percentageValue <= 33) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSliderColor("#ff3b30"); // red
    } else if (percentageValue <= 66) {
      setSliderColor("#ffcc00"); // yellow
    } else {
      setSliderColor("#34c759"); // green
    }
  }, [percentageValue]);

  return (
    <div
      className={` relative flex flex-col  w-[180px] h-[180px]  transition-all duration-300 hover:opacity-100 items-center justify-center rounded-full ${
        selected ? "" : "opacity-50"
      }`}
    >
      <p
        style={{ color: sliderColor }}
        className="text-[36px]  shoulder font-bold transition-colors duration-500 ease-in-out"
      >
        {percentageValue}%
      </p>
      <p
        style={{ color: sliderColor }}
        className="text-[12px] text-tertiary transition-colors duration-500 ease-in-out "
      >
        {title}
      </p>
      <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 z-5">
        <svg viewBox="0 0 36 36">
          <path
            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#dce3ff"
            strokeWidth="4"
            strokeDasharray="100, 100"
          />
        </svg>
      </div>
      <div className="absolute top-1/2 left-1/2 transition-all duration-300 w-full h-full -translate-x-1/2 -translate-y-1/2 z-10">
        <svg viewBox="0 0 36 36">
          <path
            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={sliderColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${percentageValue}, 100`}
            className="transition-colors duration-500 ease-in-out"
          />
        </svg>
      </div>
    </div>
  );
};

export default Percentagechart;
