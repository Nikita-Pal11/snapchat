'use client'

import { use, useEffect, useState } from "react"
import { useCurrUser } from "./UserContext";
import gqlclient from "@/service/gql";
import { FRIEND_LIST } from "@/service/gql/queries";
import { motion } from "framer-motion";
import UserComp from "./Usercomp";
import { useRouter } from "next/navigation";
import SubtitleComp from "./SubtitleComp";
import socket from "@/app/services/socket";
import { ArrowRight, MessageCircle, Square, X } from "lucide-react";

import UserSkeleton from "./UserSkeleton";

type LastMessage = {
  id: string;
  roomid: string;
  type: "TEXT" | "SNAP" | "IMAGE" | "VIDEO";
  senderid: string;
  receiverid: string;
  mediaurl?: string | null;
  isopened: boolean;
  createdAt: string;
  updatedAt: string;
};

type ClientUser = {
  id: string;
  clerkId: string;
  name: string | null;
  avatar: string | null;
};

type ClientFriend = {
  id: string;
  userId: string;
  friendId: string;
  streaks: number;
  friend: ClientUser;
  lastmsg?: LastMessage;
};


function Friends() {
  const[friendlist,setfriendlist]=useState<ClientFriend[]>([]);
  const[loading,setloading]=useState(false);
  const{curruser}=useCurrUser();
  const[opensnap,setopensnap]=useState<ClientFriend | null>(null);
 function openSnap(val: ClientFriend) {
  const lastmsg = val.lastmsg;
  if (!lastmsg?.id || !lastmsg.roomid) return;
  if (lastmsg.isopened) return;

  setfriendlist((prev) =>
    prev.map((f) => {
      if (f.lastmsg?.id === lastmsg.id) {
        return {
          ...f,
          lastmsg: {
            ...f.lastmsg,
            id: f.lastmsg.id!,       
            roomid: f.lastmsg.roomid!,
            isopened: true
          }
        };
      }
      return f;
    })
  );

  setopensnap(val);

  setTimeout(() => {
    setopensnap(null);
  }, 3000);

  socket.emit("open_snap", { mid: lastmsg.id, roomid: lastmsg.roomid });
}

  useEffect(() => {
  socket.on("rec_snap", ({ resp }) => {
    setfriendlist((prev) =>
      prev?.map((val) => {
        if (val.lastmsg?.id === resp.id) {
          return {
            ...val,
            lastmsg: resp,
          };
        }
        return val;
      })
    );
  });

  return () => {
    socket.off("rec_snap");
  };
}, []);
useEffect(()=>{
  socket.on("friend_lastmsg",({resp})=>{
    console.log("📩 friend_lastmsg received", resp);
    const lastmsg={
       id: resp.id,
    roomid: resp.roomid,
    type: resp.type,
    receiverid:resp.receiverid,
    senderid: resp.senderid,
    isopened: resp.isopened,
    mediaurl: resp.mediaurl,
     createdAt: resp.createdAt,
  updatedAt: resp.updatedAt,
    }
     setfriendlist((prev) =>
      prev?.map((val) => {
        const isThisFriend =
             val.friend.id === resp.senderid ||
        val.friend.id === resp.receiverid;
        
        if (!isThisFriend) return val;
        
        return {
          ...val,
          lastmsg,
        };
      })
    );
  })
  return () => {
    socket.off("friend_lastmsg");
  };
},[])
  const router=useRouter();
function formatTime(date?: string) {
  if (!date) return "";

  let time: number;

  // ✅ If it's a millisecond timestamp string
  if (/^\d+$/.test(date)) {
    time = Number(date);
  } else {
    time = new Date(date).getTime();
  }

  if (isNaN(time)) return "";

  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;

  return `${Math.floor(hrs / 24)}d`;
}


  useEffect(()=>{
    if(!curruser)return;
     async function fetchfriends(){
      try{
        setloading(true);
        const resp=await gqlclient.request(FRIEND_LIST,{
          userId:curruser.id
        })
        console.log(resp.friendsList);
        setfriendlist(resp.friendsList || []);
      }
      catch(err){
        console.log(err);
      }
      finally{
        setloading(false);
      }
     }
     fetchfriends();
  },[curruser])
  return (
    <div className="flex justify-center w-full h-screen text-white">
      <div className="w-full max-w-[420px] h-full flex flex-col bg-black">

        <div className="flex-1 overflow-y-auto no-scrollbar overscroll-none">
  {loading && (
  <div className="space-y-2">
    {[...Array(4)].map((_, i) => (
      <UserSkeleton key={i} />
    ))}
  </div>
)}

{!loading && friendlist?.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-white/60 gap-3">
    <p className="text-lg font-bold">You have no friends yet!</p>
    <p className="text-sm text-white/40 text-center">
      Find and add friends to start chatting instantly!
    </p>
    <button
  onClick={() => router.push("/SearchPage")}
  className="
    px-6 py-2
    bg-yellow-500
    hover:bg-yellow-400
    rounded-lg
    text-black font-semibold
    shadow-md
    transform hover:scale-105 active:scale-95
    transition-all duration-200 ease-in-out
    flex items-center gap-2
  "
>
  <span>Add Friends</span>
  <ArrowRight size={16} />
</button>

  </div>
)}



  {friendlist?.map((val,index) => (
    <motion.div
  key={val.id}
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
  className="
    px-3
    active:bg-white/5
    transition-colors
  "
>
      <UserComp
        name={val.friend.name || ""}
        avatar={val.friend.avatar || ""}
   subtitle={
  <div className="flex items-center justify-between w-full"
  
  >

    {/* LEFT — STATUS */}
    <div className="flex items-center gap-1">

      {/* 🔴 NEW SNAP */}
      {val.lastmsg?.type === "SNAP" &&
      val.lastmsg.senderid !== curruser.id &&
      !val.lastmsg.isopened ? (
        <span
        
          onClick={(e) => {
             e.stopPropagation();
            openSnap(val)}}
          className="flex items-center gap-1 text-red-500 text-sm font-semibold cursor-pointer"
        >
          <Square size={12} fill="currentColor" />
          New Snap
        </span>
      ) : (
        <>
          {/* ◻️ OPENED */}
          {val.lastmsg?.type === "SNAP" &&
          val.lastmsg.isopened && (
            <span className="flex items-center gap-1 text-white/50 text-sm" >
              <Square size={12} />
              Opened
            </span>
          )}

          {/* ➡️ DELIVERED */}
          {val.lastmsg?.type === "SNAP" &&
          !val.lastmsg.isopened && (
            <span className="flex items-center gap-1 text-white/50 text-sm" >
              <ArrowRight size={12} />
              Delivered
            </span>
          )}

          {/* 🔵 CHAT */}
          {val.lastmsg?.type !== "SNAP" && (
            <span className="flex items-center gap-1 text-blue-500 text-sm font-medium" >
              <MessageCircle size={12} />
              Chat
            </span>
          )}
        </>
      )}
    </div>

    {/* RIGHT — TIME · STREAK */}
    <div className="flex items-center text-white/40 text-xs gap-1">

      {/* TIME */}
      {val.lastmsg && (
        <span>
          . {formatTime(
            val.lastmsg.isopened
              ? val.lastmsg.updatedAt
              : val.lastmsg.createdAt
          )}
        </span>
      )}

      {/* DOT */}
      {val.streaks > 0 && <span>·</span>}

      {/* 🔥 STREAK */}
      {val.streaks > 0 && (
        <span className="flex items-center gap-0.5 text-orange-400 font-medium">
          {val.streaks}
          <span>🔥</span>
        </span>
      )}
    </div>
  </div>
}

        showChat
        onChat={()=>router.push(`/Chat/${val.friend.clerkId}`)}
      />
    </motion.div>
    
  ))}
</div>
{opensnap && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div className="absolute top-0 left-0 h-1 w-full bg-white animate-snap-timer" />

            {opensnap.lastmsg?.mediaurl?.endsWith(".mp4") ? (
              <video src={opensnap.lastmsg.mediaurl} autoPlay className="max-h-full" />
            ) : (
              <img src={opensnap.lastmsg?.mediaurl || ""} className="max-h-full" />
            )}

            <button
              className="absolute top-5 right-5 text-white"
              onClick={() => setopensnap(null)}
            >
              <X size={28} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Friends
