import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

const handler = NextAuth({
  providers: googleConfigured
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
