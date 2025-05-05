'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { FTGP_ADDRESS } from '../../lib/contract'
import ftgpAbi from '../../lib/abi.json'

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function AllInOneDepositPage() {
  const [wallet, setWallet] = useState('')
  const [amount, setAmount] = useState('1')
  const [lockDays, setLockDays] = useState('30')
  const [depositType, setDepositType] = useState<'open' | 'lockup'>('open')
  const [withdrawIndex, setWithdrawIndex] = useState('')
  const [message, setMessage] = useState('')
  const [interest, setInterest] = useState('')
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const w = localStorage.getItem('wallet')
    if (w) setWallet(w)
  }, [])

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(FTGP_ADDRESS, ftgpAbi, signer)
  }

  const handleDeposit = async () => {
    const parsedAmount = Number(amount.trim())
    const lockPeriodSeconds = Number(lockDays) * 86400

    if (!parsedAmount || parsedAmount <= 0) return alert('Please enter a valid amount')
    if (depositType === 'lockup' && !['30', '90', '180', '365'].includes(lockDays)) {
      return alert('Please select a valid lock-up period')
    }

    setMessage('')
    setLoading(true)

    try {
      const ftgp = await getContract()
      const weiAmount = ethers.parseUnits(parsedAmount.toString(), 18)
      const tx = depositType === 'lockup'
        ? await ftgp.lockupDeposit(weiAmount, lockPeriodSeconds)
        : await ftgp.openDeposit(weiAmount)

      await tx.wait()
      setMessage(' Deposit successful!')
      fetchDeposits()
    } catch (err: any) {
      setMessage(` Deposit failed: ${err?.reason || err?.message || 'Unknown error'}`)
    }

    setLoading(false)
  }

  const fetchDeposits = async () => {
    try {
      const ftgp = await getContract()
      const result: any[] = []
      for (let i = 0; i < 100; i++) {
        try {
          const dep = await ftgp.getUserDeposit(wallet, i)
          result.push({
            id: i,
            amount: ethers.formatUnits(dep[0], 18),
            start: new Date(Number(dep[1]) * 1000).toLocaleString(),
            end: dep[2] > 0 ? new Date((Number(dep[1]) + Number(dep[2])) * 1000).toLocaleString() : '-',
            lock: Number(dep[2]),
            withdrawn: dep[3],
          })
        } catch {
          break
        }
      }
      setDeposits(result)
    } catch (err: any) {
      setMessage(` Fetch failed: ${err.message}`)
    }
  }

  const handleWithdraw = async (indexOverride?: number) => {
    const idx = typeof indexOverride === 'number' ? indexOverride : parseInt(withdrawIndex.trim())
    if (isNaN(idx) || idx < 0) {
      setMessage(' Please enter a valid deposit ID')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const ftgp = await getContract()
      const deposit = await ftgp.getUserDeposit(wallet, idx)
      if (deposit.withdrawn) {
        setMessage(' This deposit has already been withdrawn')
        setLoading(false)
        return
      }

      const tx = await ftgp.withdraw(idx)
      await tx.wait()
      setMessage(' Withdrawal successful')
      fetchDeposits()
    } catch (err: any) {
      setMessage(` Withdrawal failed: ${err?.reason || err?.message || 'Unknown error'}`)
    }

    setLoading(false)
  }

  const handleInterest = async () => {
    try {
      const ftgp = await getContract()
      const i = await ftgp.calculateInterest(wallet)
      setInterest(ethers.formatUnits(i, 18))
    } catch (err: any) {
      setMessage(` Interest fetch failed: ${err.message}`)
    }
  }

  const getRate = (seconds: number) => {
    switch (seconds) {
      case 30 * 86400: return '3%'
      case 90 * 86400: return '5%'
      case 180 * 86400: return '8%'
      case 365 * 86400: return '12%'
      default: return 'N/A'
    }
  }

  return (
  <main
    className="min-h-screen text-white px-4 md:px-6 py-12 bg-[url('/money.png')] bg-cover bg-center bg-no-repeat bg-blend-overlay"
    style={{ backgroundColor: 'rgba(11, 14, 17, 0.8)' }}
  >
    <h1 className="text-4xl font-bold mb-8 text-center tracking-wide text-yellow-400">💰 FTGP Deposit Center</h1>

    <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
      <section className="bg-[#1c1e23]/70 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-md space-y-4">
        <h2 className="text-lg font-semibold"> Initiate Deposit</h2>
        <input className="w-full p-3 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-yellow-300" type="number" placeholder="Enter deposit amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="w-full p-3 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-yellow-300" value={depositType} onChange={(e) => setDepositType(e.target.value as 'open' | 'lockup')}>
          <option value="open">Open Deposit</option>
          <option value="lockup">Locked Deposit</option>
        </select>
        {depositType === 'lockup' && (
          <select className="w-full p-3 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-yellow-300" value={lockDays} onChange={(e) => setLockDays(e.target.value)}>
            <option value="30">30 days - 3%</option>
            <option value="90">90 days - 5%</option>
            <option value="180">180 days - 8%</option>
            <option value="365">365 days - 12%</option>
          </select>
        )}
        <button
          onClick={handleDeposit}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded-lg font-semibold py-3 px-4 shadow-lg transition transform hover:scale-105 active:scale-95"
        >
          Confirm Deposit
        </button>
      </section>

      <section className="space-y-6">
        <div className="bg-[#1c1e23]/70 backdrop-blur-md border border-white/10 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Account Total Gain</h2>
          <h2 className="text-sm font">Total FTGP gained through interest on all deposits.</h2>
          <button
            onClick={handleInterest}
            className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition transform hover:scale-105 active:scale-95"
          >
            View Interest
          </button>
          {interest && <p className="mt-4 text-yellow-300">Interest: {interest} FTGP</p>}
        </div>

        <div className="bg-[#1c1e23]/70 backdrop-blur-md border border-white/10 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Manual Withdrawal</h2>
          <input
            className="w-full p-3 rounded-lg bg-white text-black mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            type="number"
            placeholder="Enter deposit ID"
            value={withdrawIndex}
            onChange={(e) => setWithdrawIndex(e.target.value)}
          />
          <button
            onClick={() => handleWithdraw()}
            className="bg-red-500 hover:bg-red-600 text-white w-full rounded-lg font-semibold py-3 px-4 shadow-lg transition transform hover:scale-105 active:scale-95"
          >
            Withdraw
          </button>
        </div>
      </section>
    </div>

    <div className="mt-10 bg-[#1c1e23]/70 backdrop-blur-md border border-white/10 p-6 rounded-lg shadow max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Deposit Records</h2>
      <button
        onClick={fetchDeposits}
        className="mb-4 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg shadow transition transform hover:scale-105 active:scale-95"
      >
        🔄 Refresh
      </button>
      {deposits.length === 0 ? (
        <p className="text-gray-300">No records found</p>
      ) : (
        deposits.map((d) => (
          <div key={d.id} className="border-t pt-4 mt-4 text-sm border-gray-700">
            <p>📁 ID: {d.id}</p>
            <p>💰 Amount: {d.amount} FTGP</p>
            <p>📅 Start Time: {d.start}</p>
            <p>⏳ Period: {d.lock === 0 ? 'Open' : `${d.lock / 86400} days`}</p>
            <p>📈 Rate: {getRate(d.lock)}</p>
            <p>📆 Maturity: {d.end}</p>
            <p>🔓 Status: {d.withdrawn ? ' Withdrawn' : ' Not Withdrawn'}</p>
            {!d.withdrawn && (
              <button
                onClick={() => handleWithdraw(d.id)}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow transition transform hover:scale-105 active:scale-95 text-xs"
              >
                Withdraw Now
              </button>
            )}
          </div>
        ))
      )}
    </div>

    {message && <p className="text-yellow-400 text-center mt-6 font-mono">{message}</p>}

    <div className="mt-12 flex justify-center">
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-full font-semibold transition duration-200"
      >
        ← Back to Dashboard
      </button>
    </div>
  </main>
  
  )
}
