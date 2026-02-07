import Listitem from "./Atoms/Listitem";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronsUpDown, Cog, LogOut, Crown } from "lucide-react";
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
    <div className = "w-fit h-fit">
     {isOpen && <button onClick={() => setIsOpen(!isOpen)} className = "w-full  absolute top-0 right-0 h-full cursor-pointer z-500"/>}
          <div className="relative  flex items-center gap-3 ">
      {/* <button
        className="h-[56px] hover:scale-98 transition-all cursor-pointer w-[56px] rounded-full bg-primary "
        onClick={() => setIsOpen(!isOpen)}
      ></button> */}
      {user?.name && (
        <button onClick={() => setIsOpen(!isOpen)} className="text-black/80 cursor-pointer whitespace-nowrap overflow-hidden text-sm  bg-gray-100 rounded-xl  px-4 py-3 flex items-center justify-center gap-2">
          {user.name}
          <ChevronsUpDown size={16} />

        </button>
      )}
      <div
        className={`${
          isOpen
            ? "max-h-[300px] border-gray-200 opacity-100 scale-100"
            : "max-h-0 border-transparent opacity-0 scale-95"
        } absolute bottom-0 right-0 p-4  flex  overflow-hidden bg-gray-50 flex-col gap-4 translate-y-[calc(100%+12px)]  z-500 border w-[240px]  rounded-xl transition-all duration-300`}
      >
        <div className="  flex flex-col gap-4 ">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 ">Current Plan</span>
            <span className="text-sm  text-gray-800">{user?.tier || 'Free'}</span>
          </div>
          <Link
            href="/plans"
            className="w-full cursor-pointer bg-blue-100 hover:bg-blue-200 transition-all duration-300 rounded-[8px] px-[16px] py-[8px]  flex items-center justify-center gap-2"
          >
            <Crown size={16} strokeWidth={1.3} />
            Upgrade to Pro
          </Link>
        </div>
        <Listitem href="/settings">
          <Cog size={16} strokeWidth={1.3} />  Settings
        </Listitem>
<Listitem href="/api/auth/logout">
          <LogOut size={16} strokeWidth={1.3} />           Logout
        </Listitem>
      </div>
    </div>
    </div>
  );
};

export default Profile;
