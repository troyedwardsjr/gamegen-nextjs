"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { motion } from "framer-motion";

import { useAuth } from "@/lib/auth/context";
import {
  EyeIcon,
  EyeOffIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@/components/icons";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        if (result.success) {
          router.push("/dashboard");
        } else {
          setError(result.error || "Sign in failed");
        }
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }
        
        const result = await signUp(email, password);
        if (result.success) {
          if (result.requiresEmailVerification) {
            setError("Please check your email to verify your account");
          } else {
            router.push("/dashboard");
          }
        } else {
          setError(result.error || "Sign up failed");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-8">
      {/* Animated Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse opacity-70" style={{animationDelay: '1s', animationDuration: '4s'}} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-to-r from-pink-400/25 to-purple-400/25 rounded-full blur-2xl animate-bounce opacity-50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl border border-white/20">
              {isLogin ? (
                <ArrowRightOnRectangleIcon className="w-8 h-8 text-white" />
              ) : (
                <UserIcon className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="pt-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isLogin ? "Welcome Back" : "Join GameGen"}
              </h2>
              <p className="text-gray-300">
                {isLogin 
                  ? "Sign in to your account" 
                  : "Create your account to get started"
                }
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full"
                  classNames={{
                    input: "bg-transparent text-white placeholder:text-gray-400",
                    inputWrapper: "bg-white/10 backdrop-blur-xl border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 data-[hover=true]:bg-white/15"
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <Input
                  type={isVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Enter password" : "Create a password"}
                  className="w-full"
                  classNames={{
                    input: "bg-transparent text-white placeholder:text-gray-400",
                    inputWrapper: "bg-white/10 backdrop-blur-xl border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 data-[hover=true]:bg-white/15"
                  }}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {isVisible ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  }
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full"
                    classNames={{
                      input: "bg-transparent text-white placeholder:text-gray-400",
                      inputWrapper: "bg-white/10 backdrop-blur-xl border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 data-[hover=true]:bg-white/15"
                    }}
                    required
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm text-center backdrop-blur-xl">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!email || !password || (!isLogin && !confirmPassword)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading 
                ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </Button>
          </form>

          {/* Switch between Login/Signup */}
          <div className="text-center mt-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <span className="text-gray-300">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </span>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}