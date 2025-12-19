"use client";
import { useState } from "react";
import Button from "../Components/Atoms/Button";
import { useRouter } from "next/navigation";
const Settings = () => {
  const [selected, setSelected] = useState("Profile");
  const router = useRouter();

  const [firstName, setFirstName] = useState("Junheng");
  const [lastName, setLastName] = useState("Zheng");
  const [email, setEmail] = useState("junhengzheng@gmail.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  return (
    <div
      className="flex p-12 text-black/80 flex-col gap-8
  "
    >
      <Button icon="fa-solid fa-arrow-left" onClick={() => router.back()}>
        Back
      </Button>
      <div className="uppercase font-semibold flex gap-2 items-center font-space-grotesk">
        <i className="fa-solid fa-gear"></i>
        Settings
      </div>
      <div className="flex border-b border-gray-200 text-xs gap-4">
        {["Profile", "Subscriptions"].map((cat) => (
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
            {selected === cat && <div className="w-full h-px bg-orange-600" />}
          </button>
        ))}
      </div>
      {selected === "Profile" && (
        <div className="flex flex-col gap-4">
          <p className="uppercase font-space-mono">Profile</p>
          <div className="flex pb-4 border-b border-gray-200 justify-between items-center">
            <div className="w-[64px] h-[64px] rounded-full bg-gray-200" />
            <Button icon="fa-solid fa-pen-to-square">Upload Photo</Button>
          </div>

          <div className="flex  pb-4 border-b border-gray-200 gap-4">
            <p className="uppercase w-full font-space-grotesk">Name</p>
            <div className="flex w-full gap-4 items-center">
              <div className="flex w-full flex-col gap-2">
                <p className="uppercase font-space-mono text-xs">First Name</p>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full  border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <p className="uppercase font-space-mono text-xs">Last Name</p>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full  border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
                />
              </div>
            </div>
          </div>
          <div className="flex  pb-4 border-b border-gray-200 gap-4">
            <p className="uppercase w-full font-space-grotesk">Email</p>
            <div className="flex w-full gap-4 items-center">
              <div className="flex w-full flex-col gap-2">
                <p className="uppercase font-space-mono text-xs">Email</p>
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full  border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
                />
              </div>
            </div>
          </div>
          <div className="flex  pb-4 border-b border-gray-200 gap-4">
            <p className="uppercase w-full font-space-grotesk">Password</p>
            <div className="flex w-full gap-4 items-center">
              <div className="flex w-full flex-col gap-2">
                <p className="uppercase font-space-mono text-xs">
                  Current Password
                </p>
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full  border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <p className="uppercase font-space-mono text-xs">
                  New Password
                </p>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full  border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
