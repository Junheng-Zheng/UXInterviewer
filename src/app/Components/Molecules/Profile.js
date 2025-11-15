import Listitem from "../Atoms/Listitem";
import { useState } from "react";
const Profile = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="h-[56px] hover:scale-98 transition-all cursor-pointer w-[56px] rounded-full bg-primary"
        onClick={() => setIsOpen(!isOpen)}
      ></button>
      <div
        className={`${
          isOpen
            ? "max-h-[300px] border-border p-[12px] opacity-100"
            : "max-h-0 border-transparent opacity-0"
        } absolute bottom-0 right-0  flex  overflow-hidden  flex-col gap-1 translate-y-[calc(100%+12px)]  z-1 border w-[240px] bg-white rounded-[12px] rounded-tr-none transition-all duration-300`}
      >
        <Listitem>
          <i className="fa-solid fa-gear "></i> Settings
        </Listitem>
        <Listitem>
          <i className="fa-solid fa-envelope"></i> Contact
        </Listitem>
        <Listitem className="bg-red-100 justify-between rounded-[8px]">
          Logout
          <i className="fa-solid fa-sign-out"></i>
        </Listitem>
      </div>
    </div>
  );
};

export default Profile;
