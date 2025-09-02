'use client'

import { Button } from "../components/ui/button"
import { Check, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const plans = (t: (key: string) => string) => [
  {
    name: t('plan_free'),
    description: t('plan_free_desc'),
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: "",
    popular: false,
    cta: t('plan_free_cta'),
    features: [
      { name: t('feature_conversational_ai'), value: "15 / day" },
      { name: t('feature_automated_workflows'), value: "2" },
      { name: t('feature_reminder_granularity'), value: "Hourly" },
      { name: t('feature_time_tracking'), included: false },
      { name: t('feature_trash_retention'), value: "7 days" },
      { name: t('feature_projects'), included: false },
    ],
  },
  {
    name: t('plan_pro'),
    description: t('plan_pro_desc'),
    monthlyPrice: "TBA",
    yearlyPrice: "TBA",
    period: t('per_month'),
    popular: true,
    cta: t('plan_pro_cta'),
    features: [
      { name: t('feature_conversational_ai'), value: "150 / day" },
      { name: t('feature_automated_workflows'), value: "10" },
      { name: t('feature_reminder_granularity'), value: "Per minute" },
      { name: t('feature_time_tracking'), value: "Advanced" },
      { name: t('feature_trash_retention'), value: "90 days" },
      { name: t('feature_projects'), value: "1" },
      { name: t('members_included'), value: "2" },
    ],
  },
  {
    name: t('plan_team'),
    description: t('plan_team_desc'),
    monthlyPrice: "TBA",
    yearlyPrice: "TBA",
    period: t('per_team_per_month'),
    popular: false,
    cta: t('plan_team_cta'),
    features: [
      { name: t('feature_conversational_ai'), value: "1,000 / day" },
      { name: t('feature_automated_workflows'), value: "50" },
      { name: t('feature_reminder_granularity'), value: "Per minute" },
      { name: t('feature_time_tracking'), value: "Advanced" },
      { name: t('feature_trash_retention'), value: "90 days" },
      { name: t('feature_projects'), value: "10" },
      { name: t('members_included'), value: "5" },
      { name: t('feature_roles_permissions'), included: true },
      { name: t('feature_project_budgets'), included: true },
    ],
  },
]

export function PricingSection() {
  const { t } = useTranslation()
  const [isYearly, setIsYearly] = useState(false)
  const translatedPlans = plans(t)

  return (
    <section id="pricing" className="py-24 px-4 pricing-rings">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--nenrin-bark)] text-white text-sm font-medium mb-6">
            {t('pricing')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--nenrin-ink)] mb-4">{t('pricing_title')}</h1>
          <p className="text-lg text-[var(--nenrin-sage)] max-w-2xl mx-auto mb-8">
            {t('pricing_subtitle')}
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
              {t('monthly')}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all border-2 ${
                isYearly
                  ? "border-[var(--nenrin-forest)] bg-white text-[var(--nenrin-forest)]"
                  : "border-[var(--nenrin-mist)] bg-white text-[var(--nenrin-sage)] hover:border-[var(--nenrin-sage)]"
              }`}
            >
              {t('yearly')}
            </button>
            {isYearly && (
              <span className="bg-[var(--nenrin-forest)] text-white px-3 py-1 rounded-full text-xs font-medium ml-3">
                {t('save_20_percent')}
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {translatedPlans.map((plan, index) => {
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
                      {t('most_popular')}
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
            {t('all_plans_include')}
          </p>
        </div>
      </div>
    </section>
  )
}