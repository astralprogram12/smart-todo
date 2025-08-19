export function TestimonySection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      title: "Product Manager",
      company: "TechCorp",
      content: "Nenrin has completely transformed how I manage my daily tasks. The natural language interface makes it feel like I'm talking to a colleague rather than using software.",
      avatar: "SC"
    },
    {
      name: "Marcus Johnson",
      title: "Freelance Designer",
      company: "Independent",
      content: "The time tracking and project organization features are incredible. I've increased my productivity by 40% since switching to Nenrin.",
      avatar: "MJ"
    },
    {
      name: "Elena Rodriguez",
      title: "Team Lead",
      company: "StartupXYZ",
      content: "Our team collaboration has never been smoother. Nenrin makes it easy to keep everyone aligned and on track with our goals.",
      avatar: "ER"
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-[var(--nenrin-bark)] rounded-full mb-8">
            <span className="font-body text-sm text-white">Testimonials</span>
          </div>
          <h2 className="font-heading font-bold text-3xl lg:text-4xl text-[var(--nenrin-ink)] mb-6">
            Loved by thousands of users
          </h2>
          <p className="font-body text-[var(--nenrin-sage)] max-w-3xl mx-auto text-lg">
            See what our users have to say about their experience with Nenrin.
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
                  <p className="text-[var(--nenrin-sage)] text-sm">{testimonial.title} at {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}