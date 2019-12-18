/**
 * Submit to events of mainnet on erasure graph to listen to events and tweet
 */

require("dotenv").config()
const Twitter = require("twitter")
const { ApolloClient } = require("apollo-client")
const { InMemoryCache } = require('apollo-cache-inmemory');
const gql = require("graphql-tag")
const GRAPHQL_ENDPOINT= "wss://api.thegraph.com/subgraphs/name/jgeary/erasure"
const ws = require("ws")
const { WebSocketLink } =require('apollo-link-ws');
const Queries = require("./Queries_v1")

function watch_events(){

    var twitter = new Twitter({
        consumer_key: process.env.COMSUMER_KEY,
        consumer_secret: process.env.COMSUMER_SERCRET,
        access_token_key: process.env.ACCESS_TOKEN_KEY,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
    });


    const link = new WebSocketLink({uri:GRAPHQL_ENDPOINT, options:{
        reconnect: true
    },webSocketImpl:ws});


    const apolloClient = new ApolloClient({
        link,
        cache:new InMemoryCache()
    });
    for (let event in Queries) {
        let init = true
        const q = Queries[event]
        apolloClient.subscribe({
            query: gql`
      subscription {
          ${event}{
              ${q.returnData}
          }
      }`
        }).subscribe({
            next (data) {
                if(init){
                    console.log(data.data)
                    init=false
                }
                else{
                //tweet
                    twitter.post('statuses/update', {status: `${data}`},  function(error, tweet, response) {
                        if(error){
                            console.log(error)
                        }
                    });
                }
            }
        });
    }

}

watch_events()