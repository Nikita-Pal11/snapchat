'use client'
import socket from "@/app/services/socket";
import gqlclient from "@/service/gql";
import { READ_NOTICN } from "@/service/gql/mutation";
import { FETCH_NOTIFICATION, GET_USER } from "@/service/gql/queries";
import { useUser } from "@clerk/nextjs"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
type UserContextType={
     curruser: any | null
  loading: boolean
  notifications: ClientNotification[]
  notificationlength: number
  setnotificationlength: React.Dispatch<React.SetStateAction<number>>
  readNotify: (id: string, opened: boolean) => Promise<void>
}
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
const usercontext=createContext<UserContextType>({
    curruser: null,
  loading: true,
  notifications: [],
  notificationlength: 0,
  setnotificationlength: () => {},
  readNotify: async () => {}
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
      updated.filter(n => !n.isopened).length
    )

    return updated
  })
}
     }
  }
  useEffect(()=>{
   socket.on("new_notification",({resp})=>{
    setNotifications((prev)=>{
      const updated=[resp,...prev]
      setnotificationlength(updated.filter((val)=>!val.isopened).length)
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
    resp.fetchnotification.filter(
      (n: ClientNotification) => !n.isopened
    ).length
  );
}
  }
fetchNotify();
},[curruser])
    useEffect(()=>{
        if (!user?.id) return;
         async function fetchUser() {
      try {
        setLoading(true);
        const resp = await gqlclient.request(GET_USER, {
          getuserId: user?.id,
        });
        setcurruser(resp.getuser);
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
    },[user])

  return (
   
      <usercontext.Provider value={{curruser,loading,notificationlength,setnotificationlength,notifications,readNotify}}>
        {children}
      </usercontext.Provider>

  )
}

export const useCurrUser=()=>useContext(usercontext)
