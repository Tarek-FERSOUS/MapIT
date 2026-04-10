"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 p-4">
      <div className="w-full max-w-md">
        <div className="card space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">MapIT</h1>
            <p className="text-sm text-slate-600 mt-2">
              Asset & Problem Management Platform
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="input"
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input"
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary-600"
                  disabled={isLoading}
                />
                <span className="ml-2 text-slate-600">Remember me</span>
              </label>
              <Link
                href="#"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Dev Mode Info */}
          <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>Dev credentials:</strong> username: admin, password: password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
