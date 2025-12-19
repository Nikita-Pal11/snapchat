'use client';


import { useCurrUser } from '@/components/UserContext';
import gqlclient from '@/service/gql';
import { FRIEND_LIST } from '@/service/gql/queries';
import { ArrowLeft, Search } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import socket from '../services/socket';
import { useRouter } from 'next/navigation';

type ClientUser = {
  id: string;
  clerkId: string;
  name: string | null;
  avatar: string | null;
};

type ClientFriend = {
  id: string;
  userId: string;
  friendId: string;
  streaks: number;
  friend: ClientUser;
};
export default function Page() {
    const[friends,setfriends]=useState<ClientFriend[]>([]);
    const[selectedFriends,setselFrnd]=useState<string[]>([]);
    const[loading,setloading]=useState(false);
    const {curruser}=useCurrUser()
    const [snap, setSnap] = useState<string | null>(null);
    const router=useRouter()
useEffect(() => {
  setSnap(sessionStorage.getItem("snap_preview"));
}, []);
    function base64ToFile(base64: string, filename: string) {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

      async function handleSnap() {
 if (!snap || selectedFriends.length === 0 || !curruser) return;

  // convert base64 → File
  const file = base64ToFile(snap, "snap.jpg");

  const formData = new FormData();
  formData.append("file", file);

  const resp = await fetch("/api/uploadfile", {
    method: "POST",
    body: formData,
  });

  const { url } = await resp.json();

socket.emit("sent_multi_snap",{
    senderid:curruser?.id,
    receiversid:selectedFriends,
    mediaurl:url,
    type:"SNAP"
})
socket.emit("sent_multi_notification",{
    senderid:curruser?.id,
    receiversid:selectedFriends,
    type:"SNAP",
    message:"Send a Snap"
})

    
sessionStorage.removeItem("snap_preview")
  
  }
    useEffect(()=>{
    if(!curruser)return;
     async function fetchfriends(){
      try{
        setloading(true);
        const resp=await gqlclient.request(FRIEND_LIST,{
          userId:curruser.id
        })
        console.log(resp.friendsList);
        setfriends(resp.friendsList || []);
      }
      catch(err){
        console.log(err);
      }
      finally{
        setloading(false);
      }
     }
     fetchfriends();
  },[curruser])
  return (
    <div className="flex justify-center w-full h-screen text-white">
      <div className="w-full max-w-[420px] h-full bg-black flex flex-col">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10" onClick={()=>{router.back()}}>
          <ArrowLeft size={22} className="cursor-pointer" />
          <h1 className="text-lg font-semibold">Send To</h1>
        </div>

        {/* SEARCH */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-[#1C1C1C] rounded-full px-4 py-2">
            <Search size={16} className="text-white/50" />
            <input
              placeholder="Search"
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
        </div>

        {/* FRIENDS LIST */}
        <div className="flex-1 overflow-y-auto px-2">
  {friends.map((val, i) => {
    const isselected=selectedFriends.includes(val.friend.id);
    return (
      <div
        key={i}
        className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/5 cursor-pointer"
        onClick={
            ()=>{
                if(isselected){
                    setselFrnd((prev)=>prev.filter((fid)=>fid!=val.friend.id))
                }
                else{
                    setselFrnd((prev)=>[...prev,val.friend.id])
                }
            }
        }
       
      >
        {/* LEFT: Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
            <img
              src={val.friend.avatar || ""}
              alt="avatar"
              width={40}
              height={40}
            />
          </div>

          <div>
            <p className="text-sm font-medium">{val.friend.name}</p>
            <p className="text-[11px] text-white/40">Friend</p>
          </div>
        </div>

        {/* RIGHT: Streak + Separator + Select Circle */}
        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
           {val.streaks>0 && `${val.streaks}🔥`}
          </div> 

          {/* Selection Circle */}
          {isselected?<div className="w-5 h-5 rounded-full border border-white/40 bg-blue-700"/>:<div className="w-5 h-5 rounded-full border border-white/40" />}
        </div>
        
      </div>
      
    );
   
  })}
  
</div>


        {/* SEND BUTTON */}
        <div className="p-4">
          <button className="w-full bg-[#FFFC00] text-black py-3 rounded-full font-semibold text-sm" onClick={handleSnap}
  disabled={selectedFriends.length === 0}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
