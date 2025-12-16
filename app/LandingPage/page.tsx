'use client'
import {
  SignInButton,
  SignUpButton,
  SignedOut,
  useUser,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import socket from "../services/socket";

export default function Page() {
  const { isSignedIn ,user} = useUser();
  const router=useRouter();
  useEffect(() => {
    if (isSignedIn) {
      router.push("/")
    };
  }, [isSignedIn]);

  return (
    <div className="flex h-screen w-full justify-center">
      <div className="h-screen w-[400px] relative overflow-hidden bg-[#FFFC00] shadow-2xl">

        {/* Animated Background Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-gradient-to-b from-[#fff891] to-[#FFFC00]"
        />

        <div className="relative h-full flex flex-col items-center justify-between py-12 text-black">

          {/* Snapchat Logo */}
          <motion.img
            src="/ghost.png"
            alt="Snapchat Logo"
            className="w-40 h-28 drop-shadow-xl"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 10,
              duration: 0.8,
            }}
          />

          {/* Title + Subtitle */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <h1 className="text-5xl font-black tracking-tight font-[Poppins] drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
              SnapChat
            </h1>

            <p className="mt-3 text-black/70 text-lg font-semibold">
              Snap • Chat • Connect
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-full flex flex-col gap-4 px-6"
          >
            <SignedOut>
              <SignInButton mode="modal">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  className="bg-black text-white rounded-full font-bold text-lg py-3 shadow-lg"
                >
                  Log In
                </motion.button>
              </SignInButton>

              <SignUpButton mode="modal">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white text-black rounded-full font-bold text-lg py-3 shadow-lg border border-black/20"
                >
                  Create Account
                </motion.button>
              </SignUpButton>
            </SignedOut>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
