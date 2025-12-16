'use client'

import gqlclient from '@/service/gql';
import { FIND_FRIENDS } from '@/service/gql/queries';
import { Search, UserPlus } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { REQUEST_FRIEND } from '@/service/gql/mutation';
import { useUser } from '@clerk/nextjs';
import socket from '../services/socket';
import { useCurrUser } from '@/components/UserContext';
import UserComp from '@/components/Usercomp';
import { useRouter } from 'next/navigation';

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
        socket.emit("friend_request",{
          senderid:curruser?.id,
          receiverid:recid
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
      <div className="w-full max-w-[420px] h-full p-4 flex flex-col bg-black">


        <div className="flex items-center gap-2 mb-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchFriends()}
            placeholder="Search by name..."
            className="flex-1 px-4 py-2 rounded-full bg-[#1A1A1A] text-white placeholder-white/40 outline-none shadow-md border border-white/10"
          />

          <button
            onClick={searchFriends}
            className="p-2 rounded-full bg-[#FFFC00] text-black shadow-md active:scale-95 transition"
          >
            <Search size={20} />
          </button>

          <Link href="/" className="ml-2 font-semibold text-white/80 hover:text-white transition">
            Cancel
          </Link>
        </div>

       
        <h1 className="text-xl font-bold mb-3">Find Friends</h1>

        <div className="flex-1 overflow-y-auto">
  {loading && (
    <p className="text-center text-white/40 py-4">Searching...</p>
  )}

  {!loading && name.trim() && friends.length === 0 && (
    <p className="text-center text-white/40 py-4">No users found</p>
  )}

  {friends.map((val) => (
    <motion.div
      key={val.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
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

      </div>
    </div>
  );
}
