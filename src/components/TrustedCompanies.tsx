import { useTranslation } from "react-i18next"

export function TrustedCompanies() {
  const { t } = useTranslation()
  const companies = [
    { name: "Google", logo: "/logos/google.svg" },
    { name: "Microsoft", logo: "/logos/microsoft.svg" },
    { name: "Apple", logo: "/logos/apple.svg" },
    { name: "Netflix", logo: "/logos/netflix.svg" },
    { name: "Amazon", logo: "/logos/amazon.svg" },
    { name: "Meta", logo: "/logos/meta.svg" }
  ]

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-[var(--nenrin-sage)] text-sm font-medium mb-12">
          {t('trusted_by')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-60">
          {companies.map((company) => (
            <div key={company.name} className="flex justify-center">
              <div className="h-8 w-24 bg-[var(--nenrin-sage)]/20 rounded flex items-center justify-center">
                <span className="text-[var(--nenrin-sage)] text-xs font-medium">{company.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}