import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet, base } from 'viem/chains';

const projectId = process.env.PROJECTID;

const metadata = {
  name: 'Web3Modal',
  description: 'Web3Modal Friendtech',
  url: 'http://localhost:3000/connectwallet',
  icons: ['https://butwhytho.net/wp-content/uploads/2023/09/Jujutsu-Kaisen-Season-2-Episode-8-But-Why-Tho.jpg'],
};

const chains = [mainnet, base];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

const modal = createWeb3Modal({ wagmiConfig, projectId, chains });
console.log('thisismodal: ', modal);
