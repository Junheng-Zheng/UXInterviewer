'use client';
import Link from 'next/link';
import { House, User, SquareArrowOutUpRight, ChevronDown, Save, Mail, Lock, MapPin } from 'lucide-react';
import { CreditCard } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { BookUser } from 'lucide-react';
const Page= () => {

  const [activeTab, setActiveTab] = useState('account');
  return (
    <div className = "flex flex-col text-sm  h-screen gap-0">
              {/* <Link
          href="/"
          className="inline-flex px-12 border-b border-gray-200 w-full bg-gray-100 py-6 items-center gap-2 text-gray-600 hover:text-gray-900  transition-colors duration-200"
        >
          <House size={20} strokeWidth={1.3} /> Back
        </Link> */}


      <div className = "flex w-full h-full flex-1  bg-gray-200">
      <div className = "relative flex flex-col  top-0 border-r border-gray-200 justify-center  bg-gray-50 w-fit px-8 gap-2 ">
        <Link
          href="/"
          className="inline-flex absolute top-0 left-0 px-8 border-b border-gray-200 w-full  py-6 items-center gap-2 text-gray-600 hover:text-gray-900  transition-colors duration-200"
        >
          <House size={20} strokeWidth={1.3} /> Back
        </Link>
        <div className = {`flex cursor-pointer px-4 py-3 items-center gap-2 rounded-xl ${activeTab === 'account' ? ' bg-blue-100 ' : 'bg-white'}`} onClick={() => setActiveTab('account')}>
          <User size={20} strokeWidth={1.3} />
          Account 
        </div>
        <div className = {`flex cursor-pointer px-4 py-3 items-center gap-2 rounded-xl ${activeTab === 'subscriptions' ? ' bg-blue-100 ' : 'bg-white'}`} onClick={() => setActiveTab('subscriptions')}>
          <CreditCard size={20} strokeWidth={1.3} />
          Subscriptions
        </div>
        {/* <div className = {`flex cursor-pointer px-4 py-3 items-center gap-2 ${activeTab === 'signout' ? ' bg-white rounded-xl' : ''}`} >
          <LogOut size={20} strokeWidth={1.3} />
          Sign Out
        </div> */}
      </div>
      <div className = " bg-gray-100 p-8 relative flex-1 h-full flex w-full">
<div
        className="absolute top-0 left-0   inset-0 z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>
        {/* overflow container */}
        {activeTab === 'account' && 
        <div className = "w-full flex-1 overflow-y-auto relative flex flex-col  scrollbar-hide bg-white rounded-xl  ">

          <div className = "w-full p-9  px-24 border-b border-gray-200 ">
          
           <div className = "w-full z-20 h-[240px] relative rounded-lg  overflow-hidden">
            <Image src="/talking.png" alt="profile" fill className = "w-full h-full object-cover object-center brightness-70" />
            <p className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-3xl font-serif">Account Information</p>
           </div>
          </div>

            <div className = "w-full flex flex-col  border-b border-gray-200">
             <div className = " flex flex-col gap-8 p-8 px-24">
                 <h3 className = "text-2xl font-serif">Profile</h3>
              <div className = "flex gap-2 items-center">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <BookUser size={16} strokeWidth={1.3} className="text-gray-600" /> Name</div>
                <div className = "flex items-center gap-2 w-full">
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">First Name</p>
                    <input type="text"  placeholder="John" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Last Name</p>
                    <input type="text"  placeholder="Doe" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                </div>
              
              </div>
                <div className = "flex gap-2 items-start">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <Mail size={16} strokeWidth={1.3} className="text-gray-600" /> Email</div>
                <div className = "flex flex-col items-center gap-8 w-full">
                 <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Current Email</p>
                    <input type="text"  placeholder="John" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                   <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">New Email</p>
                    <input type="text"  placeholder="John" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                
                </div>
              </div>
            <div className = "w-full flex justify-end">
              <button className="px-4 py-3 w-fit bg-gray-100 text-gray-600 rounded-lg flex items-center gap-2 "> <Save size={16} strokeWidth={1.3} className="text-gray-600" /> Save Profile Changes</button>
            </div>
            </div>
           </div>
            
             <div className = " flex flex-col px-24 gap-8 p-8">
               <h3 className = "text-2xl font-serif">Security</h3>
              <div className = "flex  gap-2 items-start">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <Lock size={16} strokeWidth={1.3} className="text-gray-600" /> Password</div>
                <div className = "flex flex-col items-center gap-8 w-full">
                  <div className = "flex gap-2  w-full flex-col">
                    <p className = "text-sm text-gray-600">Current Password</p>
                    <input type="text"  placeholder="John" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>

                       <div className = "flex items-center gap-2 w-full">
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">New Password</p>
                    <input type="password"  placeholder="••••••••" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Confirm New Password</p>
                    <input type="password"  placeholder="••••••••" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                </div>

                </div>
              </div>
              <div className = "w-full flex justify-end">
               <button className="px-4 py-3 w-fit bg-gray-100 text-gray-600 rounded-lg flex items-center gap-2 "> <Save size={16} strokeWidth={1.3} className="text-gray-600" /> Save Security Changes</button>
               </div>
            </div>
         
         

        </div>}
        
        {activeTab === 'subscriptions' && 
        <div className = "w-full flex-1 overflow-y-auto relative flex flex-col  scrollbar-hide bg-white rounded-xl  ">

          <div className = "w-full p-9  px-24 border-b border-gray-200 ">
          
           <div className = "w-full z-20 h-[240px] relative rounded-lg  overflow-hidden">
            <Image src="/talking.png" alt="profile" fill className = "w-full h-full object-cover object-center brightness-70" />
            <p className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-3xl font-serif">Subscriptions</p>
           </div>
          </div>

            <div className = "w-full border-b border-gray-200">
             <div className = "flex flex-col gap-8 p-8 px-24">
                 <h3 className = "text-2xl font-serif">Customer & Billing Overview</h3>

                 <div className="flex justify-between items-center p-6 rounded-xl bg-gray-100 ">
  <div className="flex flex-col gap-2">
    <p className="text-sm text-gray-600">Current Plan</p>
    <div className="flex items-center gap-2">
      <p className="text-xl font-serif px-3 py-2 rounded-xl bg-pink-100">Pro Yearly </p>
    — $11 / month

      </div>
  </div>
  <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg ">Manage</button>
</div>


              <div className = "flex gap-2 items-center">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <BookUser size={16} strokeWidth={1.3} className="text-gray-600" /> Customer Name</div>
                <div className = "flex items-center gap-2 w-full">
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">First Name</p>
                    <input type="text"  placeholder="John" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Last Name</p>
                    <input type="text"  placeholder="Doe" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                </div>
              </div>
                <div className = "flex gap-2 items-start">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <MapPin size={16} strokeWidth={1.3} className="text-gray-600" /> Billing Address</div>
                <div className = "flex flex-col items-center gap-8 w-full">
                 <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Address Line 1</p>
                    <input type="text"  placeholder="John" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                 <div className = "flex gap-2 w-full">
 <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">City</p>
                    <input type="text"  placeholder="New York" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Country</p>
                    <input type="text"  placeholder="United States" className = "w-full bg-white  rounded-xl border border-gray-200 px-4 py-3" />
                  </div>

                  </div>
                                   <div className = "flex gap-2 w-full">

                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Zip Code</p>
                    <input type="text"  placeholder="10001" className = "w-full bg-white  rounded-xl border border-gray-200 px-4 py-3" />
                  </div>

                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">State</p>
                    <input type="text"  placeholder="New York" className = "w-full bg-white  rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                  </div>

                  
                  
                </div>

                
              </div>
              <div className = "w-full flex justify-end">
               <button className="px-4 py-3 w-fit bg-gray-100 text-gray-600   rounded-lg flex items-center gap-2 "> <Save size={16} strokeWidth={1.3} className="text-gray-600" /> Save Billing Information</button>  
               </div>
                 <div className="flex justify-between items-center p-6 rounded-xl bg-gray-100 ">
  <div className="flex flex-col gap-2">
    <p className="text-sm text-gray-600">Payment Method</p>
    <p className="text-xl font-serif">Visa ending in 4242 • Expires 08/27</p>
  </div>
  <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg ">Update</button>
</div>

               

            </div>
           </div>
            
             <div className = "flex flex-col gap-8 px-24 p-8">

              <div className = "w-full flex justify-between items-center">
                <h3 className = "text-2xl font-serif">Billing Invoices</h3>
                <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg flex items-center gap-2 ">January 2026 <ChevronDown size={16} strokeWidth={2} className="text-gray-600" /></button>
              </div>

                        <div className = "w-full flex flex-col border border-gray-100 rounded-xl">
                              {/* invoices header */}
             <div className = "w-full flex-1 flex items-center px-4 py-3 bg-gray-100">
              <div className = "w-full justify-center flex-1 flex items-center"> <p>Date</p></div>
              <div className = "w-full justify-center flex-1 flex items-center"> <p>Invoice</p></div>
              <div className = "w-full justify-center flex-1 flex items-center"> <p>Amount</p></div>
              <div className = "w-full justify-center flex-1 flex items-center"> <p>Status</p></div>
              <div className = "w-full justify-center items-center flex-1 flex "> <p>Actions</p></div>

              </div>

              {/* invoices body */}
              {Array.from({ length: 4 }).map((_, index, array) => (

                <div key={index} className = {`w-full text-gray-600 flex-1 flex items-center px-4 py-3  border-b border-gray-200 ${index === array.length - 1 ? 'border-b-0' : ''}`}>
                <div className = "w-full justify-center flex-1 flex items-center"> <p>2026-01-01</p></div>
                <div className = "w-full justify-center flex-1 flex items-center"> <p>Inv-001</p></div>
                <div className = "w-full justify-center flex-1 flex items-center"> <p>$11</p></div>
                <div className = "w-full justify-center flex-1 flex items-center"> <p>Paid</p></div>
                <div className = "w-full justify-center items-center flex-1 flex gap-2 "> <p>View</p> <SquareArrowOutUpRight size={16} strokeWidth={2} className="text-gray-600" /></div>
                </div>
              ))}
              </div>

            </div>
         
         

        </div>}



        
      </div>
       
    </div>
    </div>
  );
};

export default Page;