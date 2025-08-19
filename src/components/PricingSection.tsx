'use client'

import { Button } from "../components/ui/button"
import { Check, X } from "lucide-react"
import { useState } from "react"

const plans = [
  {
    name: "Free",
    description: "For getting started.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: "",
    popular: false,
    cta: "Get started",
    features: [
      { name: "Conversational AI Actions", value: "15 / day" },
      { name: "Automated Workflows", value: "2" },
      { name: "Reminder Granularity", value: "Hourly" },
      { name: "Time Tracking & Reports", included: false },
      { name: "Trash Retention", value: "7 days" },
      { name: "Projects", included: false },
    ],
  },
  {
    name: "Pro",
    description: "Most Popular · For professionals & power users.",
    monthlyPrice: "TBA",
    yearlyPrice: "TBA",
    period: "/ month",
    popular: true,
    cta: "Start 7‑day trial",
    features: [
      { name: "Conversational AI Actions", value: "150 / day" },
      { name: "Automated Workflows", value: "10" },
      { name: "Reminder Granularity", value: "Per minute" },
      { name: "Time Tracking & Reports", value: "Advanced" },
      { name: "Trash Retention", value: "90 days" },
      { name: "Projects", value: "1" },
      { name: "Members included", value: "2" },
    ],
  },
  {
    name: "Team",
    description: "For collaborative projects.",
    monthlyPrice: "TBA",
    yearlyPrice: "TBA",
    period: "/ team / month",
    popular: false,
    cta: "Start 14‑day trial",
    features: [
      { name: "Conversational AI Actions", value: "1,000 / day" },
      { name: "Automated Workflows", value: "50" },
      { name: "Reminder Granularity", value: "Per minute" },
      { name: "Time Tracking & Reports", value: "Advanced" },
      { name: "Trash Retention", value: "90 days" },
      { name: "Projects", value: "10" },
      { name: "Members included", value: "5" },
      { name: "Roles & Permissions", included: true },
      { name: "Project Budgets", included: true },
    ],
  },
]

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 px-4 pricing-rings">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--nenrin-bark)] text-white text-sm font-medium mb-6">
            Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--nenrin-ink)] mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-[var(--nenrin-sage)] max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your productivity needs. Start free and upgrade as you grow.
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all border-2 ${
                !isYearly
                  ? "border-[var(--nenrin-forest)] bg-white text-[var(--nenrin-forest)]"
                  : "border-[var(--nenrin-mist)] bg-white text-[var(--nenrin-sage)] hover:border-[var(--nenrin-sage)]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all border-2 ${
                isYearly
                  ? "border-[var(--nenrin-forest)] bg-white text-[var(--nenrin-forest)]"
                  : "border-[var(--nenrin-mist)] bg-white text-[var(--nenrin-sage)] hover:border-[var(--nenrin-sage)]"
              }`}
            >
              Yearly
            </button>
            {isYearly && (
              <span className="bg-[var(--nenrin-forest)] text-white px-3 py-1 rounded-full text-xs font-medium ml-3">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const currentPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice
            const displayPrice = currentPrice === 0 ? "$0" : currentPrice === "TBA" ? "TBA" : `$${currentPrice}`

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-8 ${
                  plan.popular
                    ? "border-[var(--nenrin-forest)] bg-[var(--nenrin-forest)]/5 scale-105"
                    : "border-[var(--nenrin-mist)] bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[var(--nenrin-forest)] text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[var(--nenrin-ink)] mb-2">{plan.name}</h3>
                  <p className="text-[var(--nenrin-sage)] mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[var(--nenrin-ink)]">{displayPrice}</span>
                    {plan.period && <span className="text-[var(--nenrin-sage)] ml-1">{plan.period}</span>}
                  </div>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-[var(--nenrin-forest)] hover:bg-[var(--nenrin-forest)]/90 text-white"
                        : "bg-white border-2 border-[var(--nenrin-forest)] text-[var(--nenrin-forest)] hover:bg-[var(--nenrin-forest)] hover:text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center justify-between">
                      <span className="text-[var(--nenrin-ink)] text-sm">{feature.name}</span>
                      <div className="flex items-center">
                        {feature.included === false ? (
                          <X className="w-4 h-4 text-[var(--nenrin-sage)]" />
                        ) : feature.included === true ? (
                          <Check className="w-4 h-4 text-[var(--nenrin-forest)]" />
                        ) : (
                          <span className="text-[var(--nenrin-ink)] text-sm font-medium">{feature.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-[var(--nenrin-sage)] text-sm">
            All plans include our core AI productivity features and 24/7 support.
          </p>
        </div>
      </div>
    </section>
  )
}