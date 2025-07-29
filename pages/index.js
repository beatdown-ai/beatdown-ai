import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [credits, setCredits] = useState(0)
  const threadIdRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('beatdown_credits')
    if (!stored) {
      localStorage.setItem('beatdown_credits', '10')
      setCredits(10)
    } else {
      setCredits(parseInt(stored))
    }
  }, [])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const token = query.get('token')
    if (token === 'xyz') {
      updateCredits(50)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const updateCredits = (delta) => {
    const newCredits = credits + delta
    setCredits(newCredits)
    localStorage.setItem('beatdown_credits', newCredits.toString())
  }

  const sendMessage = async () => {
    if (!input || loading || credits <= 0) return
    setLoading(true)
    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    updateCredits(-1)

    const res = await fetch('/api/beatdown-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, threadId: threadIdRef.current })
    })

    const data = await res.json()
    if (data.threadId) threadIdRef.current = data.threadId
    if (data.response) setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Beatdown.ai – Your F3 Workout Assistant</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">💪 Beatdown.ai</h1>
          <p className="text-sm text-gray-400 mb-4">Your AI assistant for F3 workouts. Credits remaining: <span className="font-bold">{credits}</span></p>

          <div className="bg-neutral-800 rounded-lg p-4 h-96 overflow-y-auto shadow-inner mb-4 border border-neutral-700">
            {messages.map((msg, idx) => (
              <div key={idx} className="mb-3">
                <span className="block font-semibold text-blue-300">{msg.role === 'user' ? 'You' : 'Beatdown.ai'}:</span>
                <p className="ml-2 text-base text-white whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {loading && <div className="text-sm text-yellow-400">Thinking...</div>}
          </div>

          <div className="flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded border border-neutral-600 bg-neutral-800 text-white placeholder-gray-400"
              placeholder="Ask me anything workout-related..."
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
            >
              Send
            </button>
          </div>

          <button
            onClick={() => window.location.href = '/api/stripe-checkout'}
            className="mt-4 text-green-400 underline hover:text-green-300"
          >
            💸 Buy More Credits
          </button>
        </div>
      </div>
    </>
  )
}