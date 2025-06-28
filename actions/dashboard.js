"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj)=>{
    const serialized= {...obj};
    if(obj.balance){
        serialized.balance = obj.balance.toNumber();
    } 
    return serialized;
}

export async function createAccount(data){
    try {
        const {userId}= await auth();
        if (!userId) throw new Error("Unauthorized");
        
        const user = await db.user.findUnique({
            where: { clerkUserId : userId},
        })

        if (!user){
            throw new Error("User Not Found!");
        }

        //Convert balance to float before saving
        const balanceFloat = parseFloat(data.balance)
        if (isNaN(balanceFloat)){
            throw new Error("Invalid Balance amount.");
        }

        //Check if this is the user's first account
        const existingAccounts = await db.account.findMany({
            where: {userId: user.id}
        })
        
        // If it's the first account, make it default regardless of user input
        // If not, use the user's preference
        const shouldBeDefault = existingAccounts.length === 0? true: data.isDefault;

        if(shouldBeDefault){    //make other accounts not default(only one account can be default)
            await db.account.updateMany({
                where: {userId: user.id, isDefault: true},
                data: {isDefault: false}
            })
        }

        // Create new account
        const account =await db.account.create({
            data:{
                ...data,
                balance: balanceFloat,
                userId: user.id,
                isDefault: shouldBeDefault,
            }
        })

        // Serialize the account before returning
        const serializedAccount= serializeTransaction(account);

        revalidatePath("/dashboard")
        return {success: true, data: serializedAccount}
    } catch (error) {
        throw new Error(error.message)
    }
}
