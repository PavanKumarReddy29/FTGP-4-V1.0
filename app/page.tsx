'use client'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] px-6 text-white">
      <div className="max-w-7xl w-full flex flex-col md:flex-row items-center justify-between gap-10 py-12">
        
        {/* Left text section */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Decentralized transfers <br />
            <span className="text-white/90">no borders, no intermediaries, no waiting.</span>
          </h1>
          <p className="text-lg text-white/80">
            FTGP — Break free from high remittance fees and delays. A new way to transfer money globally and freely.
          </p>
          <div className="flex gap-4">
            <Link href="/login">
              <button className="bg-white text-blue-700 font-semibold px-6 py-2 rounded shadow hover:bg-blue-100 transition">
                Login
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-blue-900 text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition">
                Sign Up
              </button>
            </Link>
          </div>
        </div>

        {/* Right image section */}
        <div className="md:w-1/2 flex justify-center">
          <div className="bg-white rounded-lg p-2 shadow-xl">
            <Image
              src="/here.png"  
              alt="Landing Visual"
              width={480}
              height={360}
              className="rounded-md"
            />
          </div>
        </div>
      </div>
    </main>
  )
}









