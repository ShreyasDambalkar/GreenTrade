"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Wallet, LogOut, User } from "lucide-react";
import MegaMenu from "./MegaMenu";
import AIToolsDropdown, { useAIToolsDropdown } from "./AIToolsDropdown";
import { useWallet } from "@/lib/walletContext";

export default function NavBar() {
	const { address, isConnected, connectAsGuest, connectMetaMask, disconnect, isConnecting } = useWallet();
	const [open, setOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [connectMenuOpen, setConnectMenuOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const aiToolsDropdown = useAIToolsDropdown();


	useEffect(() => {
		const handleOpenMenu = () => setOpen(true);
		window.addEventListener('open-mega-menu', handleOpenMenu);
		return () => window.removeEventListener('open-mega-menu', handleOpenMenu);
	}, []);

	return (
		<header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
			<div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
				<Link href="/" className="group inline-flex items-center gap-2">
					<span className="relative inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500/80 to-cyan-500/80">
						<span className="absolute inset-0 rounded-md blur-sm bg-emerald-400/50" />
						<span className="relative h-2 w-2 rounded-sm bg-white/95" />
					</span>
					<span className="font-semibold tracking-tight text-zinc-100">GreenTrade</span>
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden lg:flex items-center text-sm text-zinc-300 space-x-2 nav-links">
					<button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded-full hover:bg-emerald-900/20 transition-colors">Menu</button>

					{/* AI Tools Dropdown */}
					<div className="relative">
						<button
							ref={aiToolsDropdown.triggerRef}
							onClick={aiToolsDropdown.toggle}
							className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-emerald-900/20 transition-colors"
						>
							AI Tools
							<ChevronDown className={`w-3 h-3 transition-transform ${aiToolsDropdown.isOpen ? 'rotate-180' : ''}`} />
						</button>
						<AIToolsDropdown
							isOpen={aiToolsDropdown.isOpen}
							onClose={aiToolsDropdown.close}
							triggerRef={aiToolsDropdown.triggerRef}
						/>
					</div>

					<Link href="#how-it-works" className="px-3 py-1.5 rounded-full hover:bg-emerald-900/20 transition-colors">How it works</Link>
					<Link href="#why" className="px-3 py-1.5 rounded-full hover:bg-emerald-900/20 transition-colors">Why GreenTrade</Link>
				</nav>

				<div className="flex items-center gap-3">
					{/* Mobile hamburger menu */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="lg:hidden p-2 rounded-lg hover:bg-emerald-900/20 transition-colors"
						aria-label="Toggle menu"
					>
						<svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							{mobileMenuOpen ? (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							) : (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							)}
						</svg>
					</button>

					{/* Connect Button - Always visible */}
					{/* Custom Wallet Connection */}
					{isConnected && address ? (
						<div className="relative">
							<button
								onClick={() => setUserMenuOpen(!userMenuOpen)}
								className="flex items-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full text-zinc-200 transition-all text-sm font-mono"
							>
								<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
								{address.slice(0, 6)}...{address.slice(-4)}
								<ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
							</button>

							{/* Dropdown */}
							{userMenuOpen && (
								<div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden p-1 z-50">
									<button
										onClick={() => { disconnect(); setUserMenuOpen(false); }}
										className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-zinc-800 rounded-lg flex items-center gap-2 transition-colors"
									>
										<LogOut className="w-4 h-4" /> Disconnect
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="relative">
							<button
								onClick={() => setConnectMenuOpen(!connectMenuOpen)}
								className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium px-4 py-1.5 rounded-full transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/20"
							>
								{isConnecting ? 'Connecting...' : 'Connect Wallet'}
								<ChevronDown className={`w-3 h-3 transition-transform ${connectMenuOpen ? 'rotate-180' : ''}`} />
							</button>

							{connectMenuOpen && (
								<div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden p-1 z-50">
									<div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">Select Wallet</div>
									<button
										onClick={() => { connectMetaMask(); setConnectMenuOpen(false); }}
										className="w-full text-left px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 rounded-lg flex items-center gap-2 transition-colors"
									>
										<Wallet className="w-4 h-4 text-orange-500" />
										MetaMask
									</button>
									<button
										onClick={() => { connectAsGuest(); setConnectMenuOpen(false); }}
										className="w-full text-left px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 rounded-lg flex items-center gap-2 transition-colors"
									>
										<User className="w-4 h-4 text-blue-500" />
										Guest Login (Demo)
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className="lg:hidden border-t border-zinc-800 bg-zinc-950 max-h-[70vh] overflow-y-auto ai-tools-scroll">
					<div className="px-4 py-4 space-y-2">
						<button
							onClick={() => { setOpen(true); setMobileMenuOpen(false); }}
							className="block w-full text-left px-3 py-2 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
						>
							Menu
						</button>

						{/* AI Tools Section */}
						<div className="py-2">
							<div className="text-xs font-medium text-emerald-500 uppercase tracking-wide px-3 py-1 mb-1">AI Tools</div>
							<Link
								href="/ai-calculator"
								onClick={() => setMobileMenuOpen(false)}
								className="block px-3 py-2 ml-3 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
							>
								🧮 AI Carbon Calculator
							</Link>
							<Link
								href="/plastic-calculator"
								onClick={() => setMobileMenuOpen(false)}
								className="block px-3 py-2 ml-3 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
							>
								♻️ AI Plastic Calculator
							</Link>
							<Link
								href="/water-calculator"
								onClick={() => setMobileMenuOpen(false)}
								className="block px-3 py-2 ml-3 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
							>
								💧 Water Footprint Calculator
							</Link>
							<Link
								href="/event-planner"
								onClick={() => setMobileMenuOpen(false)}
								className="block px-3 py-2 ml-3 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
							>
								📅 Event Planner
							</Link>
							<Link
								href="/plastic-tracker"
								onClick={() => setMobileMenuOpen(false)}
								className="block px-3 py-2 ml-3 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
							>
								🗑️ Plastic Tracker
							</Link>
							<Link
								href="/audit"
								onClick={() => setMobileMenuOpen(false)}
								className="block px-3 py-2 ml-3 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
							>
								🔍 Audit System
							</Link>
						</div>

						<Link
							href="#how-it-works"
							onClick={() => setMobileMenuOpen(false)}
							className="block px-3 py-2 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
						>
							How it works
						</Link>
						<Link
							href="#why"
							onClick={() => setMobileMenuOpen(false)}
							className="block px-3 py-2 rounded-lg text-zinc-300 hover:bg-emerald-900/20 transition-colors"
						>
							Why GreenTrade
						</Link>
						<Link
							href="/dashboard"
							onClick={() => setMobileMenuOpen(false)}
							className="block px-3 py-2 rounded-lg text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 transition text-center"
						>
							Dashboard
						</Link>
					</div>
				</div>
			)}

			<MegaMenu isOpen={open} onClose={() => setOpen(false)} />
		</header>
	);
}
