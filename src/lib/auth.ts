import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
 
const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: { 
        enabled: true,
        autoSignIn: true,
        async sendResetPassword(data, request) {
            // @TODO: Handle the resend password email
            console.log('Resend password ==> ', data, request);
        },
        plugins: [nextCookies()]
    },
});