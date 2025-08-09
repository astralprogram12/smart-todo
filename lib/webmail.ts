export type WebmailInfo = { url: string; provider: string }

export function resolveWebmailUrl(input?: string | null): WebmailInfo {
  const fallback: WebmailInfo = { url: "https://mail.google.com", provider: "Gmail" }
  if (!input) return fallback

  let domain = String(input).trim().toLowerCase()
  if (domain.includes("@")) domain = domain.split("@").pop() as string
  domain = domain.replace(/^www\./, "")

  const map: Record<string, WebmailInfo> = {
    "gmail.com": { url: "https://mail.google.com", provider: "Gmail" },
    "googlemail.com": { url: "https://mail.google.com", provider: "Gmail" },

    "yahoo.com": { url: "https://mail.yahoo.com", provider: "Yahoo Mail" },
    "ymail.com": { url: "https://mail.yahoo.com", provider: "Yahoo Mail" },
    "rocketmail.com": { url: "https://mail.yahoo.com", provider: "Yahoo Mail" },

    // Outlook family (prefer Outlook Live instead of hotmail.com)
    "outlook.com": { url: "https://outlook.live.com/mail/", provider: "Outlook" },
    "hotmail.com": { url: "https://outlook.live.com/mail/", provider: "Outlook" },
    "live.com": { url: "https://outlook.live.com/mail/", provider: "Outlook" },
    "msn.com": { url: "https://outlook.live.com/mail/", provider: "Outlook" },
    "office365.com": { url: "https://outlook.office.com/mail/", provider: "Outlook 365" },
    "outlook.office365.com": { url: "https://outlook.office.com/mail/", provider: "Outlook 365" },

    "icloud.com": { url: "https://www.icloud.com/mail/", provider: "iCloud Mail" },
    "me.com": { url: "https://www.icloud.com/mail/", provider: "iCloud Mail" },
    "mac.com": { url: "https://www.icloud.com/mail/", provider: "iCloud Mail" },

    "proton.me": { url: "https://mail.proton.me/", provider: "Proton Mail" },
    "protonmail.com": { url: "https://mail.proton.me/", provider: "Proton Mail" },

    "zoho.com": { url: "https://mail.zoho.com", provider: "Zoho Mail" },
    "aol.com": { url: "https://mail.aol.com", provider: "AOL Mail" },
    "gmx.com": { url: "https://www.gmx.com/", provider: "GMX Mail" },
    "gmx.de": { url: "https://www.gmx.net/", provider: "GMX Mail" },

    "yandex.com": { url: "https://mail.yandex.com", provider: "Yandex Mail" },
    "yandex.ru": { url: "https://mail.yandex.ru", provider: "Yandex Mail" },

    "hey.com": { url: "https://app.hey.com/", provider: "HEY" },
    "fastmail.com": { url: "https://www.fastmail.com/login/", provider: "Fastmail" },
    "tutanota.com": { url: "https://mail.tutanota.com/", provider: "Tutanota" },
  }

  if (map[domain]) return map[domain]
  return { url: `https://${domain}`, provider: domain }
}
