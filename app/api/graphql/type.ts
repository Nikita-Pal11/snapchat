// graphql/types.ts

export interface UserRequestsArgs {
  userId: string;
}

export interface FriendsListArgs {
  userId: string;
}

export interface FindUserArgs {
  name: string;
  userid: string;
}

export interface GetUserArgs {
  id: string;
}

export interface FetchMsgArgs {
  roomid: string;
}

export interface FriendRequestArgs {
  senderid: string;
  receiverid: string;
  status?: string;
}

export interface AcceptRequestArgs {
  requestid: string;
}
