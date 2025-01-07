"use client"
import { LoginForm } from "@/components/login-form";
import React from "react";
import Home from "./home/page";

export default function AuthWrapper() {
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
  return (
    <div className="bg-background text-foreground">
      {isLoggedIn ? <Home /> : <LoginForm />}
    </div>
  )
}