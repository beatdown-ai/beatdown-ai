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
      </Head>
      <div className="min-h-screen bg-black text-green-400 p-4 font-mono">
        <h1 className="text-xl mb-4">💪 Beatdown.ai</h1>
        <p className="mb-2">Credits remaining: {credits}</p>
        <div className="border border-green-600 p-2 mb-4 h-64 overflow-y-scroll">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <strong>{msg.role === 'user' ? 'You' : 'Beatdown.ai'}:</strong> {msg.content}
            </div>
          ))}
          {loading && <div>Loading...</div>}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-2 py-1 border border-green-600 bg-black text-green-400"
            placeholder="Type your workout question..."
          />
          <button onClick={sendMessage} className="bg-green-600 text-black px-4 py-1">Send</button>
        </div>
        <button
          onClick={() => window.location.href = '/api/stripe-checkout'}
          className="mt-4 underline"
        >
          💸 Buy More Credits
        </button>
      </div>
    </>
  )
}