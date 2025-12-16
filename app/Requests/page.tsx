'use client'

import { useCurrUser } from "@/components/UserContext";
import gqlclient from "@/service/gql";
import { USER_REQUESTS } from "@/service/gql/queries";
import UserComp from "@/components/Usercomp";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ACCEPT_REQUEST } from "@/service/gql/mutation";
import { RequestTable, User } from "@prisma/client";
type RequestWithUsers = RequestTable & {
  sender: User;
  receiver: User;
};
function page() {
    const[allrequests,setrequests]=useState<RequestWithUsers[]>();
    const[loading,setLoading]=useState(false);
    const{curruser}=useCurrUser();
 async function acceptRequest(reqid:string){
       try{
        const resp=await gqlclient.request(ACCEPT_REQUEST,{
            requestid:reqid
        })
        if(resp.AcceptRequest){
            const updatedreq=allrequests?.filter((val)=>val.id!==reqid);
            setrequests(updatedreq);
        }
       }
       catch(err){
        console.log(err);
       }
    }
    useEffect(()=>{
        if(!curruser)return;
        async function friendRequest(){
            try{
                setLoading(true)
                const resp=await gqlclient.request(USER_REQUESTS,{
                    userId:curruser.id
                })
                console.log(resp);
                setrequests(resp.userRequests || []);
            }
            catch(err){
                console.log(err);
            }
            finally{
                setLoading(false);
            }
        }
        friendRequest();
    },[curruser])

  return (
    <div className="flex justify-center w-full h-screen text-white">
      <div className="w-full max-w-[420px] h-full p-4 flex flex-col bg-black">


       
        <h1 className="text-xl font-bold mb-3">Friends Requests</h1>

        <div className="flex-1 overflow-y-auto">
  {loading && (
    <p className="text-center text-white/40 py-4">Loading...</p>
  )}

  {allrequests?.length === 0 && (
    <p className="text-center text-white/40 py-4">No Requests</p>
  )}

  {allrequests?.map((val) => (
    <motion.div
      key={val.senderid}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <UserComp
        name={val.sender.name || ""}
        avatar={val.sender.avatar || ""}
        subtitle={val.sender.email}
        showAccept
        onAccept={()=>{acceptRequest(val.id)}}
      />
    </motion.div>
  ))}
</div>

      </div>
    </div>
  )
}

export default page
