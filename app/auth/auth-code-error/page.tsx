"use client";

import Link from "next/link";
import { Button } from "@heroui/button";
import { ExclamationTriangleIcon } from "@/components/icons";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-8">
      {/* Animated Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse opacity-60" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse opacity-70"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl border border-white/20">
              <ExclamationTriangleIcon className="w-8 h-8 text-white" />
            </div>
            <div className="pt-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Authentication Error
              </h2>
              <p className="text-gray-300">
                Something went wrong during the authentication process.
              </p>
            </div>
          </div>

          {/* Error Details */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <h3 className="text-red-300 font-semibold mb-2">What happened?</h3>
            <p className="text-red-200/80 text-sm mb-3">
              The OAuth authentication flow encountered an error. This could be due to:
            </p>
            <ul className="text-red-200/80 text-sm space-y-1 ml-4">
              <li>• Expired or invalid authentication code</li>
              <li>• Network connectivity issues</li>
              <li>• Cancelled authentication process</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              as={Link}
              href="/auth"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              Try Again
            </Button>
            
            <Button
              as={Link}
              href="/"
              variant="bordered"
              className="w-full border-white/20 text-white hover:bg-white/10 py-3 rounded-xl transition-all duration-300"
            >
              Back to Home
            </Button>
          </div>

          {/* Help */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Need help? Contact{" "}
              <Link
                href="/support"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}