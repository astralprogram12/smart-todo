'use client'

import { useState, useEffect } from "react"

interface Message {
  sender: "user" | "nenrin"
  content: string
  timestamp: string
}

const demoMessages: Message[] = [
  {
    sender: "user",
    content: "add task: finish quarterly report",
    timestamp: "2:34 PM"
  },
  {
    sender: "nenrin",
    content: "Got it! I've added 'Finish quarterly report' to your tasks. Would you like me to set a reminder?",
    timestamp: "2:34 PM"
  },
  {
    sender: "user",
    content: "yes, remind me tomorrow at 9am",
    timestamp: "2:35 PM"
  },
  {
    sender: "nenrin",
    content: "Perfect! ✓ Reminder set for tomorrow at 9:00 AM. I'll make sure you stay on track.",
    timestamp: "2:35 PM"
  }
]

export function ChatDemo() {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < demoMessages.length) {
      const timer = setTimeout(() => {
        setCurrentMessages(prev => [...prev, demoMessages[currentIndex]])
        setCurrentIndex(prev => prev + 1)
      }, currentIndex === 0 ? 1000 : 2000)

      return () => clearTimeout(timer)
    } else {
      // Reset after showing all messages
      const resetTimer = setTimeout(() => {
        setCurrentMessages([])
        setCurrentIndex(0)
      }, 3000)

      return () => clearTimeout(resetTimer)
    }
  }, [currentIndex])

  return (
    <div className="w-80 mx-auto">
      {/* Phone mockup */}
      <div className="bg-black rounded-3xl p-2 shadow-xl">
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Status bar */}
          <div className="bg-white px-6 py-3 flex justify-between items-center text-black">
            <span className="text-sm font-medium">9:41</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-2.5 bg-black rounded-sm"></div>
              <div className="w-6 h-3 border border-black rounded-sm">
                <div className="w-4 h-1.5 bg-black rounded-sm m-0.5"></div>
              </div>
            </div>
          </div>

          {/* Chat header */}
          <div className="bg-[var(--nenrin-forest)] px-6 py-4 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="text-white font-semibold">Nenrin</h3>
              <p className="text-white/80 text-xs">Your AI productivity assistant</p>
            </div>
          </div>

          {/* Chat messages */}
          <div className="bg-[var(--nenrin-mist)] p-6 h-96">
            <div className="space-y-4">
              {currentMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                      message.sender === "user"
                        ? "bg-[var(--nenrin-forest)] text-white"
                        : "bg-white border border-[var(--nenrin-mist)] text-[var(--nenrin-ink)]"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}