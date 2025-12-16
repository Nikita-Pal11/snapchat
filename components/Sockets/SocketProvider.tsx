"use client";

import socket from "@/app/services/socket";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

function SocketProvider() {
  const { isSignedIn, user } = useUser();
 const connectedRef = useRef(false);
  //notification
  useEffect(() => {
  function handleNotification(data:{type:string,from:string,msg:string}) {
    console.log("NOTIFICATION:", data);

    
    toast.success(`${data.msg}`)
  }

  socket.on("Notification", handleNotification);

  return () => {
    socket.off("Notification", handleNotification)
  };
}, []);

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
