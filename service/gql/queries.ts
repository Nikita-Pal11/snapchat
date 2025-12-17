import { gql } from "graphql-request";

export const FIND_FRIENDS=gql`
query Finduser($name: String!, $userid: String!) {
  finduser(name: $name, userid: $userid) {
    name
    isFriend
    requestSent
    requestReceived
    email
    id
    avatar
  }
}
`

export const GET_USER=gql`
query Getuser($getuserId: String!) {
  getuser(id: $getuserId) {
    name
    id
    avatar
    email
    clerkId
  }
}`

export const USER_REQUESTS=gql`
query UserRequests($userId: String!) {
  userRequests(userId: $userId) {
    status
    senderid
    id
    sender {
      name
      avatar
      email
    }
  }
}
`

export const FRIEND_LIST=gql`
query FriendsList($userId: String!) {
  friendsList(userId: $userId) {
    streaks
    id
    friend {
      id
      avatar
      name
      email
      clerkId
    }
    lastmsg {
      id
      type
      senderid
      receiverid
      isopened
      roomid
      mediaurl
        createdAt
  updatedAt
    }
  }
}
`

export const FETCH_MSG=gql`
query Fetchmsg($roomid: String!) {
  fetchmsg(roomid: $roomid) {
    text
    senderid
    roomid
    receiverid
    mediaurl
    isopened
    id
    type
     createdAt
  updatedAt
  }
}
`

export const FETCH_NOTIFICATION=gql`
query Fetchnotification($userId: String!) {
  fetchnotification(userId: $userId) {
    id
    senderid
    receiverid
    roomid
    message
    isopened
    sender {
      name
      avatar
      id
    }
    type
    createdAt
  }
}
`