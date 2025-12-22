'use client'

import { ArrowLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCurrUser } from '@/components/UserContext'
import { DELETE_NOTIF } from '@/service/gql/mutation'
import gqlclient from '@/service/gql'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, readNotify, setNotifications } = useCurrUser()

  const sentTime = (date?: string | Date) => {
    if (!date) return ''
    const time = date instanceof Date ? date.getTime() : new Date(date).getTime()
    if (isNaN(time)) return ''
    return new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const typeTextColor = (type: string, opened: boolean) => {
    if (!opened) {
      switch (type) {
        case 'SNAP': return 'text-red-500'
        case 'CHAT': return 'text-purple-500'
        case 'FRIEND_REQUEST': return 'text-blue-500'
        default: return 'text-white'
      }
    }
    return 'text-zinc-400'
  }

  const deleteNotification = async (id: string) => {
    if (!id) return
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id))

    try {
      const resp = await gqlclient.request(DELETE_NOTIF, { id })
      if (!resp.deleteNotification) toast.error('Failed to delete notification')
    } catch (err) {
      toast.error('Failed to delete notification')
      console.error(err)
    }
  }

  return (
    <div className="flex justify-center w-full h-screen text-white">
      <div className="w-full max-w-[420px] h-full p-4 flex flex-col bg-black">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
          <ArrowLeft className="cursor-pointer" onClick={() => router.back()} />
          <h1 className="text-lg font-semibold">Notifications</h1>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto mt-2">
          {notifications.length === 0 && (
            <p className="text-center text-white/50 mt-4">No notifications</p>
          )}

          {notifications.map((val, index) => {
            const color = typeTextColor(val.type, val.isopened)

            return (
              <div key={val.id} className="flex items-center gap-3 group">
                
                {/* Clickable content */}
                <div
                  className={`flex-1 relative flex items-center gap-3 px-2 py-3 cursor-pointer ${
                    !val.isopened ? 'bg-zinc-800/60' : ''
                  }`}
                  onClick={() => {
                    if(val.type=="CHAT" || val.type=="SNAP"){
                      router.push(`Chat/${val.sender.clerkId}`)
                    }
                    if(val.type=="FRIEND_REQUEST"){
                      router.push("/requests")
                    }
                    readNotify(val.id, val.isopened)
                  }}
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
                      <span className={`${color} ${!val.isopened ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]' : ''}`}>
                        {val.message}
                      </span>
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">{sentTime(val.createdAt)}</p>
                  </div>

                  {!val.isopened && <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1" />}
                </div>

                {/* Delete button */}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    deleteNotification(val.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition p-1 rounded-full hover:bg-zinc-700"
                >
                  <X size={14} className="text-zinc-400 hover:text-white" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
