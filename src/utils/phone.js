// Centralized contact formatting, deep-link helpers, and editable default WhatsApp message

export const DEFAULT_WHATSAPP_QUERY =
  'Assalam o Alaikum, I have a query regarding the Monthly Expense Dashboard.'

export const DEFAULT_MANAGEMENT_MESSAGE =
  'Assalam o Alaikum, I would like to inquire regarding the society Monthly Expense Dashboard accounts.'

/**
 * Strip dashes, spaces, and non-digit characters.
 * Ensures local Pakistani numbers like "0301-3377675" convert cleanly to "923013377675".
 */
export const toInternationalPhoneDigits = (rawPhone = '') => {
  const digits = String(rawPhone || '').replace(/\D+/g, '')
  if (!digits) return ''
  if (digits.startsWith('92')) return digits
  if (digits.startsWith('0')) return `92${digits.slice(1)}`
  return `92${digits}`
}

/**
 * Build a clean tel: link preserving digits (e.g., "0301-3377675" -> "tel:03013377675").
 */
export const formatTelHref = (rawPhone = '') => {
  const digits = String(rawPhone || '').replace(/\D+/g, '')
  return digits ? `tel:${digits}` : 'tel:'
}

/**
 * Build a safe https://wa.me/<intlNumber>?text=<encoded> URL.
 */
export const formatWhatsAppUrl = (rawPhone = '', message = DEFAULT_WHATSAPP_QUERY) => {
  const intlDigits = toInternationalPhoneDigits(rawPhone)
  const textParam = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${intlDigits}${textParam}`
}

/**
 * Resolve governance & support contacts from the existing data/translation layer,
 * preserving exact existing copy, roles, names, and phone numbers.
 */
export const buildManagementContacts = ({ settings, t = {}, isUrdu = false } = {}) => {
  const overrides = settings?.governanceContacts || {}

  return [
    {
      id: 'project-supervisor',
      name: isUrdu
        ? overrides.supervisorNameUr || 'جناب عبدالمجید صاحب'
        : overrides.supervisorName || 'Mr. Majeed',
      role: t.supervisorRole || 'Project Supervisor',
      phone: overrides.supervisorPhone || '0301-3377675',
      initial: 'M',
      accent: 'emerald',
      glow: 'green',
      whatsappMessage:
        overrides.supervisorWhatsappMessage ||
        'Assalam o Alaikum Mr. Majeed, I have a query regarding the Society Monthly Expense Dashboard.',
    },
    {
      id: 'financial-auditor',
      name: isUrdu
        ? overrides.auditorNameUr || 'جناب فہد رضوان صاحب'
        : overrides.auditorName || 'Mr. Fahad Rizwan',
      role: t.auditorRole || 'Financial Auditor',
      phone: overrides.auditorPhone || '0344-3160446',
      initial: 'F',
      accent: 'amber',
      glow: 'amber',
      whatsappMessage:
        overrides.auditorWhatsappMessage ||
        'Assalam o Alaikum Mr. Fahad Rizwan, I have a query regarding the Society Monthly Expense Dashboard.',
    },
  ]
}

export const buildDashboardSupportContact = ({ settings, isUrdu = false } = {}) => {
  const overrides = settings?.supportContact || {}

  return {
    id: 'dashboard-support',
    name: isUrdu
      ? overrides.nameUr || 'جناب سید بلال فہیم'
      : overrides.name || 'Mr. Syed Bilal Faheem',
    role: overrides.role || null,
    phone: overrides.phone || '0336-2607836',
    initial: 'B',
    accent: 'indigo',
    glow: 'indigo',
    whatsappMessage:
      overrides.whatsappMessage || DEFAULT_WHATSAPP_QUERY,
  }
}
