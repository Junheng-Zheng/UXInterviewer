import Link from 'next/link';

export default function Navbar({ activeTab = 'interview', className}) {
  return (
    <nav className={` flex  items-start justify-center ${className}`}>
     <div className="flex gap-2 py-2 px-4 bg-gray-100 rounded-xl items-start justify-center">
         <Link href="/dashboard">
        <div className="flex flex-col gap-[4px] items-center justify-center cursor-pointer">
          <p className={`  px-3 py-2 rounded-lg flex items-center justify-center text-black ${activeTab === 'interview' ? 'bg-[#262626] text-white' : 'text-black bg-white'}`}>
            Interview
          </p>
        </div>
      </Link>
      <Link href="/history">
        <div className="flex flex-col gap-[4px] items-center justify-center cursor-pointer">
          <p className={` px-3 py-2 flex rounded-lg items-center justify-center text-black ${activeTab === 'history' ? 'bg-[#262626] text-white' : 'text-black bg-white'}`}>
            History
          </p>
        </div>
      </Link>   
     </div>
    </nav>
  );
}

