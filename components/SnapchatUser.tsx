"use client";

import gqlclient from "@/service/gql";
import { FETCH_SNAPUSER } from "@/service/gql/queries";
import { User } from "@prisma/client";
import { useEffect, useState } from "react";
import { useCurrUser } from "./UserContext";
import { motion } from "framer-motion";

function SnapchatUser() {
  const [snapUsers, setSnapUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { curruser } = useCurrUser();

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
              className="bg-yellow-400 text-black text-xs font-semibold px-4 py-1.5 rounded-full active:scale-95 transition"
            >
              Add
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SnapchatUser;
