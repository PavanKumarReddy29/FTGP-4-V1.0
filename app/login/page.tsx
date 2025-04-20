'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Login() {
  const [email, setEmail] = useState('')
  const [wallet, setWallet] = useState('')
  const router = useRouter()

  const handleLogin = () => {
    if (!email || !wallet) return alert('Please enter your email and wallet address!')

    const storedData = localStorage.getItem(`user_${email}`)

    if (!storedData) {
      return alert('User not registered. Please sign up first!')
    }

    const userData = JSON.parse(storedData)

    if (userData.wallet === wallet) {
      alert('Login successful ✅')
      localStorage.setItem('wallet', wallet)
      router.push('/dashboard')
    } else {
      alert('Wallet address does not match. Please check again!')
    }
  }

  return (
    <main className="relative flex items-center justify-center h-screen overflow-hidden">

      {/* 🌐 Background Image */}
      <Image
        src="/globe.png"
        alt="Background"
        fill
        className="object-cover z-0"
      />

      {/* Translucent overlay */}
      <div className="absolute inset-0 bg-blue-900/70 z-10" />

      {/* Login Box */}
      <div className="z-20 bg-white p-8 rounded shadow text-center space-y-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-blue-800">Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 px-4 py-2 w-full rounded"
        />

        <input
          type="text"
          placeholder="Wallet Address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="border border-gray-300 px-4 py-2 w-full rounded"
        />

        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
          onClick={handleLogin}
        >
          Log In
        </button>
      </div>
    </main>
  )
}







