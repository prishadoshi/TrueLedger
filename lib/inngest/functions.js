import { endOfMonth, startOfMonth } from "date-fns";
import { inngest } from "./client";
import { db } from "@/lib/prisma";

export const checkBudgetAlert = inngest.createFunction(
    { id: "Check Budget Alerts" },
    { cron: "0 */6 * * *" },
    async ({ step }) => {
        const budgets = await step.run("fetch-budgets", async () => {
            return await db.budget.findMany({
                include: {
                    user: {
                        include: {
                            accounts: {
                                where: {
                                    isDefault: true
                                }
                            }
                        }
                    }
                }
            })
        })

        for (const budget of budgets) {
            const defaultAccount = budget.user.accounts[0];
            if (!defaultAccount) continue;

            await step.run(`check-budget-${budget.id}`, async () => {
                const start = startOfMonth(new Date());
                const end = endOfMonth(new Date());
                
                const expenses = await db.transaction.aggregate({
                    where: {
                        userId: budget.userId,
                        accountId: defaultAccount.id,
                        type: "EXPENSE",
                        date: {
                            gte: start,
                            lte: end,
                        },
                    },
                    _sum: {
                        amount: true,
                    }
                })
                
                const totalExpenses = expenses._sum.amount?.toNumber() || 0;
                const budgetAmount = budget.amount;
                const percentageUsed = (totalExpenses / budgetAmount) * 100;
                
                if (percentageUsed >= 80 &&
                    (!budget.lastAlertSent ||
                        isNewMonth(new Date(budget.lastAlertSent), new Date())
                    )) {
                    //send mail
                     
                    //update lastAlertSent
                    await db.budget.update({
                        where: { id: budget.id },
                        data: { lastAlertSent: new Date() },
                    })
                }
            })
        }
    },
);

function isNewMonth(lastAlertDate, currentDate) {
    return (
        lastAlertDate.getMonth() !== currentDate.getMonth() ||
        lastAlertDate.getFullYear() !== currentDate.getFullYear()
    )
}