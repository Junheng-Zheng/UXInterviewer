import Link from 'next/link';

export default function Navbar({ activeTab = 'interview', className}) {
  return (
    <nav className={` flex gap-[36px] items-start justify-center p-[32px] ${className}`}>
     <div className="flex gap-[36px] items-start justify-center">
         <Link href="/">
        <div className="flex flex-col gap-[4px] items-center justify-center cursor-pointer">
          <p className="font-serif text-[20px] text-black">
            Interview
          </p>
          {activeTab === 'interview' && (
            <div className="bg-[#3168f5] h-px w-[65px]" />
          )}
        </div>
      </Link>
      <Link href="/history">
        <div className="flex flex-col gap-[4px] items-center justify-center cursor-pointer">
          <p className="font-serif text-[20px] text-black">
            History
          </p>
          {activeTab === 'history' && (
            <div className="bg-[#3168f5] h-px w-[50px]" />
          )}
        </div>
      </Link>   
     </div>
    </nav>
  );
}

