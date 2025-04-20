import { ethers } from 'ethers';
import abi from './abi.json'; // 这里是你放 ABI 的 json 文件路径

export const FTGP_ADDRESS = "0x55fd7460d5e63ec50f820c799708cd7734817a54"; // 替换为你的实际地址

export function getContract(providerOrSigner) {
  return new ethers.Contract(CONTRACT_ADDRESS, abi, providerOrSigner);
}
