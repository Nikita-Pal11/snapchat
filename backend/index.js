import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from "@prisma/client";

import dotenv from "dotenv";
dotenv.config();

const prismaclient = new PrismaClient();
const server = createServer(); // node server

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://snapchat-vert.vercel.app"
    ],
    credentials: true,
  }
});

const onlineusers = {};

/* ===============================
   🔹 Utility Functions
================================ */

// Always compare dates in UTC to avoid timezone-related day boundary bugs
function isSameDayUTC(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth()   === b.getUTCMonth()    &&
    a.getUTCDate()    === b.getUTCDate()
  );
}

async function handlesnap(senderid, receiverid) {
  const now = new Date();

  // Find the canonical friendship row where userId=sender, friendId=receiver
  // (there are always 2 rows per pair, one per direction)
  const row = await prismaclient.friends.findUnique({
    where: { userId_friendId: { userId: senderid, friendId: receiverid } }
  });

  const mirror = await prismaclient.friends.findUnique({
    where: { userId_friendId: { userId: receiverid, friendId: senderid } }
  });

  if (!row || !mirror) return;

  // --- Step 1: Mark that the sender snapped today (on the row where sender=userId) ---
  // userLastSnap  = when this row's userId last snapped
  // friendLastSnap = when this row's friendId last snapped
  // On the sender's row, update userLastSnap; on the mirror row, update friendLastSnap

  const senderAlreadySnappedToday = row.userLastSnap && isSameDayUTC(row.userLastSnap, now);

  if (!senderAlreadySnappedToday) {
    // Record that the sender snapped today on their row
    await prismaclient.friends.update({
      where: { id: row.id },
      data: { userLastSnap: now }
    });
    // Also mirror: the sender is the "friend" on the mirror row
    await prismaclient.friends.update({
      where: { id: mirror.id },
      data: { friendLastSnap: now }
    });
  }

  // --- Step 2: Check if the OTHER user (receiver) has ALSO snapped today ---
  // On row (userId=sender), friendLastSnap = when receiver last snapped
  // We need a fresh copy since we may have just updated things
  const freshRow = await prismaclient.friends.findUnique({
    where: { userId_friendId: { userId: senderid, friendId: receiverid } }
  });

  const receiverSnappedToday = freshRow.friendLastSnap && isSameDayUTC(freshRow.friendLastSnap, now);
  const senderSnappedToday   = freshRow.userLastSnap   && isSameDayUTC(freshRow.userLastSnap,   now);

  // Only proceed with streak logic if BOTH have snapped today
  if (!senderSnappedToday || !receiverSnappedToday) return;

  // --- Step 3: Streak increment — once per day, on both rows ---
  // We use the row's current streak to decide what to do.
  // To avoid double-incrementing (both snaps arriving close together),
  // only increment if neither row has already been incremented today.
  // We detect this by checking if the streak was last updated today.

  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);

  for (const f of [freshRow, mirror]) {
    // senderSnap on this row: f.userLastSnap
    // Streak should only be touched once: if the last time we touched it
    // was NOT today, we know we haven't incremented yet today.
    const alreadyIncrementedToday =
      f.userLastSnap && f.friendLastSnap &&
      isSameDayUTC(f.userLastSnap, now) &&
      isSameDayUTC(f.friendLastSnap, now) &&
      // heuristic: if both snaps landed today and streak is already > 0 and
      // createdAt is today → we already incremented this pair today
      // Better: use a dedicated streakUpdatedAt field, but we approximate
      // by only letting the FIRST call through. We handle this by updating
      // row first and checking optimistically.
      false; // allow both rows to update; duplicate-guard below via upsert logic

    const prevSenderSnap = f === freshRow ? row.userLastSnap : mirror.friendLastSnap;

    if (prevSenderSnap && isSameDayUTC(prevSenderSnap, now)) {
      // Sender already snapped today before this call — skip streak on this row
      // (streak was already handled on a previous snap today)
      continue;
    }

    // Check if last time either side snapped was yesterday → continue streak
    const senderWasYesterday = f.userLastSnap && isSameDayUTC(f.userLastSnap, yesterday);
    const friendWasYesterday = f.friendLastSnap && isSameDayUTC(f.friendLastSnap, yesterday);

    if (senderWasYesterday || friendWasYesterday || f.streaks === 0) {
      if (f.streaks >= 1 && !senderWasYesterday && !friendWasYesterday) {
        // Streak broken — reset to 0, will reach 1 after mutual snap
        await prismaclient.friends.update({
          where: { id: f.id },
          data: { streaks: 0 }
        });
      } else {
        // Continue or start streak
        await prismaclient.friends.update({
          where: { id: f.id },
          data: { streaks: { increment: 1 } }
        });
      }
    }
  }
}

/* ===============================
   🔹 Socket Connection
================================ */

io.on("connection", (socket) => {
  console.log(`user connected ${socket.id}`);

  /* ===============================
     🔸 user_connected
  ================================ */
  socket.on("user_connected", ({ userId }) => {
    onlineusers[userId] = socket.id;
    console.log('registered users:', userId, socket.id);
  });

  /* ===============================
     🔸 disconnect
  ================================ */
  socket.on("disconnect", () => {
    for (const uid in onlineusers) {
      if (onlineusers[uid] === socket.id) {
        delete onlineusers[uid];
        console.log(`user disconnectd ${socket.id}`);
        break;
      }
    }
  });

  /* ===============================
     🔸 join_room
  ================================ */
  socket.on("join_room", ({ userId, friendid }) => {
    const roomid = [userId, friendid].sort().join("_");
    socket.join(roomid);
    console.log(`${userId} joined ${roomid}`);
  });

  /* ===============================
     🔸 send_msg
  ================================ */
  socket.on("send_msg", async ({ roomid, msg }) => {
    console.log("message:", msg);

    const resp = await prismaclient.messages.create({
      data: msg
    });

    io.to(roomid).emit("rec_msg", { resp });

    const receiver = await prismaclient.user.findUnique({
      where: { id: msg.receiverid },
      select: { clerkId: true },
    });

    if (!receiver) return;

    // Notify the receiver's friends list
    const friendSocketId = onlineusers[receiver.clerkId];
    console.log("📤 emitting friend_lastmsg to receiver", friendSocketId);
    if (friendSocketId) {
      io.to(friendSocketId).emit("friend_lastmsg", { resp });
    }

    // Also notify the sender's friends list so it re-sorts on their end
    const sender = await prismaclient.user.findUnique({
      where: { id: msg.senderid },
      select: { clerkId: true },
    });
    if (sender) {
      const senderSocketId = onlineusers[sender.clerkId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("friend_lastmsg", { resp });
      }
    }

    if (msg.type == "SNAP") {
      await handlesnap(msg.senderid, msg.receiverid);
    }
  });

  /* ===============================
     🔸 open_snap
  ================================ */
  socket.on("open_snap", async ({ mid, roomid }) => {
    if (!mid || !roomid) {
      console.log("❌ open_snap called without mid");
      return;
    }

    const resp = await prismaclient.messages.update({
      where: { id: mid },
      data: { isopened: true }
    });

    io.to(roomid).emit("rec_snap", { resp });

    if (!resp.expiresAt) return;

    const delay = resp.expiresAt.getTime() - Date.now();

    if (delay <= 0) {
      await prismaclient.messages.delete({ where: { id: mid } });
      io.to(roomid).emit("snap_deleted", { mid });
      return;
    }

    setTimeout(async () => {
      try {
        await prismaclient.messages.delete({ where: { id: mid } });
        io.to(roomid).emit("snap_deleted", { mid });
      } catch (err) {
        console.error("Snap delete failed:", err);
      }
    }, delay);
  });

  /* ===============================
     🔸 sent_notification
  ================================ */

  socket.on("sent_multi_notification",async ({ senderid, receiversid,type,message })=>{
     for (const receiverid of receiversid) {
      const roomid = [senderid, receiverid].sort().join("_");
      const resp=await prismaclient.notifications.create({
        data:{
          senderid,
          receiverid,
          type,
          message,
          roomid,
          isopened:false,
        }
      })
      const receiver = await prismaclient.user.findUnique({
        where: { id: receiverid },
        select: { clerkId: true },
      });

      if (!receiver) continue;

      const sender = await prismaclient.user.findUnique({
        where: { id: senderid },
        select: {
          id: true,
          clerkId: true,
          name: true,
          avatar: true,
        },
      });

      if (!sender) continue;

      const recsocketid = onlineusers[receiver.clerkId];

      if (recsocketid) {
        io.to(recsocketid).emit("new_notification", {
          resp: {
            ...resp,
            sender,
            isopened: resp.isopened ?? false,
          },
        });

        io.to(recsocketid).emit("rec_notification", {
          resp: {
            ...resp,
            sender,
          },
        });
      }
      
    }
  })
  //
  socket.on("sent_notification", async (msg) => {
    try {
      const resp = await prismaclient.notifications.create({
        data: {
          senderid: msg.senderid,
          receiverid: msg.receiverid,
          type: msg.type,
          message: msg.message ?? null,
          roomid: msg.roomid ?? null,
          messageid: msg.messageid ?? null,
          isopened: false,
        },
      });

      const receiver = await prismaclient.user.findUnique({
        where: { id: msg.receiverid },
        select: { clerkId: true },
      });

      if (!receiver) return;

      const sender = await prismaclient.user.findUnique({
        where: { id: msg.senderid },
        select: {
          id: true,
          clerkId: true,
          name: true,
          avatar: true,
        },
      });

      if (!sender) return;

      const recsocketid = onlineusers[receiver.clerkId];

      if (recsocketid) {
        io.to(recsocketid).emit("new_notification", {
          resp: {
            ...resp,
            sender,
            isopened: resp.isopened ?? false,
          },
        });

        io.to(recsocketid).emit("rec_notification", {
          resp: {
            ...resp,
            sender,
          },
        });
      }
    } catch (err) {
      console.error("❌ Notification handler failed:", err);
    }
  });

  /* ===============================
     🔸 sent_multi_snap
  ================================ */
  socket.on("sent_multi_snap", async ({ senderid, receiversid, mediaurl, type }) => {
    console.log("sent_multi_snap received:", { senderid, receiversid, mediaurl, type });
    try {
      for (const receiverid of receiversid) {
        const roomid = [senderid, receiverid].sort().join("_");

        const resp = await prismaclient.messages.create({
          data: {
            senderid,
            receiverid,
            roomid,
            mediaurl,
            type,
            isopened: false,
            expiresAt: new Date(Date.now() + 10 * 1000),
          },
        });

        console.log("Message created:", resp.id);

        io.to(roomid).emit("rec_snap", { resp });

        const receiver = await prismaclient.user.findUnique({
          where: { id: receiverid },
          select: { clerkId: true },
        });

        const socketId = onlineusers[receiver?.clerkId];
        if (socketId) {
          io.to(socketId).emit("friend_lastmsg", { resp });
        }

        await handlesnap(senderid, receiverid);
      }
    } catch (err) {
      console.error("❌ sent_multi_snap error:", err);
    }
  });

});

/* ===============================
   🔹 Server Start
================================ */

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("🔴 Shutting down...");
  await prismaclient.$disconnect();
  process.exit(0);
});
