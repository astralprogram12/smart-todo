import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

export function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    {
      number: "01",
      title: t('step1_title'),
      description: t('step1_desc'),
    },
    {
      number: "02",
      title: t('step2_title'),
      description: t('step2_desc'),
    },
    {
      number: "03",
      title: t('step3_title'),
      description: t('step3_desc'),
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(var(--nenrin-forest) 1px, transparent 1px),
            linear-gradient(90deg, var(--nenrin-forest) 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-[var(--nenrin-bark)] rounded-full mb-8">
            <span className="font-body text-sm text-white">{t('how_it_works')}</span>
          </div>

          <h2 className="font-heading font-bold text-3xl lg:text-4xl text-[var(--nenrin-ink)] mb-6">
            {t('how_it_works_title')}
          </h2>
          <p className="font-body text-[var(--nenrin-sage)] max-w-3xl mx-auto text-lg">
            {t('how_it_works_subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                {/* Main number circle */}
                <div className="w-16 h-16 bg-[var(--nenrin-cream)] border-2 border-[var(--nenrin-bark)] rounded-full flex items-center justify-center">
                  <span className="font-heading text-lg font-semibold text-[var(--nenrin-ink)]">{step.number}</span>
                </div>

                {/* Progressive circles based on step number */}
                {Array.from({ length: index + 1 }).map((_, circleIndex) => (
                  <div
                    key={circleIndex}
                    className="absolute border-2 border-[var(--nenrin-bark)] rounded-full opacity-30"
                    style={{
                      width: `${80 + circleIndex * 16}px`,
                      height: `${80 + circleIndex * 16}px`,
                      top: `${-8 - circleIndex * 8}px`,
                      left: `${-8 - circleIndex * 8}px`,
                    }}
                  />
                ))}
              </div>

              <h4 className="font-heading font-semibold text-xl text-[var(--nenrin-ink)] mb-4">{step.title}</h4>
              <p className="font-body text-[var(--nenrin-sage)] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link 
            to="/features" 
            className="inline-flex items-center px-8 py-3 bg-[var(--nenrin-forest)] text-white font-body font-medium rounded-lg hover:bg-[var(--nenrin-forest)]/90 transition-colors duration-200"
          >
            {t('see_all_features')}
          </Link>
        </div>
      </div>
    </section>
  )
}