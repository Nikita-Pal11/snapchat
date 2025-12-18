"use client";

import gqlclient from "@/service/gql";
import { FETCH_SNAPUSER } from "@/service/gql/queries";

import { useEffect, useState } from "react";
import { useCurrUser } from "./UserContext";
import { motion } from "framer-motion";
import { REQUEST_FRIEND } from "@/service/gql/mutation";
import socket from "@/app/services/socket";
import { UserPlus } from "lucide-react";
type ClientUser = {
  id: string;
  clerkId?: string;
  name: string | null;
  email: string;
  avatar: string | null;
};
function SnapchatUser() {
  const [snapUsers, setSnapUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { curruser } = useCurrUser();
   const[requested,setrequested]=useState<Set<string>>(new Set())
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
       }
       setrequested((prev)=>new Set(prev).add(recid));
    }
    catch(err){
      console.log(err);
    }
  }
  useEffect(() => {
    if (!curruser) return;

    async function fetchSnapUser() {
      try {
        setLoading(true);
        const resp = await gqlclient.request(FETCH_SNAPUSER, {
          fetchUsersId: curruser.id,
        });
        setSnapUsers(resp.fetchUsers || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSnapUser();
  }, [curruser]);

  if (loading) {
    return (
      <p className="text-center text-white/40 mt-4">
        Finding people you may know...
      </p>
    );
  }

  if (snapUsers.length === 0) return null;

  return (
    <div>
      {/* Title */}
      <p className="text-sm font-semibold mb-2 px-1">
        Suggested Friends
      </p>

      {/* List */}
      <div className="space-y-2">
        {snapUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-[#111] rounded-xl px-3 py-2 flex items-center gap-3"
          >
            {/* Avatar */}
            <img
              src={user.avatar || "/avatar.png"}
              alt={user.name || "user"}
              className="w-12 h-12 rounded-full object-cover"
            />

            {/* Info */}
            <div className="flex-1">
              <p className="font-semibold text-sm truncate">
                {user.name || "Snap User"}
              </p>
              <p className="text-xs text-white/50 truncate">
                {user.email}
              </p>
            </div>

            {/* Add Button */}
           <button
  disabled={requested.has(user.id)}
  onClick={() => Request(user.id)}
  className={`flex gap-2 h-[30px] w-[100px] p-2 rounded-2xl items-center justify-center
    ${requested.has(user.id)
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-[#FFFC00] hover:opacity-90"
    }`}
>
  <UserPlus
    size={18}
    className={requested.has(user.id) ? "text-black/60" : "text-black"}
  />
  <p className="text-black text-sm">
    {requested.has(user.id) ? "Requested" : "Add"}
  </p>
</button>

          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SnapchatUser;
