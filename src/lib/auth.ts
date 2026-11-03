import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { env } from "./env";

// Only providers with credentials are enabled, so local dev works without OAuth apps.
const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET && {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    }),
  ...(env.FACEBOOK_CLIENT_ID &&
    env.FACEBOOK_CLIENT_SECRET && {
      facebook: { clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET },
    }),
};

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders,
  // Test-only: lets end-to-end tests sign in without real OAuth.
  emailAndPassword: { enabled: env.E2E_TEST_LOGIN },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            role: env.ADMIN_EMAILS.includes(user.email.toLowerCase()) ? "admin" : "user",
          },
        }),
      },
    },
  },
  plugins: [
    admin({ bannedUserMessage: "Ton compte a été suspendu par un administrateur." }),
    nextCookies(),
  ],
});

export const enabledProviders = Object.keys(socialProviders) as ("google" | "facebook")[];
