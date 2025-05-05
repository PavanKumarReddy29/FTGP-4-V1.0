// lib/contract.js

import { ethers } from 'ethers';
import abi from './abi.json';
import { FTGP_ADDRESS } from './contractAddress';

// re-export address and abi
export { FTGP_ADDRESS, abi };

export function getContract(providerOrSigner) {
  return new ethers.Contract(FTGP_ADDRESS, abi, providerOrSigner);
}
