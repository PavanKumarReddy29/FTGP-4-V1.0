'use client'

export default function Success() {
  return (
    <div className="min-h-screen text-white px-4 md:px-6 py-12 bg-[url('/money.png')] bg-cover bg-center bg-no-repeat bg-blend-overlay" style={{ backgroundColor: 'rgba(11, 14, 17, 0.85)' }}>
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-bold text-yellow-400">Redemption Successful!</h1>
        <p className="mt-4 text-gray-300">Your funds will be processed off-chain.</p>

        {/* Interactive Button */}
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-10 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-full font-semibold transition duration-200"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
