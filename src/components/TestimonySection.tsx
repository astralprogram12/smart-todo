import { useTranslation } from "react-i18next"

export function TestimonySection() {
  const { t } = useTranslation()
  const testimonials = [
    {
      name: t('testimonial1_name'),
      title: t('testimonial1_title'),
      company: t('testimonial1_company'),
      content: t('testimonial1_content'),
      avatar: "SC"
    },
    {
      name: t('testimonial2_name'),
      title: t('testimonial2_title'),
      company: t('testimonial2_company'),
      content: t('testimonial2_content'),
      avatar: "MJ"
    },
    {
      name: t('testimonial3_name'),
      title: t('testimonial3_title'),
      company: t('testimonial3_company'),
      content: t('testimonial3_content'),
      avatar: "ER"
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-[var(--nenrin-bark)] rounded-full mb-8">
            <span className="font-body text-sm text-white">{t('testimonials')}</span>
          </div>
          <h2 className="font-heading font-bold text-3xl lg:text-4xl text-[var(--nenrin-ink)] mb-6">
            {t('testimonials_title')}
          </h2>
          <p className="font-body text-[var(--nenrin-sage)] max-w-3xl mx-auto text-lg">
            {t('testimonials_subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-[var(--nenrin-mist)] p-6 rounded-xl">
              <p className="text-[var(--nenrin-ink)] mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[var(--nenrin-forest)] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{testimonial.avatar}</span>
                </div>
                <div>
                  <p className="font-semibold text-[var(--nenrin-ink)]">{testimonial.name}</p>
                  <p className="text-[var(--nenrin-sage)] text-sm">{testimonial.title} {t('at')} {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}