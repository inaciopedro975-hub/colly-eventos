import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        if (!token) return false;
        // Respeita o prazo do "Lembrar de mim": expira a sessão curta (12h)
        const exp = (token as { expiresAt?: number }).expiresAt;
        if (typeof exp === "number" && Date.now() > exp) return false;
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
