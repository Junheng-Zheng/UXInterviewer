"use client";
import Animatedlink from "../Atoms/Animatedlink";
import Dynamiccontainer from "../Atoms/Dynamiccontainer";
import Profile from "../Molecules/Profile";
const Profilenavbar = ({ className }) => {
  return (
    <Dynamiccontainer
      className={` flex z-20 justify-between py-[48px] ${className}`}
    >
      <div className="flex items-center  gap-6">
        <Animatedlink>Interview</Animatedlink>
        <Animatedlink>History</Animatedlink>
      </div>
      <Profile />
    </Dynamiccontainer>
  );
};

export default Profilenavbar;
