'use client'

import { useEffect, useState } from 'react'
import { BrowserProvider, Contract, parseUnits } from 'ethers'
import { FTGP_ADDRESS } from '../../lib/contract'
import ftgpAbi from '../../lib/abi.json'

function getContract(signerOrProvider: any) {
  return new Contract(FTGP_ADDRESS, ftgpAbi, signerOrProvider)
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function MintTransferPage() {
  const [tab, setTab] = useState<'mint' | 'transfer'>('mint')
  const [wallet, setWallet] = useState('')
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState('GBP')
  const [toCurrency, setToCurrency] = useState('USD')
  const [previewAmount, setPreviewAmount] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferError, setTransferError] = useState('')
  const [transferSuccess, setTransferSuccess] = useState(false)

  const [approveAddress, setApproveAddress] = useState('')
  const [approveAmount, setApproveAmount] = useState('1000000000000000000000000000000000000')
  const [approveStatus, setApproveStatus] = useState('')

  useEffect(() => {
    const connect = async () => {
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.send('eth_requestAccounts', [])
        setWallet(accounts[0])
      }
    }
    connect()
  }, [])

  const handlePreview = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return alert('Enter a valid amount.')
    if (fromCurrency === toCurrency) return alert('Cannot convert to the same currency!')
    try {
      setLoading(true)
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = getContract(signer)
      const result = await contract.previewConversion(fromCurrency, toCurrency, parseUnits(amount, 0))
      setPreviewAmount(result.toString())
    } catch (err) {
      console.error(err)
      alert('Preview failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return alert('Enter a valid amount.')
    try {
      setLoading(true)
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = getContract(signer)
      const tx = await contract.convertAndMint(fromCurrency, parseUnits(amount, 0))
      await tx.wait()
      alert('FTGP minted!')
      setAmount('')
      setPreviewAmount(null)
    } catch (err) {
      console.error(err)
      alert('Conversion failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async (e: any) => {
    e.preventDefault()
    if (!transferTo || !transferAmount) {
      setTransferError('Please enter recipient and amount.')
      setTransferSuccess(false)
      return
    }
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = getContract(signer)
      const amountInTokens = parseUnits(transferAmount, 0)
      const tx = await contract.transferTokens(transferTo, amountInTokens)
      await tx.wait()
      setTransferTo('')
      setTransferAmount('')
      setTransferError('')
      setTransferSuccess(true)
      setTimeout(() => setTransferSuccess(false), 3000)
    } catch (err: any) {
      const msg = err?.reason || err?.error?.message || err?.message || 'Transfer failed'
      if (msg.toLowerCase().includes('insufficient')) {
        setTransferError('Insufficient balance')
      } else {
        setTransferError('Transfer failed')
      }
      setTransferSuccess(false)
    }
  }
  

  const handleApprove = async () => {
    if (!approveAddress || !approveAmount) return alert('Please enter approve address and amount.')
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = getContract(signer)
      const tx = await contract.approve(approveAddress, approveAmount)
      await tx.wait()
      setApproveStatus('Approve successful!')
    } catch (err: any) {
      console.error(err)
      setApproveStatus('Approve failed: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen text-white px-4 md:px-6 py-12 bg-[url('/money.png')] bg-cover bg-center bg-no-repeat bg-blend-overlay" style={{ backgroundColor: 'rgba(11, 14, 17, 0.85)' }}>
      <div className="flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-10">💰 FTGP Transfer Center</h1>
        <div className="flex gap-4 mb-10">
          {['mint', 'transfer'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t as any)
                setTransferError('')
                setTransferSuccess(false)
              }}
              className={`px-6 py-2 rounded-full font-semibold border-2 transition-all duration-200 ${tab === t ? 'bg-blue-600 text-white border-blue-400 shadow-md scale-105' : 'bg-transparent text-blue-300 border-blue-700 hover:bg-blue-800'}`}
            >
              {t === 'mint' ? '🔄 Mint' : '💸 Transfer'}
            </button>
          ))}
        </div>

        <div className="w-full max-w-5xl flex flex-col items-center">
          {tab === 'mint' && (
            <div className="w-full md:w-[560px] bg-[#101214]/80 p-8 rounded-2xl border border-[#2c2f36] space-y-6">
              <h2 className="text-lg font-semibold text-yellow-300">Convert & Mint FTGP</h2>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (e.g. 100)" className="w-full bg-[#1e1f24] p-3 rounded" />
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full bg-[#1e1f24] p-3 rounded">
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ETH">ETH</option>
              </select>
              <button onClick={handlePreview} disabled={loading} className="w-full bg-gray-600 p-3 rounded">Preview</button>
              {previewAmount && <p className="text-green-400 text-sm">≈ {previewAmount} FTGP</p>}
              <button onClick={handleConvert} disabled={loading} className="w-full bg-green-600 p-3 rounded"> Confirm & Mint</button>
            </div>
          )}

          {tab === 'transfer' && (
            <div className="w-full md:w-[560px] bg-[#101214]/80 p-8 rounded-2xl border border-[#2c2f36] space-y-6">
              <h2 className="text-lg font-semibold text-yellow-300">Transfer FTGP Tokens</h2>
              <form onSubmit={handleTransfer} className="space-y-4">
                <input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="Recipient address (0x...)" className="w-full bg-[#1e1f24] p-3 rounded" />
                <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Amount (FTGP)" className="w-full bg-[#1e1f24] p-3 rounded" />
                <button type="submit" className="w-full bg-yellow-400 text-black p-3 rounded">Transfer</button>
                {transferError && <p className="text-red-500 text-sm">{transferError}</p>}
                {transferSuccess && <p className="text-green-400 text-sm">Transfer successful!</p>}
              </form>
            </div>
          )}
        </div>

        
        <div className="w-full max-w-md mt-12 bg-[#101214]/80 p-6 rounded-2xl border border-[#2c2f36] text-center">
  <h2 className="text-lg font-semibold text-yellow-300 mb-3">Approve FTGP Usage</h2>

  {/* Message above button */}
  {approveStatus === 'approved' ? (
    <p className="text-green-400 mb-4">✅ Address approved to spend FTGP</p>
  ) : (
    <p className="text-red-400 mb-4">⚠️ Approval required for this address</p>
  )}

  <button
    onClick={async () => {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const contract = new Contract(FTGP_ADDRESS, ftgpAbi, signer)
        const unlimited = '1000000000000000000000000000000000000'
        const tx = await contract.approve(FTGP_ADDRESS, unlimited)
        await tx.wait()
        setApproveStatus('approved') 
      } catch (err: any) {
        console.error(err)
        alert('Approve failed: ' + (err.reason || err.message))
      }
    }}
    className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-semibold transition"
  >
    Approve
  </button>

</div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-full font-semibold transition duration-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
