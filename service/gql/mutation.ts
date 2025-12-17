import { gql } from "graphql-request";

export const REQUEST_FRIEND=gql`
mutation FriendRequest($senderid: String!, $receiverid: String!) {
  friendRequest(senderid: $senderid, receiverid: $receiverid)
}
`
export const ACCEPT_REQUEST=gql`
mutation AcceptRequest($requestid: String!) {
  AcceptRequest(requestid: $requestid)
}`

export const READ_NOTICN=gql`
mutation ReadNotification($readNotificationId: String!) {
  readNotification(id: $readNotificationId)
}
`