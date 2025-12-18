"use client";

import { useCurrUser } from "@/components/UserContext";
import gqlclient from "@/service/gql";
import { USER_REQUESTS } from "@/service/gql/queries";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ACCEPT_REQUEST } from "@/service/gql/mutation";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import SnapchatUser from "@/components/SnapchatUser";
import socket from "../services/socket";

type ClientUser = {
  id: string;
  
  name: string | null;
  email: string;
  avatar: string | null;
};

type ClientRequest = {
  id: string;
  senderid:string;
  sender: ClientUser;
  receiver: ClientUser;
};


export default function Page() {
  const [allrequests, setrequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll,setShowAll]=useState(false);
  const { curruser } = useCurrUser();
  const router = useRouter();

  async function acceptRequest(reqid: string) {
    try {
      const resp = await gqlclient.request(ACCEPT_REQUEST, {
        requestid: reqid,
      });
      if (resp.AcceptRequest) {
        setrequests((prev) => prev.filter((r) => r.id !== reqid));
      }
       socket.emit("sent_notification",{
      senderid: curruser!.id,
        receiverid: reqid,
        type:"REQUEST_ACCEPTED",
        message:"Accept your request"
    })
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (!curruser) return;

    async function friendRequest() {
      try {
        setLoading(true);
        const resp = await gqlclient.request(USER_REQUESTS, {
          userId: curruser.id,
        });
        setrequests(resp.userRequests || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }

    friendRequest();
  }, [curruser]);

  const visibleRequests=showAll?allrequests:allrequests.slice(0,2);

  return (
  <div className="w-full h-screen text-white flex justify-center ">
    <div className="w-full max-w-[420px] bg-black flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button
          onClick={() => router.back()}
          className="p-1 rounded-full active:scale-90 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-lg font-semibold tracking-wide">
          Friend Requests
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">

        {loading && (
          <p className="text-center text-white/40 mt-8">
            Loading...
          </p>
        )}

        {/* Empty State */}
        {!loading && allrequests.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center mt-8"
          >
            <div className="text-5xl mb-3">👻</div>
            <p className="text-lg font-semibold">
              You’re all caught up!
            </p>
            <p className="text-sm text-white/50">
              No friend requests right now
            </p>
          </motion.div>
        )}

        {/* Requests Section */}
        {allrequests.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <p className="text-sm font-semibold">
                Requests ({allrequests.length})
              </p>

              {allrequests.length > 2 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs text-yellow-400 font-semibold"
                >
                  View more
                </button>
              )}
            </div>

            <div className="space-y-2">
              {visibleRequests.map((val, index) => (
                <motion.div
                  key={val.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#111] rounded-xl px-3 py-2 flex items-center gap-3"
                >
                  <img
                    src={val.sender.avatar || "/avatar.png"}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {val.sender.name || "Unknown"}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {val.sender.email}
                    </p>
                  </div>

                  <button
                    onClick={() => acceptRequest(val.senderid)}
                    className="bg-yellow-400 text-black text-xs font-semibold px-4 py-1.5 rounded-full active:scale-95 transition"
                  >
                    Accept
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Suggested Friends */}
        <SnapchatUser />
      </div>
    </div>
  </div>
);

}
