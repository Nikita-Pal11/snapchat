"use client";

import UseSound from "@/app/hooks/UseSound";
import socket from "@/app/services/socket";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
type NotificationType = "CHAT" | "SNAP" | "FRIEND_REQUEST" | "REQUEST_ACCEPTED"
type SocketNotification = {
  type: NotificationType
  message: string
  roomid:string
  sender: {
    id: string
    clerkId:string
    name: string
    avatar?: string | null
  }
}

function SocketProvider() {
  const { isSignedIn, user } = useUser();
 const connectedRef = useRef(false);
  const playSound = UseSound();
  const router = useRouter();
  const snapStyle: Record<NotificationType, { title: string; color: string }> = {
  CHAT: {
    title: "New Chat 💬",
    color: "bg-purple-500",
  },
  SNAP: {
    title: "New Snap 🔥",
    color: "bg-red-500",
  },
  FRIEND_REQUEST: {
    title: "Friend Request 👋",
    color: "bg-blue-500",
  },
   REQUEST_ACCEPTED: {
    title: "Request Accepted 💙",
    color: "bg-green-500",
  },
}


  //NOTIFICATION
  useEffect(() => {
  const handleNotification = ({ resp }: { resp: SocketNotification }) => {
  if (!resp) return
  console.log(resp);
 
  playSound()

  const config = snapStyle[resp.type]

  toast(
    <div
     onClick={() => {
      if (resp.type === "CHAT" || resp.type === "SNAP") {
        router.push(`/Chat/${resp.sender.clerkId}`);
      }
      if (resp.type === "FRIEND_REQUEST") {
        router.push("/Requests");
      }
      if (resp.type === "REQUEST_ACCEPTED") {
        router.push("/");
      }
    }}
      className={`flex items-center gap-3 text-white px-3 py-2 rounded-lg shadow-lg ${config.color}`}
    >
      {/* Avatar */}
      <img
              src={resp.sender?.avatar || "/avatar.png"}
              alt={resp.sender?.name || "user"}
              className="w-12 h-12 rounded-full object-cover"
            />

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span className="text-xs opacity-80">
          {resp.sender?.name}
        </span>

        <span className="text-sm font-semibold">
          {config.title}
        </span>

        <span className="text-xs opacity-90">
          {resp.message}
        </span>
      </div>
    </div>,
    {
      duration: 4500,   // ⏱️ increased duration
      unstyled: true,
    }
  )
}



    socket.on("rec_notification", handleNotification);

    return () => {
      socket.off("rec_notification", handleNotification);
    };
  }, [playSound]);

  // CONNECT + USER ONLINE (AFTER LOGIN)
   useEffect(() => {
    // 🟢 LOGIN
    if (isSignedIn && user && !connectedRef.current) {
      socket.connect();
      connectedRef.current = true;

      socket.on("connect", () => {
        socket.emit("user_connected", { userId: user.id });
        console.log("connected:", socket.id);
      });
    }

    // 🔴 LOGOUT
    if (!isSignedIn && connectedRef.current) {
      socket.disconnect();
      connectedRef.current = false;
    }
  }, [isSignedIn, user?.id]);

  return null;
}

  

export default SocketProvider;
