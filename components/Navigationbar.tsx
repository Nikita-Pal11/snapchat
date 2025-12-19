'use client'
import { Camera, MessageCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

function Navigationbar() {
const router=useRouter();
  return (
    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center pointer-events-none">
      <div className="flex items-center justify-between w-60 pointer-events-auto">

        {/* Chat Icon */}
        <MessageCircle
          size={22}
          className="text-white/70 hover:text-[#FFFC00] transition-colors duration-200 cursor-pointer"
          onClick={()=>{router.push("/")}}
        />

        {/* Camera Shutter */}
        <button
          className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center shadow hover:shadow-lg active:scale-95 transition"
          onClick={()=>{router.push("/camera")}}
        >
          <div className="w-10 h-10 rounded-full bg-white" />
        </button>

        {/* Friends Icon */}
        <Users
          size={22}
          className="text-white/70 hover:text-[#FFFC00] transition-colors duration-200 cursor-pointer"
          onClick={()=>{router.push("/SearchPage")}}
        />

      </div>
    </div>
  );
}

export default Navigationbar;
