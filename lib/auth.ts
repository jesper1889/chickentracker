import NextAuth, { DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from './generated/prisma/client';
import * as bcrypt from 'bcryptjs';
import { JWT } from '@auth/core/jwt';

// Extend NextAuth types to include user ID in session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
}

// Extend JWT token types
declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    name?: string | null;
  }
}

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Configure session strategy to use JWT (no database sessions)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds (2592000)
  },

  // Configure custom pages
  pages: {
    signIn: '/login',
    signOut: '/login',
  },

  // Configure authentication providers
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate that credentials exist
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Query database for user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
          });

          // Return null if user not found
          if (!user) {
            return null;
          }

          // Verify password using bcrypt
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          // Return null if password is invalid
          if (!isValidPassword) {
            return null;
          }

          // Return user object on success
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],

  // Configure callbacks
  callbacks: {
    // JWT callback: Include user ID and email in JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    // Session callback: Attach user ID and email from token to session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null | undefined;
      }
      return session;
    },
  },
});
