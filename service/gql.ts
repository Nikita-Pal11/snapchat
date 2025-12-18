import { GraphQLClient } from "graphql-request";
const gqlclient=new GraphQLClient(process.env.NEXT_PUBLIC_URL+"/api/graphql");
export default gqlclient