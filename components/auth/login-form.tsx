"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"email" | "wallet">("email")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - redirect to home
    router.push("/home")
  }

  const connectWallet = () => {
    // Mock wallet login
    router.push("/home")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <span className="font-bold">R</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-8">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Welcome back</h1>
              <p className="text-white/60">Log in to your account</p>
            </div>

            {/* Login Method Toggle */}
            <div className="flex gap-2 rounded-xl bg-white/5 p-1">
              <button
                onClick={() => setLoginMethod("email")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  loginMethod === "email" ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setLoginMethod("wallet")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  loginMethod === "wallet" ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                Wallet
              </button>
            </div>

            {loginMethod === "email" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    required
                  />
                </div>

                <button type="button" className="text-sm text-white/60 hover:text-white">
                  Forgot password?
                </button>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full bg-white text-black hover:bg-white/90 h-14 text-base font-semibold mt-6"
                >
                  Log in
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={connectWallet}
                  className="w-full h-20 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white justify-start px-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">MetaMask</div>
                      <div className="text-sm text-white/60">Connect with MetaMask</div>
                    </div>
                  </div>
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-white/60">
              Don't have an account?{" "}
              <Link href="/signup" className="text-white underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
