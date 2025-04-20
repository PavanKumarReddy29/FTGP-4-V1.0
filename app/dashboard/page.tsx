'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BrowserProvider, Contract, formatUnits } from 'ethers'

import { FTGP_ADDRESS } from '../../lib/contract'
import ftgpAbi from '../../lib/abi.json'

export default function Dashboard() {
  const [wallet, setWallet] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const [ftgpBalance, setFtgpBalance] = useState('0.00')
  const router = useRouter()

  useEffect(() => {
    setUserId(Math.floor(100000000 + Math.random() * 900000000))
  }, [])

  useEffect(() => {
    const storedWallet = localStorage.getItem('wallet')
    if (!storedWallet) {
      alert('Please log in first!')
      router.push('/login')
    } else {
      setWallet(storedWallet)
      fetchBalance(storedWallet)
    }
  }, [router])

  const fetchBalance = async (address: string) => {
    try {
      const provider = new BrowserProvider(window.ethereum)
      const contract = new Contract(FTGP_ADDRESS, ftgpAbi, provider)
      const raw = await contract.balanceOf(address)
      const formatted = formatUnits(raw, 18)
      setFtgpBalance(parseFloat(formatted).toFixed(2))
    } catch (err) {
      console.error('Error fetching FTGP balance:', err)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white px-6 py-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Top user info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1e2026] p-6 rounded-xl shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xl font-bold">🧑</div>
            <div>
              <h2 className="text-xl font-bold">
                {userId ? `User-${userId.toString().slice(4)}` : 'Loading...'}
              </h2>
              <p className="text-gray-400 text-sm">
                UID: {userId ?? 'Loading...'}
              </p>
              <p className="text-gray-400 text-sm">
                Wallet: {wallet.slice(0, 8)}...{wallet.slice(-4)}
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 text-sm text-gray-400">
            VIP Level: <span className="text-yellow-400 font-semibold">Regular User</span>
          </div>
        </div>

        {/* Balance section */}
        <div className="bg-[#1e2026] p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-2">Estimated Balance</h3>
          <p className="text-3xl font-bold text-yellow-400">{ftgpBalance} FTGP</p>
          <p className="text-gray-400">≈ ${ftgpBalance}</p>
        </div>

        {/* Function modules */}
        <h3 className="text-2xl font-bold">Get Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trade */}
          <Link href="/transaction" className="group bg-[#1e2026] rounded-xl p-6 border border-transparent hover:border-yellow-400 transition duration-300 flex flex-col justify-between">
            <div>
              <h4 className="text-xl font-semibold mb-2">💱 Trade</h4>
              <p className="text-gray-400 text-sm mb-6">Convert fiat to FTGP tokens or redeem tokens back to cash.</p>
            </div>
            <button className="self-end bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 font-semibold text-sm">Enter</button>
          </Link>

          {/* Deposit */}
          <Link href="/deposit" className="group bg-[#1e2026] rounded-xl p-6 border border-transparent hover:border-yellow-400 transition duration-300 flex flex-col justify-between">
            <div>
              <h4 className="text-xl font-semibold mb-2">💰 Deposit</h4>
              <p className="text-gray-400 text-sm mb-6">Earn interest by depositing your tokens with flexible terms.</p>
            </div>
            <button className="self-end bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 font-semibold text-sm">Enter</button>
          </Link>

          {/* Loan */}
          <Link href="/loan" className="group bg-[#1e2026] rounded-xl p-6 border border-transparent hover:border-yellow-400 transition duration-300 flex flex-col justify-between">
            <div>
              <h4 className="text-xl font-semibold mb-2">🏦 Loan</h4>
              <p className="text-gray-400 text-sm mb-6">Borrow fiat by collateralizing your FTGP or crypto assets.</p>
            </div>
            <button className="self-end bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 font-semibold text-sm">Enter</button>
          </Link>
        </div>
      </div>
    </main>
  )
}









