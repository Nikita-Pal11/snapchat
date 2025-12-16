"use client";

import {
  ArrowLeft,
  Camera,
  Play,
  Send,
  Square,
  X,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrUser } from "@/components/UserContext";
import gqlclient from "@/service/gql";
import { FETCH_MSG, GET_USER } from "@/service/gql/queries";
import socket from "@/app/services/socket";

// ------------------- TYPES -------------------
type MsgType = "TEXT" | "IMAGE" | "VIDEO" | "SNAP";

interface Message {
  id: string;
  senderid: string;
  receiverid: string;
  roomid: string;
  text?: string;
  mediaurl?: string;
  type: MsgType;
  isopened?: boolean;
  createdAt: string;
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
}

// ------------------- COMPONENT -------------------
interface PageProps {
  params: { id: string };
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { curruser } = useCurrUser();


  const [message, setMessage] = useState<string>("");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [user, setUser] = useState<ChatUser | null>(null);
  const [openSnap, setOpenSnap] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSnap, setLoadingSnap] = useState(false);

  // ------------------- DATE HELPERS -------------------
  function getDayLabel(date?: string) {
    if (!date) return "";

    const time = /^\d+$/.test(date) ? Number(date) : new Date(date).getTime();
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
      year: "numeric",
    });
  }

  function sentTime(date?: string) {
    if (!date) return "";
    const time = /^\d+$/.test(date) ? Number(date) : new Date(date).getTime();
    if (isNaN(time)) return "";

    return new Date(time).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // ------------------- ROOM ID -------------------
  const roomid = useMemo(() => {
    if (!curruser?.id || !user?.id) return null;
    return [curruser.id, user.id].sort().join("_");
  }, [curruser?.id, user?.id]);

  // ------------------- SNAP OPEN -------------------
  function openSnapMessage(m: Message) {
    if (!m.id || !roomid || m.isopened) return;

    setOpenSnap(m);

    setTimeout(() => {
      setOpenSnap(null);
    }, 3000);

    setMsgs((prev) =>
      prev.map((msg) => (msg.id === m.id ? { ...msg, isopened: true } : msg))
    );

    socket.emit("open_snap", { mid: m.id, roomid });
  }

  // ------------------- SOCKET EVENTS -------------------
  useEffect(() => {
    socket.on("rec_msg", ({ resp }: { resp: Message }) => {
      setMsgs((prev) => [...prev, resp]);
    });

    socket.on("rec_snap", ({ resp }: { resp: Message }) => {
      setMsgs((prev) =>
        prev.map((m) => (m.id === resp.id ? { ...m, isopened: true } : m))
      );
    });

    socket.on("snap_deleted", ({ mid }: { mid: string }) => {
      setMsgs((prev) => prev.filter((m) => m.id !== mid));
    });

    return () => {
      socket.off("rec_msg");
      socket.off("rec_snap");
      socket.off("snap_deleted");
    };
  }, []);

  // ------------------- FETCH USER -------------------
  useEffect(() => {
    async function fetchFriend() {
      const resp = await gqlclient.request<{ getuser: ChatUser }>(GET_USER, {
        getuserId: id,
      });
      setUser(resp.getuser);
    }
    fetchFriend();
  }, [id]);

  // ------------------- JOIN ROOM -------------------
  useEffect(() => {
    if (!roomid) return;
    socket.emit("join_room", {
      userId: curruser?.id,
      friendid: user?.id,
    });
  }, [roomid]);

  // ------------------- FETCH MESSAGES -------------------
  useEffect(() => {
    if (!roomid) return;
    async function fetchMsgs() {
      const resp = await gqlclient.request<{ fetchmsg: Message[] }>(FETCH_MSG, {
        roomid,
      });
      setMsgs(resp.fetchmsg);
    }
    fetchMsgs();
  }, [roomid]);

  // ------------------- SEND MESSAGE -------------------
  function sendMessage() {
    if (!curruser?.id || !user?.id || !message) return;

    socket.emit("send_msg", {
      roomid,
      msg: {
        senderid: curruser.id,
        receiverid: user.id,
        roomid,
        text: message,
        type: "TEXT",
      },
    });

    setMessage("");
  }

  // ------------------- SNAP UPLOAD -------------------
  async function handleSnap(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingSnap(true);
    const formData = new FormData();
    formData.append("file", file);

    const resp = await fetch("/api/uploadfile", {
      method: "POST",
      body: formData,
    });

    const { url } = await resp.json();
    if (url) setLoadingSnap(false);

    socket.emit("send_msg", {
      roomid,
      msg: {
        senderid: curruser!.id,
        receiverid: user!.id,
        roomid,
        mediaurl: url,
        type: "SNAP" as MsgType,
      },
    });
  }

  // ------------------- MEDIA UPLOAD -------------------
  async function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const resp = await fetch("/api/uploadfile", {
      method: "POST",
      body: formData,
    });

    const { url, type } = await resp.json();
    if (url) setLoading(false);

    socket.emit("send_msg", {
      roomid,
      msg: {
        senderid: curruser!.id,
        receiverid: user!.id,
        roomid,
        mediaurl: url,
        type: type === "image" ? "IMAGE" : "VIDEO",
      } as Message,
    });
  }

  // ------------------- RENDER -------------------
  return (
    <div className="fixed inset-0 text-white flex justify-center">
      <div className="w-full max-w-[420px] bg-black flex flex-col h-full">
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
            <p className="text-sm font-semibold leading-none">{user?.name}</p>
            <p className="text-[11px] text-white/40">Friends</p>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {msgs.map((m, i) => {
            const isMe = m.senderid === curruser?.id;

            const currentDay = getDayLabel(m.createdAt);
            const prevDay = i > 0 ? getDayLabel(msgs[i - 1].createdAt) : null;
            const showSeparator = currentDay !== prevDay;

            return (
              <div key={m.id}>
                {showSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="text-[11px] text-white/40 flex items-center gap-1">
                      <Clock size={12} />
                      {currentDay}
                    </span>
                  </div>
                )}

                <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
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
                        onClick={() => openSnapMessage(m)}
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
              {!loadingSnap ? (
                <Camera size={18} />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              )}
              <input hidden type="file" onChange={handleSnap} />
            </label>

            <div className="flex-1 bg-[#1C1C1C] rounded-full flex items-center px-4 py-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a chat"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!message}
                className="ml-2 w-8 h-8 rounded-full bg-[#FFFC00] text-black flex items-center justify-center disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>

            <label className="w-11 h-11 rounded-full bg-[#FFFC00] text-black flex items-center justify-center cursor-pointer">
              {!loading ? (
                <Play size={18} />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              )}
              <input hidden type="file" onChange={handleMedia} />
            </label>
          </div>
        </div>

        {/* SNAP VIEW */}
        {openSnap && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div className="absolute top-0 left-0 h-1 w-full bg-white animate-snap-timer" />
            {openSnap.mediaurl?.endsWith(".mp4") ? (
              <video src={openSnap.mediaurl} autoPlay className="max-h-full" />
            ) : (
              <img src={openSnap.mediaurl} className="max-h-full" />
            )}
            <button
              onClick={() => setOpenSnap(null)}
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
