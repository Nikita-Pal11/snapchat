import { MessageSquare, UserPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
type usercompprops={
  name:string,
  avatar?:string,
  subtitle?: React.ReactNode;
  showChat?:boolean,
  showAdd?:boolean,
  showAccept?:boolean,
  onChat?:()=>void,
  onAdd?:()=>void,
  onAccept?:()=>void,
}
export default function UserComp({name,avatar,subtitle,showChat,showAdd,showAccept,onChat,onAdd,onAccept}:usercompprops) {
  return (
    <div className="
      w-full 
      max-w-[420px] 
      h-[90px] 
      mx-auto
      px-4 
      flex 
      items-center 
      bg-black 
      text-white
      border-b border-white/10
    ">
      {/* Avatar */}
      <Avatar className="w-14 h-14 ring-2 ring-white/20">
        <AvatarImage src={avatar} alt="user" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>

      {/* Middle Content */}
      <div className="ml-4 flex flex-col justify-center">
        <h1 className="font-semibold text-lg">{name}</h1>

        {subtitle && (
          <div className="text-sm truncate">
            {subtitle}
          </div>
        )}
        
      </div>

      {/* Right Icon */}
      <div className="flex ml-auto gap-3">
 
       {showChat &&  <MessageSquare className="text-white" size={26} onClick={onChat}/>}
       {showAdd &&<button className='flex gap-2 h-[30px] w-[100px] p-2 rounded-2xl bg-[#FFFC00] items-center justify-center' onClick={onAdd}>
                  <UserPlus size={18} className="text-black" />
                <p className='text-black'>Add</p>
                </button> }
       {showAccept && <button className='flex gap-2 h-[30px] w-[100px] p-2 rounded-2xl bg-[#FFFC00] items-center justify-center' onClick={onAccept}>
                  <UserPlus size={18} className="text-black" />
                <p className='text-black'>Accept</p>
                </button>}
      </div>
    </div>
  );
}
