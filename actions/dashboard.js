"user server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";
import Error from "next/error";

   //server-side actions

const serializeTransaction = (obj)=>{
    const serialized= {...obj};
    if(obj.balance){
        serialized.balance = obj.balance.toNumber();
    } 
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

        const shouldBeDefault = existingAccounts.length === 0? true: data.isDefault;

        if(shouldBeDefault){    //make other accounts not default(only one account can be default)
            await db.account.updateMany({
                where: {userid: user.id, isDefault: true},
                data: {isDefault: false}
            })
        }

        const account =await db.account.create({
            data:{
                ...data,
                balance: balanceFloat,
                userId: user.id,
                isDefault: shouldBeDefault,
            }
        })

        const serializedAccount= serializeTransaction(account);

        revalidatePath("/dashboard")
        return {success: true, data: serializedAccount}
    } catch (error) {
        throw new Error(error.message)
    }
}
