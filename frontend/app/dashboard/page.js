"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-lg">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Welcome back, <span className="text-white font-medium">{session.user?.name}</span> ({session.user?.email})
          </p>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/20 h-10 px-4 py-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
