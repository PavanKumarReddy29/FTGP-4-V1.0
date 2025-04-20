'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SignUp() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [wallet, setWallet] = useState('')
  const router = useRouter()

  const handleRegister = () => {
    if (!firstName || !lastName || !email || !wallet) {
      return alert('Please fill in all fields!')
    }

    if (localStorage.getItem(`user_${email}`)) {
      return alert('This email is already registered. Please log in!')
    }

    const userData = { firstName, lastName, email, wallet }
    localStorage.setItem(`user_${email}`, JSON.stringify(userData))
    alert('Registration successful ✅ Please log in!')
    router.push('/login')
  }

  return (
    <main className="relative flex items-center justify-center h-screen overflow-hidden">

      {/* 🌐 Background image */}
      <Image
        src="/globe.png"
        alt="Background"
        fill
        className="object-cover z-0"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-blue-900/70 z-10" />

      {/* Registration box */}
      <div className="z-20 bg-white p-8 rounded shadow text-center space-y-4 w-[320px]">
        <h1 className="text-2xl font-bold text-blue-800">Register Your Info</h1>

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border border-gray-300 px-4 py-2 w-full rounded"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border border-gray-300 px-4 py-2 w-full rounded"
        />
        <input
          type="email"
          placeholder="Email Address"
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
          onClick={handleRegister}
        >
          Register
        </button>
      </div>
    </main>
  )
}







