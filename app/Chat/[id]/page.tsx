"use client";

import {
  ArrowLeft,
  Camera,
  Play,
  Send,
  Square,
  X,
  Clock,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrUser } from "@/components/UserContext";
import gqlclient from "@/service/gql";
import { FETCH_MSG, GET_USER } from "@/service/gql/queries";
import socket from "@/app/services/socket";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { curruser } = useCurrUser();
  const { id } = use(params);

  const [message, setMessage] = useState("");
  const [msgs, setmsgs] = useState<any[]>([]);
  const [user, setuser] = useState<any>();
  const [opensnap, setopensnap] = useState<any>(null);
  const [loading,setloading]=useState(false);
const [loadingsnap,setloadingsnap]=useState(false);
function getDayLabel(date?: string) {
  if (!date) return "";

  const time =
    /^\d+$/.test(date) ? Number(date) : new Date(date).getTime();

  if (isNaN(time)) return "";

  const msgDate = new Date(time);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(msgDate, today)) return "Today";
  if (isSameDay(msgDate, yesterday)) return "Yesterday";

  return msgDate.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


function sentTime(date?: string) {
  if (!date) return "";

  const time =
    /^\d+$/.test(date) ? Number(date) : new Date(date).getTime();

  if (isNaN(time)) return "";

  return new Date(time).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

  /* ---------------- ROOM ID ---------------- */
  const roomid = useMemo(() => {
    if (!curruser?.id || !user?.id) return null;
    return [curruser.id, user.id].sort().join("_");
  }, [curruser?.id, user?.id]);

  /* ---------------- SNAP OPEN ---------------- */
  function openSnap(m: any) {
    if (!m.id || !roomid || m.isopened) return;

    setopensnap(m);

    setTimeout(() => {
      setopensnap(null);
    }, 3000);

    setmsgs((prev: any[]) =>
      prev.map((msg) =>
        msg.id === m.id ? { ...msg, isopened: true } : msg
      )
    );

    socket.emit("open_snap", { mid: m.id, roomid });
  }

  /* ---------------- SOCKET EVENTS ---------------- */
  useEffect(() => {
    socket.on("rec_msg", ({ resp }) => {
      setmsgs((prev) => [...prev, resp]);
    });

    socket.on("rec_snap", ({ resp }) => {
      setmsgs((prev) =>
        prev.map((m) => (m.id === resp.id ? { ...m, isopened: true } : m))
      );
    });

    socket.on("snap_deleted", ({ mid }) => {
      setmsgs((prev) => prev.filter((m) => m.id !== mid));
    });

    return () => {
      socket.off("rec_msg");
      socket.off("rec_snap");
      socket.off("snap_deleted");
    };
  }, []);

  /* ---------------- FETCH USER ---------------- */
  useEffect(() => {
    async function fetchfriend() {
      const resp = await gqlclient.request(GET_USER, { getuserId: id });
      setuser(resp.getuser);
    }
    fetchfriend();
  }, [id]);

  /* ---------------- JOIN ROOM ---------------- */
  useEffect(() => {
    if (!roomid) return;
    socket.emit("join_room", {
      userId: curruser?.id,
      friendid: user?.id
    });
  }, [roomid]);

  /* ---------------- FETCH MESSAGES ---------------- */
  useEffect(() => {
    if (!roomid) return;
    async function fetchmsgs() {
      const resp = await gqlclient.request(FETCH_MSG, { roomid });
      setmsgs(resp.fetchmsg);
    }
    fetchmsgs();
  }, [roomid]);

  /* ---------------- SEND MESSAGE ---------------- */
  function sendmessage() {
    if (!curruser.id || !user.id || !message) return;

    socket.emit("send_msg", {
      roomid,
      msg: {
        senderid: curruser.id,
        receiverid: user.id,
        roomid,
        text: message,
        type: "TEXT"
      }
    });

    setMessage("");
  }

  /* ---------------- SNAP UPLOAD ---------------- */
  async function handelsnap(e: any) {
    const file = e.target.files[0];
    if (!file) return;
   setloadingsnap(true);
    const formData = new FormData();
    formData.append("file", file);

    const resp = await fetch("/api/uploadfile", {
      method: "POST",
      body: formData
    });

    const { url } = await resp.json();
     if(url){
      setloadingsnap(false);
     }
    socket.emit("send_msg", {
      roomid,
      msg: {
        senderid: curruser.id,
        receiverid: user.id,
        roomid,
        mediaurl: url,
        type: "SNAP",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  /* ---------------- MEDIA UPLOAD ---------------- */
  async function handelmedia(e: any) {
    const file = e.target.files[0];
    if (!file) return;
 setloading(true);
    const formData = new FormData();
    formData.append("file", file);

    const resp = await fetch("/api/uploadfile", {
      method: "POST",
      body: formData
    });

    const { url, type } = await resp.json();
 if(url){
      setloading(false);
     }
    socket.emit("send_msg", {
      roomid,
      msg: {
        senderid: curruser.id,
        receiverid: user.id,
        roomid,
        mediaurl: url,
        type: type === "image" ? "IMAGE" : "VIDEO"
      }
    });
  }

  return (
  <div className="fixed inset-0 text-white flex justify-center">
    <div className="w-full max-w-[420px]  bg-black flex flex-col h-full">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <ArrowLeft
          size={22}
          className="cursor-pointer"
          onClick={() => router.back()}
        />

        <Avatar className="w-9 h-9">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="text-sm font-semibold leading-none">
            {user?.name}
          </p>
          <p className="text-[11px] text-white/40">
            Friends
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {msgs.map((m: any, i: number) => {
          const isMe = m.senderid === curruser?.id;

          const currentDay = getDayLabel(m.createdAt);
          const prevDay =
            i > 0 ? getDayLabel(msgs[i - 1].createdAt) : null;
          const showSeparator = currentDay !== prevDay;

          return (
            <div key={i}>
              {showSeparator && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] text-white/40 flex items-center gap-1">
                    <Clock size={12} />
                    {currentDay}
                  </span>
                </div>
              )}

              <div
                className={`flex ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[75%]">

                  {/* TEXT */}
                  {m.type === "TEXT" && (
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm leading-snug ${
                        isMe
                          ? "bg-[#FFFC00] text-black rounded-br-md"
                          : "bg-[#1C1C1C] text-white rounded-bl-md"
                      }`}
                    >
                      {m.text}
                    </div>
                  )}

                  {/* IMAGE */}
                  {m.type === "IMAGE" && (
                    <img
                      src={m.mediaurl}
                      onClick={() => window.open(m.mediaurl)}
                      className="rounded-2xl max-w-[180px] cursor-pointer"
                    />
                  )}

                  {/* VIDEO */}
                  {m.type === "VIDEO" && (
                    <video
                      src={m.mediaurl}
                      controls
                      className="rounded-2xl max-w-[200px]"
                    />
                  )}

                  {/* SNAP */}
                  {m.type === "SNAP" && (
                    <button
                      disabled={m.isopened}
                      onClick={() => openSnap(m)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm border w-fit ${
                        m.isopened
                          ? "border-gray-600 text-gray-500"
                          : "border-red-500 text-red-500"
                      }`}
                    >
                      <Square size={14} />
                      {m.isopened ? "Opened" : "New Snap"}
                      <Camera size={14} />
                    </button>
                  )}

                  <p className="text-[10px] text-white/30 mt-1">
                    {sentTime(m.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT BAR */}
      <div className="px-3 py-2 border-t border-white/10">
        <div className="flex items-center gap-2">

          <label className="w-11 h-11 rounded-full bg-[#FFFC00] text-black flex items-center justify-center cursor-pointer">
            {!loadingsnap ? (
  <Camera size={18} />
) : (
  <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
)}
            <input hidden type="file" onChange={handelsnap} />
          </label>

          <div className="flex-1 bg-[#1C1C1C] rounded-full flex items-center px-4 py-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a chat"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button
              onClick={sendmessage}
              disabled={!message}
              className="ml-2 w-8 h-8 rounded-full bg-[#FFFC00] text-black flex items-center justify-center disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>

          <label className="w-11 h-11 rounded-full bg-[#FFFC00] text-black flex items-center justify-center cursor-pointer">
            {!loading?<Play size={18} />:<div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />}
            <input hidden type="file" onChange={handelmedia} />
          </label>
        </div>
      </div>

      {/* SNAP VIEW */}
      {opensnap && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="absolute top-0 left-0 h-1 w-full bg-white animate-snap-timer" />

          {opensnap.mediaurl?.endsWith(".mp4") ? (
            <video
              src={opensnap.mediaurl}
              autoPlay
              className="max-h-full"
            />
          ) : (
            <img
              src={opensnap.mediaurl}
              className="max-h-full"
            />
          )}

          <button
            onClick={() => setopensnap(null)}
            className="absolute top-4 right-4"
          >
            <X size={28} />
          </button>
        </div>
      )}
    </div>
  </div>
);

}
