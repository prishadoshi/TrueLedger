import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "true-ledger" , name:"TrueLedger", 
    retryFunction: async(attempt)=>({
        delay: Math.pow(2,attempt)*100, //Expontential Backoff
        maxAttempts: 2,
    })
});
