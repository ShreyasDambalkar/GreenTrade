import { Metadata } from 'next';
import TradingInterface from '@/components/TradingInterface';

export const metadata: Metadata = {
  title: 'Trading | GreenTrade',
  description: 'Trade verified carbon credits with real time market data and MetaMask integration',
};

export default function TradingPage() {
  return <TradingInterface />;
}
