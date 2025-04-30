import { redirect } from "next/navigation"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold">Focus Flow</h1>
        <p className="text-xl text-gray-400">Your AI-Powered Focus Assistant</p>
        <div className="space-y-4">
          <Link 
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Get Started
          </Link>
          <div className="pt-4">
            <Link 
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
