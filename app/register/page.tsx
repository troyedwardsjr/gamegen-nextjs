"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page with registration mode
    router.replace("/auth");
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
      <p>Redirecting you to the registration page...</p>
    </div>
  );
}
