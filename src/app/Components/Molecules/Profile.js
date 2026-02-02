import Listitem from "../Atoms/Listitem";
import { useState, useEffect } from "react";
import Link from "next/link";
const Profile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="relative flex items-center gap-3 w-[240px]">
      <button
        className="h-[56px] hover:scale-98 transition-all cursor-pointer w-[56px] rounded-full bg-primary flex-shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      ></button>
      {user?.name && (
        <span className="text-black font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {user.name}
        </span>
      )}
      <div
        className={`${
          isOpen
            ? "max-h-[300px] border-border p-[12px] opacity-100"
            : "max-h-0 border-transparent opacity-0"
        } absolute bottom-0 left-0  flex  overflow-hidden  flex-col gap-1 translate-y-[calc(100%+12px)]  z-1 border w-[240px] bg-white rounded-[12px] rounded-tl-none transition-all duration-300`}
      >
        <div className="px-[10px] py-[12px] border-b border-gray-200 mb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 uppercase font-space-mono">Current Plan</span>
            <span className="text-sm font-medium text-primary">{user?.tier || 'Free'}</span>
          </div>
          <Link
            href="/plans"
            className="w-full cursor-pointer bg-primary text-white hover:bg-primary/90 transition-all duration-300 rounded-[8px] px-[16px] py-[8px] text-sm font-medium flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-crown"></i>
            Upgrade to Pro
          </Link>
        </div>
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
