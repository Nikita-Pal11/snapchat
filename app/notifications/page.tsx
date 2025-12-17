'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { use, useEffect, useState } from 'react'
import { Notifications, User } from '@prisma/client'
import gqlclient from '@/service/gql'
import { FETCH_NOTIFICATION } from '@/service/gql/queries'
import { useCurrUser } from '@/components/UserContext'
import { READ_NOTICN } from '@/service/gql/mutation'
import socket from '../services/socket'
type notifyts =Notifications & {
  sender:User
}
export default function Page() {
  const router = useRouter()
  const[notifications,setNotifications]=useState<notifyts[]>([])
  const {curruser,notificationlength,setnotificationlength}=useCurrUser();

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
   socket.on("new_notification",(resp)=>{
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
        userId:curruser.id
      })
      if(resp.fetchnotification){
        setNotifications(resp.fetchnotification)
        setnotificationlength(resp.fetchnotification.length)
      }
  }
fetchNotify();
},[curruser])
function sentTime(date?: Date | string) {
  if (!date) return "";

  const time =
    date instanceof Date ? date.getTime() : new Date(date).getTime();

  if (isNaN(time)) return "";

  return new Date(time).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function typeTextColor(type: string, opened: boolean) {
  if (!opened) {
    switch (type) {
      case 'SNAP':
        return 'text-red-500'
      case 'CHAT':
        return 'text-purple-500'
      case 'FRIEND_REQUEST':
        return 'text-blue-500'
      default:
        return 'text-white'
    }
  }
  return 'text-zinc-400'
}


  return (
    <div className="flex justify-center w-full h-screen text-white">
      <div className="w-full max-w-[420px] h-full p-4 flex flex-col bg-black">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
          <ArrowLeft
            className="cursor-pointer"
            onClick={() => router.back()}
          />
          <h1 className="text-lg font-semibold">Notifications</h1>
        </div>

        {/* Notifications List */}
<div className="flex-1 overflow-y-auto mt-2">
  {notifications.map((val, index) => {
    const color = typeTextColor(val.type, val.isopened)

    return (
      <div key={val.id} onClick={() => readNotify(val.id,val.isopened)}>
        
        {/* Row */}
        <div
  className={`relative flex items-center gap-3 px-2 py-3 ${
    !val.isopened ? 'bg-zinc-800/60' : ''
  }`}
>
  {!val.isopened && (
    <div className="absolute left-0 top-0 h-full w-[3px] bg-yellow-400 rounded-r-sm" />
  )}

  <Avatar className="w-10 h-10 ml-1">
    <AvatarImage src={val.sender.avatar || ''} />
    <AvatarFallback className="bg-zinc-700 text-xs">
      {val.sender.name?.[0]}
    </AvatarFallback>
  </Avatar>

  <div className="flex-1 leading-tight">
    <p className={`text-sm ${!val.isopened ? 'font-semibold' : ''}`}>
      <span className="text-white">{val.sender.name}</span>{' '}
      <span
        className={`${color} ${
          !val.isopened ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]' : ''
        }`}
      >
        {val.message}
      </span>
    </p>

    <p className="text-[11px] text-zinc-400 mt-1">
      {sentTime(val.createdAt)}
    </p>
  </div>

  {!val.isopened && (
    <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1" />
  )}
</div>


        {/* Separator */}
        {index !== notifications.length - 1 && (
          <div className="h-px bg-zinc-800/70 ml-14" />
        )}
      </div>
    )
  })}
</div>





        

      </div>
    </div>
  )
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                