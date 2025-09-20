import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Waternity - Hedera Water Well Management',
    template: '%s | Waternity'
  },
  description: 'Decentralized water well management platform powered by Hedera Hashgraph',
  keywords: ['water', 'well', 'management', 'hedera', 'blockchain', 'sustainability'],
  authors: [{ name: 'Waternity Team' }],
  creator: 'Waternity',
  publisher: 'Waternity',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    title: 'Waternity - Hedera Water Well Management',
    description: 'Decentralized water well management platform powered by Hedera Hashgraph',
    siteName: 'Waternity',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Waternity - Hedera Water Well Management',
    description: 'Decentralized water well management platform powered by Hedera Hashgraph',
    creator: '@waternity',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0070f3" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Navigation Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-blue-600">Waternity</h1>
                  </div>
                  <nav className="hidden md:ml-8 md:flex md:space-x-8">
                    <a href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Dashboard
                    </a>
                    <a href="/investor" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Investor
                    </a>
                    <a href="/operator" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Operator
                    </a>
                    <a href="/agent" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Agent
                    </a>
                    <a href="/admin" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Admin
                    </a>
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    Network: <span className="font-medium text-green-600">Hedera Testnet</span>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Connect Wallet
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Waternity</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Decentralized water well management platform powered by Hedera Hashgraph. 
                    Ensuring transparency, efficiency, and sustainability in water resource management.
                  </p>
                  <div className="flex space-x-4">
                    <a href="https://hedera.com" target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:text-blue-800 text-sm">
                      Powered by Hedera
                    </a>
                    <a href="https://docs.hedera.com" target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:text-blue-800 text-sm">
                      Documentation
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Platform</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><a href="/" className="hover:text-blue-600">Dashboard</a></li>
                    <li><a href="/investor" className="hover:text-blue-600">Investor Portal</a></li>
                    <li><a href="/operator" className="hover:text-blue-600">Operator Panel</a></li>
                    <li><a href="/agent" className="hover:text-blue-600">Agent Interface</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><a href="/api/health" className="hover:text-blue-600">API Status</a></li>
                    <li><a href="https://hashscan.io/testnet" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">Hashscan Explorer</a></li>
                    <li><a href="https://testnet.mirrornode.hedera.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">Mirror Node</a></li>
                    <li><a href="https://portal.hedera.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">Hedera Portal</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm text-gray-500">
                  © {new Date().getFullYear()} Waternity. Built for Hedera Hackathon Africa.
                </p>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                  <span className="text-sm text-gray-500">Environment:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {process.env.NODE_ENV || 'development'}
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}