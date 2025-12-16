import { GraphQLClient } from "graphql-request";
const gqlclient=new GraphQLClient("http://localhost:3000/api/graphql");
export default gqlclient