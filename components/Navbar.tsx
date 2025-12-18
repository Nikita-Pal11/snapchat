'use client'
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Search, UserRoundPlus, BellRing } from "lucide-react";
import Link from "next/link";
import { useCurrUser } from "./UserContext";

function Navbar() {
  const { curruser, notificationlength } = useCurrUser();

  return (
    <div className="w-full max-w-[420px] mx-auto bg-black relative z-10">
      <div className="
        h-16 
        flex items-center px-4 gap-4
      ">
        {/* User */}
        <div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        {/* Search */}
        <Link href="/SearchPage">
          <Search className="text-white hover:text-yellow-400 transition-colors" size={26} />
        </Link>

        {/* Title */}
        <p className="text-white text-lg font-semibold ml-2">Chat</p>

        {/* Right Icons */}
        <div className="ml-auto flex gap-4 items-center">
          <Link href="/Requests">
            <UserRoundPlus className="text-white hover:text-yellow-400 transition-colors" size={26} />
          </Link>

          <Link href="/notifications" className="relative inline-flex items-center">
            <BellRing size={26} className="text-white hover:text-yellow-400 transition-colors" />
            {notificationlength > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 
                               flex items-center justify-center
                               bg-yellow-400 text-black text-[10px] font-bold 
                               rounded-full animate-pulse">
                {notificationlength}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Faded line below navbar */}
      <div className="h-px w-full bg-white/10 backdrop-blur-sm"></div>
    </div>
  );
}

export default Navbar;
