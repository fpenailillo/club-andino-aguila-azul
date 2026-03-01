import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Google OAuth (Google Workspace del club)
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),

    // Credentials (email + contraseña) — para ADMIN, TESORERO, USUARIO
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario || !usuario.activo) return null;

        // Socios usan magic link, no contraseña
        if (usuario.rol === "SOCIO") return null;

        const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
        if (!passwordValido) return null;

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: usuario.id.toString(),
          email: usuario.email,
          name: usuario.nombre,
          role: usuario.rol,
        };
      },
    }),

    // Magic Link — para SOCIO (portal del socio)
    Credentials({
      id: "magic-link",
      name: "magic-link",
      credentials: {
        token: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        const tokenRecord = await prisma.magicLinkToken.findUnique({
          where: { token: credentials.token as string },
        });

        if (!tokenRecord) return null;
        if (tokenRecord.usedAt) return null;
        if (tokenRecord.expiresAt < new Date()) return null;

        // Marcar como usado (single-use)
        await prisma.magicLinkToken.update({
          where: { id: tokenRecord.id },
          data: { usedAt: new Date() },
        });

        const usuario = await prisma.usuario.findUnique({
          where: { email: tokenRecord.email },
        });

        if (!usuario || !usuario.activo || usuario.rol !== "SOCIO") return null;

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: usuario.id.toString(),
          email: usuario.email,
          name: usuario.nombre,
          role: usuario.rol,
        };
      },
    }),
  ],

  callbacks: {
    // Google OAuth: solo emails registrados en la BD (no socios)
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const usuario = await prisma.usuario.findUnique({
          where: { email: user.email },
        });

        if (!usuario || !usuario.activo || usuario.rol === "SOCIO") {
          return false;
        }

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { lastLogin: new Date() },
        });

        user.name = usuario.nombre;
        (user as { role?: string }).role = usuario.rol;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "USUARIO";
        token.sub = user.id;
      }

      // Para Google OAuth: obtener rol desde BD
      if (account?.provider === "google" && token.email && !token.role) {
        const usuario = await prisma.usuario.findUnique({
          where: { email: token.email },
        });
        token.role = usuario?.rol ?? "USUARIO";
      }

      // Para SOCIO: inyectar socioId en el token
      if (token.role === "SOCIO" && token.sub && !token.socioId) {
        const socio = await prisma.socio.findFirst({
          where: { usuarioId: parseInt(token.sub as string) },
          select: { id: true },
        });
        token.socioId = socio?.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "USUARIO";
        if (token.socioId) {
          session.user.socioId = token.socioId as number;
        }
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },
});
