'use client'

import gqlclient from '@/service/gql';
import { FIND_FRIENDS } from '@/service/gql/queries';
import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { REQUEST_FRIEND } from '@/service/gql/mutation';
import { useUser } from '@clerk/nextjs';
import socket from '../services/socket';
import { useCurrUser } from '@/components/UserContext';
import UserComp from '@/components/Usercomp';
import { useRouter } from 'next/navigation';
import SnapchatUser from '@/components/SnapchatUser';
import UserSkeleton from '@/components/UserSkeleton';

type FriendUser = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  isFriend: boolean;
  requestSent: boolean;
  requestReceived: boolean;
};

export default function Page() {
  const [name, setName] = useState("");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const router=useRouter();
  const {curruser}=useCurrUser();
  async function Request(recid:string){
    if(!curruser)return
    try{
       const resp=await gqlclient.request(REQUEST_FRIEND,{
        senderid:curruser?.id,
        receiverid:recid
       })
       if(resp.friendRequest){
        socket.emit("sent_notification",{
          senderid:curruser?.id,
          receiverid:recid,
          type:"FRIEND_REQUEST",
          message:"Send a Friend request"
        })

        setFriends(prev =>
        prev.map(u =>
          u.id === recid
            ? { ...u, requestSent: true }
            : u
        )
      );
       }
    }
    catch(err){
      console.log(err);
    }
  }

  async function searchFriends() {
    if (!name.trim()) {
      setFriends([]);
      return;
    }

    try {
      setLoading(true);
      const resp = await gqlclient.request(FIND_FRIENDS, { name ,userid:curruser.id});
      setFriends(resp.finduser || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  // Debounce Search (500ms)
  useEffect(() => {
    const delay = setTimeout(() => searchFriends(), 500);
    return () => clearTimeout(delay);
  }, [name]);

  return (
  <div className="flex justify-center w-full h-screen text-white">
    <div className="w-full max-w-[420px] h-full  bg-black flex flex-col">

      {/* Header / Search */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full active:scale-90 transition"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchFriends()}
              placeholder="Search friends"
              className="flex-1 px-4 py-2 rounded-full bg-[#1A1A1A] text-white placeholder-white/40 outline-none border border-white/10"
            />

            <button
              onClick={searchFriends}
              className="p-2 rounded-full bg-[#FFFC00] text-black active:scale-95 transition"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">

        {/* Title */}
        <h1 className="text-lg font-semibold px-1">
          Find Friends
        </h1>

        {/* Searching */}
       {loading && (
  <>
    <UserSkeleton />
    <UserSkeleton />
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.2 }}
      className="text-center text-xs text-white/40 mt-2"
    >
      Finding people you may know…
    </motion.div>
  </>
)}


        {/* No Results */}
        {!loading && name.trim() && friends.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/40 mt-6"
          >
            No users found
          </motion.div>
        )}

        {/* Search Results */}
        {friends.length > 0 && (
          <div className="space-y-2">
            {friends.map((val, index) => (
              <motion.div
                key={val.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <UserComp
                  name={val.name}
                  avatar={val.avatar || ""}
                  subtitle={val.email}
                  showAdd={!val.isFriend && !val.requestSent && !val.requestReceived}
                  showAccept={val.requestReceived}
                  showChat={val.isFriend}
                  onAdd={() => Request(val.id)}
                  onAccept={() => router.push("/Requests")}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Suggested Friends (only when not searching) */}
        {!name.trim() && (
          <>
            <div className="h-px bg-white/10" />
            <SnapchatUser />
          </>
        )}
      </div>
    </div>
  </div>
);

}
