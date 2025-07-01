"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { endOfMonth, startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";


export async function getCurrentBudget(accountId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const budget = await db.budget.findFirst({
            where: {
                userId: user.id,
            },
        });

        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        
        const expenses = await db.transaction.aggregate({
            where: {
                userId: user.id,
                type: "EXPENSE",
                date: {
                    gte: start,
                    lte: end,
                },
                accountId,
            },
            _sum: {
                amount: true,
            },
        });

        return {
            budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
            currentExpenses: expenses._sum.amount
                ? expenses._sum.amount.toNumber()
                : 0,
        };
    } catch (error) {
        console.error("Error fetching budget:", error);
        throw error;
    }
}

export async function updateBudget(amount) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        //upsert- to update or create budget
        const budget = await db.budget.upsert({
            where: {
                userId: user.id,
            },
            update: {
                amount,
            },
            create: {
                userId: user.id,
                amount,
            },
        })
        revalidatePath("/dashboard");
        return {
            success: true,
            data: { ...budget, amount: budget.amount.toNumber() },
        };
    } catch (error) {
        console.error("Error updating budget:", error);
        return { success: false, error: error.message };
    }
}