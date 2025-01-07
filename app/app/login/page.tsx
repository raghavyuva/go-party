"use client"
import { LoginForm } from "@/components/login-form"
import React from "react"

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    setIsLoading(true)
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="bg-background text-foreground h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }
  if (isLoggedIn) {
    return window.location.href = "/"
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
