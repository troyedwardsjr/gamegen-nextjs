"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

import { useAuth } from "@/lib/auth/context";
import { SOCIAL_PROVIDERS } from "@/lib/auth/social";
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
  const { signIn, signUp, signInWithProvider } = useAuth();

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
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    setError("");
    try {
      const result = await signInWithProvider(provider);
      if (!result.success) {
        setError(result.error || `${provider} authentication failed`);
      }
      // Note: On success, the user will be redirected to the OAuth provider
      // and then back to our callback URL
    } catch (err) {
      setError(`${provider} authentication failed. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-8">
      {/* Animated Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse opacity-60" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse opacity-70"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
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
                  : "Create your account to get started"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            className="space-y-6"
            data-testid={isLogin ? "login-form" : "register-form"}
            onSubmit={handleSubmit}
          >
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-200 mb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <Input
                  required
                  className="w-full"
                  classNames={{
                    input:
                      "bg-transparent text-white placeholder:text-gray-400",
                    inputWrapper:
                      "bg-white/10 backdrop-blur-xl border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 data-[hover=true]:bg-white/15",
                  }}
                  data-testid="email-input"
                  id="email"
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-200 mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <Input
                  required
                  className="w-full"
                  classNames={{
                    input:
                      "bg-transparent text-white placeholder:text-gray-400",
                    inputWrapper:
                      "bg-white/10 backdrop-blur-xl border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 data-[hover=true]:bg-white/15",
                  }}
                  data-testid="password-input"
                  endContent={
                    <button
                      className="text-gray-400 hover:text-white transition-colors"
                      data-testid="password-toggle"
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                    >
                      {isVisible ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  }
                  id="password"
                  placeholder={isLogin ? "Enter password" : "Create a password"}
                  type={isVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {!isLogin && (
                <div>
                  <label
                    className="block text-sm font-medium text-gray-200 mb-2"
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </label>
                  <Input
                    required
                    className="w-full"
                    classNames={{
                      input:
                        "bg-transparent text-white placeholder:text-gray-400",
                      inputWrapper:
                        "bg-white/10 backdrop-blur-xl border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 data-[hover=true]:bg-white/15",
                    }}
                    data-testid="confirm-password-input"
                    id="confirm-password"
                    placeholder="Confirm your password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && (
              <div
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm text-center backdrop-blur-xl"
                data-testid={isLogin ? "login-error" : "registration-error"}
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50"
              data-testid={isLogin ? "login-button" : "register-button"}
              disabled={!email || !password || (!isLogin && !confirmPassword)}
              isLoading={isLoading}
              type="submit"
            >
              {isLoading
                ? isLogin
                  ? "Signing In..."
                  : "Creating Account..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          {/* Social Authentication */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Divider className="w-full border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-gray-300">
                  or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {/* Discord Button */}
              <Button
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-[#5865F2]/25 transition-all duration-300 flex items-center justify-center gap-3"
                data-testid="discord-auth-button"
                onClick={() => handleSocialAuth("discord")}
              >
                <span className="text-xl">🎮</span>
                Continue with Discord
              </Button>

              {/* Google Button */}
              <Button
                className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-xl shadow-lg hover:shadow-gray-500/25 transition-all duration-300 flex items-center justify-center gap-3 border border-gray-200"
                data-testid="google-auth-button"
                onClick={() => handleSocialAuth("google")}
              >
                <span className="text-xl">🔍</span>
                Continue with Google
              </Button>

              {/* GitHub Button */}
              <Button
                className="w-full bg-[#171515] hover:bg-black text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-gray-500/25 transition-all duration-300 flex items-center justify-center gap-3"
                data-testid="github-auth-button"
                onClick={() => handleSocialAuth("github")}
              >
                <span className="text-xl">⚡</span>
                Continue with GitHub
              </Button>
            </div>
          </div>

          {/* Switch between Login/Signup */}
          <div className="text-center mt-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <span className="text-gray-300">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                  data-testid={
                    isLogin ? "switch-to-register" : "switch-to-login"
                  }
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </span>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <Link
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              href="/"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
