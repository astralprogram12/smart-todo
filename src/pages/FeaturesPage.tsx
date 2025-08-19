'use client'

import { useState } from "react"
import { Link } from "react-router-dom"
import { Header } from "../components/Header"
import Footer from "../components/Footer"
import { Button } from "../components/ui/button"
import { Clock, Users, Brain, ArrowRight } from "lucide-react"

interface ChatMessage {
  sender: "user" | "nenrin" | "budi" | "ani"
  content: string
  buttons?: string[]
}

interface CompactFeature {
  title: string
  description: string
  example: string
  messages: ChatMessage[]
}

interface FeatureCategory {
  icon: any
  title: string
  description: string
  features: CompactFeature[]
}

function CompactPhoneMockup({ messages }: { messages: ChatMessage[] }) {
  const getSenderColor = (sender: string) => {
    switch (sender) {
      case "user": return "bg-[var(--nenrin-forest)] text-white"
      case "nenrin": return "bg-white border border-[var(--nenrin-mist)] text-[var(--nenrin-ink)]"
      case "budi": return "bg-blue-100 text-blue-900 border border-blue-200"
      case "ani": return "bg-purple-100 text-purple-900 border border-purple-200"
      default: return "bg-gray-100 text-gray-900"
    }
  }

  return (
    <div className="w-48 mx-auto">
      {/* Compact Phone frame */}
      <div className="bg-black rounded-2xl p-1.5 shadow-lg">
        <div className="bg-white rounded-xl overflow-hidden">
          {/* Compact Status bar */}
          <div className="bg-white px-3 py-1 flex justify-between items-center text-black text-xs">
            <span>9:00</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-1.5 bg-black rounded-sm"></div>
              <div className="w-4 h-2 border border-black rounded-sm">
                <div className="w-2.5 h-0.5 bg-black rounded-sm m-0.5"></div>
              </div>
            </div>
          </div>

          {/* Compact Chat header */}
          <div className="bg-[var(--nenrin-forest)] px-3 py-2 flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full border border-white"></div>
            </div>
            <div>
              <h3 className="text-white font-medium text-xs">Nenrin</h3>
            </div>
          </div>

          {/* Compact Chat messages */}
          <div className="bg-[var(--nenrin-mist)] p-3 h-32">
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] px-2 py-1.5 rounded-lg text-xs ${getSenderColor(message.sender)}`}>
                    <p className="leading-relaxed">{message.content}</p>
                    {message.buttons && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {message.buttons.slice(0, 2).map((button, btnIndex) => (
                          <button
                            key={btnIndex}
                            className="bg-[#60C689] text-[var(--nenrin-ink)] px-2 py-0.5 rounded-full text-xs font-medium"
                          >
                            {button}
                          </button>
                        ))}
                      </div>
                    )}
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

function FeatureItem({ feature }: { feature: CompactFeature }) {
  return (
    <div className="flex items-start space-x-6 p-6 bg-white rounded-xl border border-[var(--nenrin-mist)] hover:shadow-md transition-all duration-200">
      <div className="flex-shrink-0">
        <CompactPhoneMockup messages={feature.messages} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-semibold text-lg text-[var(--nenrin-ink)] mb-2">
          {feature.title}
        </h3>
        <p className="text-[var(--nenrin-sage)] mb-3 leading-relaxed">
          {feature.description}
        </p>
        <div className="bg-[var(--nenrin-mist)] px-3 py-2 rounded-lg">
          <code className="text-sm text-[var(--nenrin-ink)] font-mono">{feature.example}</code>
        </div>
      </div>
    </div>
  )
}

const featureCategories: FeatureCategory[] = [
  {
    icon: Clock,
    title: "Personal Productivity",
    description: "Individual task management and time tracking",
    features: [
      {
        title: "Create Task",
        description: "Add tasks naturally with your voice or text.",
        example: '"add task: launch my blog"',
        messages: [
          { sender: "user", content: "add task: launch my blog" },
          { sender: "nenrin", content: "Added ✓ — 'Launch my blog' is on your list." }
        ]
      },
      {
        title: "Time Tracking",
        description: "Start timers and track your focus sessions.",
        example: '"start 25min pomodoro for writing"',
        messages: [
          { sender: "user", content: "start 25min pomodoro for writing" },
          { sender: "nenrin", content: "Timer started ✓ — 25:00 running for writing.", buttons: ["Pause", "Stop"] }
        ]
      },
      {
        title: "Set Reminder",
        description: "Get reminded at the perfect time.",
        example: '"remind me tomorrow 2pm"',
        messages: [
          { sender: "user", content: "remind me tomorrow 2pm" },
          { sender: "nenrin", content: "Reminder set ✓ — Tomorrow at 2:00 PM." }
        ]
      }
    ]
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Project management and team coordination",
    features: [
      {
        title: "Create Project",
        description: "Set up team workspaces with members and roles.",
        example: '"create project: Website Redesign"',
        messages: [
          { sender: "budi", content: "create project: Website Redesign" },
          { sender: "nenrin", content: "Project created ✓ — Ready to add members." }
        ]
      },
      {
        title: "Assign Task",
        description: "Delegate work to specific team members.",
        example: '"assign logo design to Sarah"',
        messages: [
          { sender: "budi", content: "assign logo design to Sarah" },
          { sender: "nenrin", content: "Task assigned ✓ — Sarah has been notified." }
        ]
      }
    ]
  },
  {
    icon: Brain,
    title: "AI & Automation",
    description: "Intelligent assistance and smart suggestions",
    features: [
      {
        title: "Smart Suggestions",
        description: "AI suggests task grouping and organization.",
        example: 'Auto-suggested project grouping',
        messages: [
          { sender: "nenrin", content: "I notice similar tasks. Group into 'Blog Launch' project?", buttons: ["Yes", "No"] }
        ]
      },
      {
        title: "Natural Language",
        description: "Talk to Nenrin like you would a colleague.",
        example: '"I need to finish the report by Friday"',
        messages: [
          { sender: "user", content: "I need to finish the report by Friday" },
          { sender: "nenrin", content: "Added ✓ — 'Finish report' due Friday." }
        ]
      }
    ]
  }
]

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div className="min-h-screen bg-[var(--nenrin-mist)]">
      <Header />

      {/* Features Header */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-[var(--nenrin-bark)] rounded-full mb-8">
            <span className="font-body text-sm text-white">Features</span>
          </div>

          <h1 className="font-heading font-bold text-4xl lg:text-5xl text-[var(--nenrin-ink)] mb-6">
            Everything you need to stay productive
          </h1>
          <p className="font-body text-[var(--nenrin-sage)] max-w-3xl mx-auto text-lg">
            From personal task management to team collaboration, Nenrin has all the features you need.
          </p>
        </div>
      </section>

      {/* Feature Categories Tabs */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Category Tabs */}
          <div className="flex justify-center mb-12">
            <div className="flex bg-white rounded-xl p-2 shadow-sm">
              {featureCategories.map((category, index) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={index}
                    onClick={() => setActiveCategory(index)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                      activeCategory === index
                        ? "bg-[var(--nenrin-forest)] text-white shadow-sm"
                        : "text-[var(--nenrin-sage)] hover:text-[var(--nenrin-ink)]"
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{category.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="font-heading font-bold text-2xl text-[var(--nenrin-ink)] mb-4">
                {featureCategories[activeCategory].title}
              </h2>
              <p className="text-[var(--nenrin-sage)] max-w-2xl mx-auto">
                {featureCategories[activeCategory].description}
              </p>
            </div>

            <div className="grid gap-8">
              {featureCategories[activeCategory].features.map((feature, index) => (
                <FeatureItem key={index} feature={feature} />
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 p-8 bg-white rounded-2xl border border-[var(--nenrin-mist)]">
            <h3 className="font-heading font-bold text-2xl text-[var(--nenrin-ink)] mb-4">
              Ready to get started?
            </h3>
            <p className="text-[var(--nenrin-sage)] mb-6">
              Join thousands of users who are already more productive with Nenrin.
            </p>
            <Link to="/signup">
              <Button className="bg-[var(--nenrin-forest)] hover:bg-[var(--forest-hover)] text-white font-semibold px-8 py-3 rounded-lg">
                Start with WhatsApp
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}