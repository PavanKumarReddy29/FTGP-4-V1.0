'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { useRouter } from 'next/navigation'
import { FTGP_ADDRESS } from '../../lib/contract'
import ftgpAbi from '../../lib/abi.json'

export default function LoanPage() {
  const [ethAmount, setEthAmount] = useState('')
  const [estimatedFTGP, setEstimatedFTGP] = useState('')
  const [loanDetails, setLoanDetails] = useState(null)
  const [repayCurrency, setRepayCurrency] = useState('')
  const [repayFiatAmount, setRepayFiatAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const estimateLoanAmount = (ethString) => {
    try {
      const eth = parseFloat(ethString)
      if (isNaN(eth) || eth <= 0) {
        setEstimatedFTGP('')
        return
      }
      const ethToUsd = 1000
      const ltv = 0.4
      const usdValue = eth * ethToUsd
      const ftgp = usdValue * ltv
      setEstimatedFTGP(ftgp.toFixed(2))
    } catch {
      setEstimatedFTGP('')
    }
  }

  const borrow = async () => {
    try {
      setLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(FTGP_ADDRESS, ftgpAbi, signer)

      const value = ethers.parseEther(ethAmount)
      const tx = await contract.getLoan({ value })
      await tx.wait()
      alert('Loan successful!')
    } catch (err) {
      console.error(err)
      alert('Loan request failed')
    } finally {
      setLoading(false)
    }
  }

  const fetchLoanDetails = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const contract = new ethers.Contract(FTGP_ADDRESS, ftgpAbi, signer)
      const data = await contract.userLoans(address)

      setLoanDetails({
        collateralETH: ethers.formatEther(data[0]),
        loanFTGP: ethers.formatUnits(data[1], 18),
        timestamp: new Date(Number(data[2]) * 1000).toLocaleString(),
        repaymentDue: ethers.formatUnits(data[3], 18),
        monthlyInstallment: ethers.formatUnits(data[4], 18),
        repaid: ethers.formatUnits(data[5], 18),
        borrower: data[6]
      })
    } catch (err) {
      console.error(err)
      alert('Failed to fetch loan details')
    }
  }

  const repayWithFiat = async () => {
    try {
      if (!repayCurrency || !repayFiatAmount) {
        alert('Please enter both currency and amount')
        return
      }
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(FTGP_ADDRESS, ftgpAbi, signer)

      const tx = await contract.convertAndRepay(repayCurrency, ethers.parseUnits(repayFiatAmount, 0))
      await tx.wait()
      alert('Repayment successful!')
    } catch (err) {
      if (!loanDetails){
        alert('No Active loan Found')
      }else{
        console.error(err)
        alert('Repayment failed')
      }
    }
  }

  return (
    <div className="min-h-screen text-white px-4 md:px-6 py-12 bg-[url('/money.png')] bg-cover bg-center bg-no-repeat bg-blend-overlay"
         style={{ backgroundColor: 'rgba(11, 14, 17, 0.8)' }}>
      <div className="flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-10">💳 FTGP Loan Center</h1>

        <div className="w-full max-w-md bg-[#101214]/80 p-8 rounded-2xl border border-[#2c2f36] space-y-6">
          <div className="border border-yellow-500 p-4 rounded-lg bg-[#181b1f]">
            <h2 className="text-lg font-semibold text-yellow-300 mb-3">Collateral (ETH)</h2>
            <input
              value={ethAmount}
              onChange={(e) => {
                setEthAmount(e.target.value)
                estimateLoanAmount(e.target.value)
              }}
              type="number"
              className="w-full p-3 rounded bg-white text-black"
            />
            {estimatedFTGP && (
              <p className="mt-2 text-green-400">≈ You will receive <strong>{estimatedFTGP}</strong> FTGP tokens</p>
            )}
          </div>

          <button
            onClick={borrow}
            disabled={loading}
            className={`w-full py-3 rounded font-semibold transition ${loading ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {loading ? 'Processing...' : 'Borrow with ETH'}
          </button>

          <hr className="border-gray-700" />

          <button
            onClick={fetchLoanDetails}
            className="w-full bg-gray-700 hover:bg-gray-800 py-3 rounded font-semibold transition"
          >
            View My Loan Info
          </button>

          {loanDetails && (
            <div className="text-sm text-left space-y-1 text-white bg-[#1e1f24] rounded p-4 mt-2 border border-gray-700">
              <p>🔑 Borrower: <strong>{loanDetails.borrower}</strong></p>
              <p>💎 Collateral: <strong>{loanDetails.collateralETH}</strong> ETH</p>
              <p>📤 Loan Amount: <strong>{loanDetails.loanFTGP}</strong> FTGP</p>
              <p>💰 Repaid: <strong>{loanDetails.repaid}</strong> FTGP</p>
              <p>💸 Repayment Due: <strong>{loanDetails.repaymentDue}</strong> FTGP</p>
              <p>📆 Monthly Installment: <strong>{loanDetails.monthlyInstallment}</strong> FTGP</p>
              <p>⏰ Issued At: <strong>{loanDetails.timestamp}</strong></p>
            </div>
          )}

          <hr className="border-gray-700" />

          <h3 className="text-lg text-yellow-300 font-semibold">💱 Repay with Fiat</h3>
          <select
            value={repayCurrency}
            onChange={(e) => setRepayCurrency(e.target.value)}
            className={`w-full p-3 rounded mt-1 appearance-none ${
              repayCurrency ? 'bg-white text-black' : 'bg-gray-200 text-gray-500'
            }`}
          >
            <option value="">Select Currency</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>

          <input
            value={repayFiatAmount}
            onChange={(e) => setRepayFiatAmount(e.target.value)}
            type="number"
            placeholder="Amount in fiat"
            className="w-full p-3 rounded bg-white text-black mt-2"
          />
          <button
            onClick={repayWithFiat}
            className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-semibold transition mt-2"
          >
             Repay with Fiat
          </button>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-10 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-full transition"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
