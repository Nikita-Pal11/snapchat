'use client'
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import { Search, UserRoundPlus, BellRing } from "lucide-react";
import Link from "next/link";
import { useCurrUser } from "./UserContext";

function Navbar() {
  const { curruser, notificationlength, logoutGuest } = useCurrUser();
  const { isSignedIn } = useUser();

  return (
    <div className="w-full max-w-[420px] mx-auto bg-black relative z-10">
      <div className="
        h-16 
        flex items-center px-4 gap-4
      ">
        {/* User */}
        <div>
          {isSignedIn ? (
            <SignedIn>
              <UserButton />
            </SignedIn>
          ) : (
            curruser && (
              <button
                onClick={() => {
                  const confirmLogout = window.confirm("You are logged in as a Guest. Would you like to exit guest mode?");
                  if (confirmLogout) {
                    logoutGuest();
                  }
                }}
                title="Guest Profile - Click to Exit Guest Mode"
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-yellow-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center bg-gray-800"
              >
                <img
                  src={curruser.avatar || "/avatar.png"}
                  alt={curruser.name || "Guest"}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          )}
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
