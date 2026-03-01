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

    // Credentials (email + contraseña)
    Credentials({
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
  ],

  callbacks: {
    // Controla quién puede entrar con Google OAuth:
    // solo emails que existan en la tabla `usuario` y estén activos.
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const usuario = await prisma.usuario.findUnique({
          where: { email: user.email },
        });

        if (!usuario || !usuario.activo) {
          // Email no autorizado — rechazar login
          return false;
        }

        // Actualizar lastLogin
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { lastLogin: new Date() },
        });

        // Inyectar rol y nombre desde BD para el token
        user.name = usuario.nombre;
        (user as { role?: string }).role = usuario.rol;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "USUARIO";
      }
      // Para Google OAuth: en el primer sign-in, rellenar rol desde BD
      if (account?.provider === "google" && token.email && !token.role) {
        const usuario = await prisma.usuario.findUnique({
          where: { email: token.email },
        });
        token.role = usuario?.rol ?? "USUARIO";
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "USUARIO";
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
