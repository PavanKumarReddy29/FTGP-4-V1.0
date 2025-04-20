'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { getContract } from '../../lib/contract'

// Declare window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}

export default function TransactionPage() {
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState('CNY')
  const [previewAmount, setPreviewAmount] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState('')

  useEffect(() => {
    const getWallet = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.send('eth_requestAccounts', [])
        setWallet(accounts[0])
      }
    }
    getWallet()
  }, [])

  const handlePreview = async () => {
    if (!window.ethereum) return alert('Please install MetaMask first.')
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return alert('Please enter a valid amount.')
    }

    try {
      setLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = getContract(signer)

      const result = await contract.previewConversion(
        fromCurrency,
        'USD',
        ethers.parseUnits(amount, 2)
      )

      setPreviewAmount(ethers.formatUnits(result, 2))
    } catch (error) {
      console.error('Preview failed:', error)
      alert('❌ Preview failed. Please check your input or blockchain connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return alert('Please enter a valid amount.')
    }

    try {
      setLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = getContract(signer)

      const tx = await contract.convertAndMint(
        fromCurrency,
        'USD',
        ethers.parseUnits(amount, 2)
      )

      await tx.wait()
      alert('✅ Conversion successful! FTGP tokens have been sent to your wallet.')
      setAmount('')
      setPreviewAmount(null)
    } catch (err) {
      console.error(err)
      alert('❌ Conversion failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-5 bg-white shadow-md rounded-md mt-10">
      <h1 className="text-2xl font-bold text-center">💰 Convert Currency to FTGP Token</h1>

      <div className="text-sm text-gray-600 text-center">
        Connected Wallet: <span className="text-blue-500">{wallet || 'Not Connected'}</span>
      </div>

      <input
        type="text"
        placeholder="Enter amount (e.g., 100)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border px-4 py-2 rounded"
      />

      <select
        value={fromCurrency}
        onChange={(e) => setFromCurrency(e.target.value)}
        className="w-full border px-4 py-2 rounded"
      >
        <option value="CNY">CNY</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
      </select>

      <button
        onClick={handlePreview}
        className="bg-gray-600 text-white px-6 py-2 rounded w-full hover:bg-gray-700"
        disabled={loading}
      >
        {loading ? 'Previewing...' : '🔍 Preview Conversion Amount'}
      </button>

      {previewAmount && (
        <p className="text-green-600 text-center text-lg">
          Estimated ≈ <strong>{previewAmount}</strong> FTGP
        </p>
      )}

      <button
        onClick={handleConvert}
        className="bg-green-600 text-white px-6 py-2 rounded w-full hover:bg-green-700"
        disabled={loading}
      >
        {loading ? 'Converting...' : '✅ Confirm and Mint'}
      </button>
    </main>
  )
}

