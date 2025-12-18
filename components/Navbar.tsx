'use client'
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Search, UserRoundPlus, CircleEllipsis, BellRing } from "lucide-react";
import Link from "next/link";
import { useCurrUser } from "./UserContext";

function Navbar() {
  const {curruser,notificationlength}=useCurrUser()
  return (
    <div className="
      w-full 
      max-w-[420px]       /* Desktop → mobile size */
      h-16 
      bg-black 
      flex items-center 
      px-4
      mx-auto             /* Center on desktop */
      gap-4
    ">
      
      
      <div className="">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

   
      <Link href="/SearchPage">
        <Search className="text-white" size={26} />
      </Link>

  
      <p className="text-white text-lg font-semibold ml-2">
        Chat
      </p>

     
      <div className="ml-auto flex gap-4 items-center">
        <Link href="/Requests">
          <UserRoundPlus className="text-white" size={26} />
        </Link>
        <Link href="/notifications" className="relative inline-flex items-center">
  {/* Bell */}
  <BellRing size={26} className="text-white" />

  {/* Notification Badge */}
  {notificationlength > 0 && (
    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 
                     flex items-center justify-center
                     bg-yellow-400 text-black text-[10px] font-bold 
                     rounded-full">
      {notificationlength}
    </span>
  )}
</Link>
      </div>
    </div>
  );
}

export default Navbar;
