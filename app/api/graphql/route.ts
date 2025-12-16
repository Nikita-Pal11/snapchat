import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { ApolloServer } from "@apollo/server";
import { NextRequest } from "next/server";
import { gql } from "graphql-tag";
import prismaclient from "@/service/prisma";
import Friends from "@/components/Friends";

const typeDefs = gql`
 
  type Query {
    userRequests(userId:String!):[RequestTable]
    friendsList(userId:String!):[friendlist]
    finduser(name:String!,userid:String!):[User]
    getuser(id:String!):User
    fetchmsg(roomid:String!):[messages]
  }
  type Mutation {
  friendRequest(senderid:String!,receiverid:String!,status:String):Boolean
  AcceptRequest(requestid:String!):Boolean
  }
  type  RequestTable {
      id:String
      senderid:String
      receiverid:String
      status:String
      sender:User
      receiver:User
      }
    type friends {
    id:String
    userId:String
    friendId:String
    streaks:Int
    friend:User
    }
    type friendlist {
    id:String
    streaks:Int
    friend:User
    lastmsg:messages
    }
   
type User{
id:String
clerkId:String
email:String
name:String
avatar:String
isFriend: Boolean
  requestSent: Boolean
  requestReceived: Boolean
}

type messages{
id:String
senderid:String
receiverid:String
roomid: String
  text: String
  mediaurl: String
  isopened:  Boolean
  type:msgtype
  createdAt:String
  updatedAt:String
}
  enum msgtype{
  TEXT
  SNAP
  IMAGE
  VIDEO
}
  
`;

const resolvers = {
  Query: {
    userRequests: async (_:any,args:any) => {
        return await prismaclient.requestTable.findMany({
            where:{
                receiverid:args.userId
            },
            include:{
                sender:true,
                receiver:true
            }
        })
    },
    friendsList: async (_:any,args:any)=>{
        const friends= await prismaclient.friends.findMany({
            where:{
                userId:args.userId
            },
            include:{
                friend:true
            }
        })
        const resp=await Promise.all(
            friends.map(async (f:any)=>{
                const lastmsg=await prismaclient.messages.findFirst({
                    where:{
                        OR:[
                            {senderid:args.userId,receiverid:f.friendId},
                            {senderid:f.friendId,receiverid:args.userId}
                    ]
                    },
                    orderBy: { createdAt: "desc" }
                })
                return {
                    ...f,
                    lastmsg
                }
            })
        )
        return resp
    },
    finduser: async (_:any,args:any)=>{
       const users=await prismaclient.user.findMany({
        where:{
            AND:[
                {
                    name:{
                        contains:args.name,
                        mode:"insensitive"
                    },
                    id:{not:args.userid}
                }
            ]
        },
       include: {
      friends: true,
      receivedRequests: {
        where: {
          senderid: args.userid,
          status: "PENDING",
        },
      },
      sentRequests: {
        where: {
          receiverid: args.userid,
          status: "PENDING",
        },
      },
    },
       })
       return users.map(u => ({
    ...u,
    isFriend: u.friends.some(f => f.friendId === args.userid),
    requestSent: u.receivedRequests.length > 0,
    requestReceived: u.sentRequests.length > 0,
  }));

    },
    getuser: async (_:any,args:any)=>{
        return await prismaclient.user.findUnique({
            where:{
                clerkId:args.id
            }
        })
    },
    fetchmsg:async (_:any,args:any)=>{
        return await prismaclient.messages.findMany({
            where:{
                roomid:args.roomid
            }
        })
    }
  },
  Mutation:{
    friendRequest: async (_:any,args:any)=>{
        await prismaclient.requestTable.create({
            data:{
                senderid:args.senderid,
               receiverid:args.receiverid,
                status:"PENDING"
            }
        })
        return true;
    },
    AcceptRequest: async (_:any,args:any)=>{
       const request=await prismaclient.requestTable.findUnique({
        where:{
            id:args.requestid
        }
       })
       if(!request)return false;
       await prismaclient.$transaction([
        prismaclient.friends.create({
            data:{
                userId:request.senderid,
                friendId:request.receiverid
            }
        }),
        prismaclient.friends.create({
            data:{
                userId:request.receiverid,
                friendId:request.senderid
            }
        }),
        prismaclient.requestTable.delete({
            where:{
                id:args.requestid
            }
        })
       ])
       return true;
    }
  }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// Typescript: req has the type NextRequest
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
    context: async req => ({ req }),
});

export { handler as GET, handler as POST }; 