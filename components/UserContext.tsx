'use client'
import gqlclient from "@/service/gql";
import { GET_USER } from "@/service/gql/queries";
import { useUser } from "@clerk/nextjs"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
type UserContextType={
    curruser:any|null,
    loading:boolean
}
const usercontext=createContext<UserContextType>({
    curruser:null,
    loading:true
});
export function UserContext({children}:{children:ReactNode}) {
    const {user}=useUser();
    const[curruser,setcurruser]=useState(null);
    const[loading,setLoading]=useState(true);
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
   
      <usercontext.Provider value={{curruser,loading}}>
        {children}
      </usercontext.Provider>

  )
}

export const useCurrUser=()=>useContext(usercontext)
