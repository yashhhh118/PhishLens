"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 sm:w-[350px] p-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">PhishLens</h1>
          <p className="text-sm text-gray-400">Sign in to scan your Gmail inbox</p>
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50 bg-white text-gray-900 hover:bg-gray-200 h-10 px-4 py-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
