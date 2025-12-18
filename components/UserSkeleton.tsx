import React from 'react'

function UserSkeleton() {
   return (
    <div className="bg-[#111] rounded-xl px-3 py-2 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-white/10" />

      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-2 w-36 bg-white/10 rounded" />
      </div>

      <div className="h-7 w-16 bg-white/10 rounded-full" />
    </div>
  );
}

export default UserSkeleton

