import { MessageSquare, UserPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type LastMessage = {
  id: string;
  type: "TEXT" | "SNAP" | "IMAGE" | "VIDEO";
  senderid: string;
  receiverid: string;
  mediaurl?: string;
  isopened: boolean;
  createdAt: string;
  updatedAt: string;
};

type usercompprops = {
  name: string;
  avatar?: string;
  subtitle?: React.ReactNode;
  streaks?: number;
  lastmsg?: LastMessage;
  showChat?: boolean;
  showAdd?: boolean;
  showAccept?: boolean;
  onChat?: () => void;
  onAdd?: () => void;
  onAccept?: () => void;
};

export default function UserComp({
  name,
  avatar,
  subtitle,
  streaks = 0,
  lastmsg,
  showChat,
  showAdd,
  showAccept,
  onChat,
  onAdd,
  onAccept,
}: usercompprops) {
  return (
    <div
      className="
        w-full max-w-[420px] h-[75px] mx-auto px-2 flex items-center
        bg-black text-white border-b border-white/10 rounded-md
        hover:bg-white/5 transition-colors duration-200 cursor-pointer
      "
      onClick={onChat}
    >
      {/* Avatar */}
      <Avatar className="w-10 h-10 ring-2 ring-white/20">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>

      {/* Middle Content */}
      <div className="ml-4 flex flex-col justify-center flex-1 min-w-0">
        <h1 className="font-semibold text-lg truncate">{name}</h1>

        <div className="flex items-center justify-between gap-2 mt-1">
          {/* Subtitle */}
          <div className="text-sm text-white/60 truncate">{subtitle}</div>

          {/* Time & Streak */}
          <div className="flex items-center gap-1 text-white/40 text-xs shrink-0">
            {lastmsg && (
              <span>
                {lastmsg.isopened
                  ? formatTime(lastmsg.updatedAt)
                  : formatTime(lastmsg.createdAt)}
              </span>
            )}
            {streaks > 0 && <span>·</span>}
            {streaks > 0 && (
              <span className="flex items-center gap-0.5 text-orange-400 font-medium">
                {streaks}
                <span>🔥</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-2 ml-2">
        {showChat && (
          <MessageSquare
            className="text-white hover:text-yellow-400 transition-colors"
            size={22}
            onClick={(e) => {
              e.stopPropagation();
              onChat?.();
            }}
          />
        )}
        {showAdd && (
          <button
            className="
              flex gap-1 h-7 px-3 rounded-2xl bg-yellow-500
              items-center justify-center text-black font-semibold
              hover:bg-yellow-400 transition-colors
            "
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.();
            }}
          >
            <UserPlus size={16} />
            Add
          </button>
        )}
        {showAccept && (
          <button
            className="
              flex gap-1 h-7 px-3 rounded-2xl bg-yellow-500
              items-center justify-center text-black font-semibold
              hover:bg-yellow-400 transition-colors
            "
            onClick={(e) => {
              e.stopPropagation();
              onAccept?.();
            }}
          >
            <UserPlus size={16} />
            Accept
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function
function formatTime(date?: string) {
  if (!date) return "";
  const time = new Date(date).getTime();
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
