'use client'

import { useEffect, useState } from 'react'
import { ethers, BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers'
import { useRouter } from 'next/navigation'
import { FTGP_ADDRESS } from '../../lib/contract'
import ftgpAbi from '../../lib/abi.json'

export default function RedeemTokens() {
  const [wallet, setWallet] = useState('')
  const [redeemAmount, setRedeemAmount] = useState('')
  const [toCurrency, setToCurrency] = useState('USD')
  const [balance, setBalance] = useState('0')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const connect = async () => {
      if (!window.ethereum) {
        setStatus('MetaMask not detected. Please install MetaMask.')
        return
      }

      try {
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.send('eth_requestAccounts', [])
        const userAddress = accounts[0]
        setWallet(userAddress)

        const contract = new Contract(FTGP_ADDRESS, ftgpAbi, provider)
        const balanceWei = await contract.balanceOf(userAddress)
        const balanceFormatted = formatUnits(balanceWei, 18)
        setBalance(balanceFormatted)
      } catch (err: any) {
        setStatus('Failed to connect wallet or fetch balance.')
        console.error('Wallet connection error:', err)
      }
    }
    connect()
  }, [])

  const handleRedeem = async () => {
    if (!redeemAmount || isNaN(Number(redeemAmount)) || Number(redeemAmount) <= 0) {
      setStatus('Please enter a valid amount.')
      return
    }

    try {
      setLoading(true)
      setStatus('Validating balance...')

      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()
      const contract = new Contract(FTGP_ADDRESS, ftgpAbi, provider)

      const balanceWei = await contract.balanceOf(userAddress)
      const balanceFormatted = formatUnits(balanceWei, 18)
      setBalance(balanceFormatted)

      if (Number(balanceFormatted) < Number(redeemAmount)) {
        setStatus(`Insufficient balance: ${balanceFormatted} FTGP available.`)
        return
      }

      const redeemAmountInWei = parseUnits(redeemAmount, 18)
      const allowance = await contract.allowance(userAddress, FTGP_ADDRESS)

      if (allowance < redeemAmountInWei) {
        setStatus('Approving token usage...')
        const contractWithSigner = new Contract(FTGP_ADDRESS, ftgpAbi, signer)
        const approveTx = await contractWithSigner.approve(FTGP_ADDRESS, redeemAmountInWei)
        await approveTx.wait()
      }

      setStatus('Initiating redemption...')
      const contractWithSigner = new Contract(FTGP_ADDRESS, ftgpAbi, signer)
      const redeemTx = await contractWithSigner.redeemTokens(toCurrency, redeemAmount)
      await redeemTx.wait()

      setStatus('Redemption successful! Funds will be processed off-chain.')
      router.push('/success')
    } catch (err: any) {
      if (err?.code === 4001) {
        setStatus('User rejected action')
      } else {
        setStatus('Redemption failed. Please try again.')
        console.error('Redemption error:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white px-4 md:px-6 py-12 bg-[url('/money.png')] bg-cover bg-center bg-no-repeat bg-blend-overlay" style={{ backgroundColor: 'rgba(11, 14, 17, 0.85)' }}>
      <div className="flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-10">🔁 FTGP Redemption</h1>
        <div className="w-full max-w-md bg-[#101214]/80 p-8 rounded-2xl border border-[#2c2f36] space-y-6">
          <h2 className="text-lg font-semibold text-yellow-300">Redeem FTGP Tokens</h2>
          <p className="text-sm text-gray-300">Wallet: {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connecting...'}</p>
          <p className="text-sm text-gray-300">Balance: {balance} FTGP</p>
          <input
            type="number"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder="Amount (FTGP)"
            className="w-full bg-[#1e1f24] p-3 rounded text-white"
            disabled={loading}
          />
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full bg-[#1e1f24] p-3 rounded text-white"
            disabled={loading}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          <button
            onClick={handleRedeem}
            disabled={loading}
            className="w-full bg-red-600 p-3 rounded hover:bg-red-500 disabled:bg-gray-600 text-white font-semibold"
          >
            {loading ? 'Processing...' : 'Redeem'}
          </button>
          {status && <p className="text-sm text-yellow-400">{status}</p>}
        </div>

        {/* ✅ Back to Dashboard Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-full font-semibold transition duration-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

