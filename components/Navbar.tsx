import React from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Search, UserRoundPlus, CircleEllipsis } from "lucide-react";
import Link from "next/link";

function Navbar() {
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
        <button>
          <CircleEllipsis className="text-white" size={26} />
        </button>
      </div>
    </div>
  );
}

export default Navbar;
