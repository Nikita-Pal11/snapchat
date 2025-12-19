import Navbar from "@/components/Navbar";
import UserComp from "@/components/Usercomp";
import Friends from "@/components/Friends";
import Navigationbar from "@/components/Navigationbar";
export default function Home() {
  return (
    <div className="w-full h-screen flex justify-center">
      {/* MOBILE FRAME */}
      <div className="w-full max-w-[420px] h-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* NAVBAR */}
        <Navbar />

        {/* CHAT LIST (no padding, no spacing, Snapchat-style) */}
        <div className="flex-1 overflow-y-auto">
          <Friends/>
        </div>
        <Navigationbar/>
      </div>
    </div>
  );
}
