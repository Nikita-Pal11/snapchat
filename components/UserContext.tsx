'use client'
import socket from "@/app/services/socket";
import gqlclient from "@/service/gql";
import { READ_NOTICN, CREATE_GUEST_USER } from "@/service/gql/mutation";
import { FETCH_NOTIFICATION, GET_USER } from "@/service/gql/queries";
import { useUser } from "@clerk/nextjs"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
type ClientUser = {
  id: string
  clerkId:string
  name: string | null
  email?: string
  avatar: string | null
}

type ClientNotification = {
  id: string
  type: 'SNAP' | 'CHAT' | 'FRIEND_REQUEST' |'REQUEST_ACCEPTED';
  message: string
  isopened: boolean
  createdAt: string | Date
  sender: ClientUser
}
type UserContextType={
     curruser: any | null
  loading: boolean
  notifications: ClientNotification[]
  notificationlength: number
  setnotificationlength: React.Dispatch<React.SetStateAction<number>>
  setNotifications:React.Dispatch<React.SetStateAction<ClientNotification[]>>
  readNotify: (id: string, opened: boolean) => Promise<void>
  logoutGuest: () => void
}

const usercontext=createContext<UserContextType>({
    curruser: null,
  loading: true,
  notifications: [],
  notificationlength: 0,
  setnotificationlength: () => {},
  setNotifications:()=>{},
  readNotify: async () => {},
  logoutGuest: () => {}
});
export function UserContext({children}:{children:ReactNode}) {
    const {user}=useUser();
    const [curruser, setcurruser] = useState<ClientUser | null>(null);

    const[loading,setLoading]=useState(true);
    const[notifications,setNotifications]=useState<ClientNotification[]>([])
    const[notificationlength,setnotificationlength]=useState(0);
     async function readNotify(id:string,opened:boolean){
     if(!id || opened)return;
     const resp=await gqlclient.request(READ_NOTICN,{
      readNotificationId:id
     })
     if(resp.readNotification){
     if (resp.readNotification) {
  setNotifications(prev => {
    const updated = prev.map(val =>
      val.id === id ? { ...val, isopened: true } : val
    )

    setnotificationlength(
  updated.filter(n => n?.isopened === false).length
);


    return updated
  })
}
     }
  }
  useEffect(()=>{
   socket.on("new_notification",({resp})=>{
    if (!resp) return;
    setNotifications((prev)=>{
      const updated=[resp,...prev]
       setnotificationlength(
      updated.filter(val => val?.isopened === false).length
    );
      return updated
    });
  
   })

   return () => {
    socket.off("new_notification")
  }
  },[])
  useEffect(()=>{
  if(!curruser)return 
  async function fetchNotify(){
      const resp=await gqlclient.request(FETCH_NOTIFICATION,{
        userId:curruser?.id
      })
      if (resp.fetchnotification) {
  setNotifications(resp.fetchnotification);

  setnotificationlength(
  resp.fetchnotification
    .filter((n: ClientNotification) => n?.isopened === false)
    .length
);

}
  }
fetchNotify();
},[curruser])
  const logoutGuest = () => {
    localStorage.removeItem("snapchat_guest_clerk_id");
    if (typeof document !== "undefined") {
      document.cookie = "snapchat_guest_clerk_id=; Max-Age=-99999999;path=/";
    }
    setcurruser(null);
    window.location.href = "/LandingPage";
  };

  useEffect(() => {
    async function initUser() {
      // 1. If Clerk user is signed in
      if (user?.id) {
        // Clear any leftover guest cookies/localstorage
        localStorage.removeItem("snapchat_guest_clerk_id");
        if (typeof document !== "undefined") {
          document.cookie = "snapchat_guest_clerk_id=; Max-Age=-99999999;path=/";
        }

        try {
          setLoading(true);
          const resp = await gqlclient.request(GET_USER, {
            getuserId: user.id,
          });
          setcurruser(resp.getuser);
        } catch (err) {
          console.error("Failed to fetch authenticated user:", err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 2. If no Clerk user is signed in, check if we should check guest session
      const isAuthPage = typeof window !== "undefined" && (
        window.location.pathname === "/LandingPage" ||
        window.location.pathname.startsWith("/sign-in") ||
        window.location.pathname.startsWith("/sign-up")
      );

      if (isAuthPage) {
        setLoading(false);
        return;
      }

      const storedGuestClerkId = localStorage.getItem("snapchat_guest_clerk_id");

      if (storedGuestClerkId) {
        try {
          setLoading(true);
          const resp = await gqlclient.request(GET_USER, {
            getuserId: storedGuestClerkId,
          });
          if (resp.getuser) {
            setcurruser(resp.getuser);
          } else {
            // Guest ID is invalid/expired in db, create a new one
            await createNewGuest();
          }
        } catch (err) {
          console.error("Failed to fetch guest user, creating new one:", err);
          await createNewGuest();
        } finally {
          setLoading(false);
        }
      } else {
        // No guest session, create new guest
        await createNewGuest();
      }
    }

    async function createNewGuest() {
      try {
        setLoading(true);
        const resp = await gqlclient.request(CREATE_GUEST_USER, {});
        if (resp.createGuestUser) {
          const guestUser = resp.createGuestUser;
          localStorage.setItem("snapchat_guest_clerk_id", guestUser.clerkId);
          if (typeof document !== "undefined") {
            const expires = new Date();
            expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            document.cookie = `snapchat_guest_clerk_id=${guestUser.clerkId};expires=${expires.toUTCString()};path=/`;
          }
          setcurruser(guestUser);
        }
      } catch (err) {
        console.error("Failed to create guest user:", err);
      } finally {
        setLoading(false);
      }
    }

    initUser();
  }, [user]);

  return (
   
      <usercontext.Provider value={{curruser,loading,notificationlength,setnotificationlength,notifications,readNotify,setNotifications,logoutGuest}}>
        {children}
      </usercontext.Provider>

  )
}

export const useCurrUser=()=>useContext(usercontext)
