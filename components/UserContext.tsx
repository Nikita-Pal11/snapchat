'use client'
import gqlclient from "@/service/gql";
import { GET_USER } from "@/service/gql/queries";
import { useUser } from "@clerk/nextjs"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
type UserContextType={
    curruser:any|null,
    loading:boolean,
    notificationlength: number;
  setnotificationlength: React.Dispatch<React.SetStateAction<number>>;
}
const usercontext=createContext<UserContextType>({
    curruser:null,
    loading:true,
    notificationlength:0,
    setnotificationlength:()=>{}
});
export function UserContext({children}:{children:ReactNode}) {
    const {user}=useUser();
    const[curruser,setcurruser]=useState(null);
    const[loading,setLoading]=useState(true);
    const[notificationlength,setnotificationlength]=useState(0);
    useEffect(()=>{
        if (!user?.id) return;
         async function fetchUser() {
      try {
        setLoading(true);
        const resp = await gqlclient.request(GET_USER, {
          getuserId: user?.id,
        });
        setcurruser(resp.getuser);
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
    },[user])

  return (
   
      <usercontext.Provider value={{curruser,loading,notificationlength,setnotificationlength}}>
        {children}
      </usercontext.Provider>

  )
}

export const useCurrUser=()=>useContext(usercontext)
