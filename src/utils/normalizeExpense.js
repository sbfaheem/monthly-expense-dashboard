/**
 * Normalization & Two-Tier Category Classification Layer
 * Standardizes misspelled / inconsistent line item names across monthly expense records
 * and maps them into 5 standardized parent categories.
 */

export const ITEM_MAP = {
  // Bulb / Lighting
  "new blub": "New Bulb",
  "new bulb": "New Bulb",
  "blub repair": "Bulb Repair",
  "bulb repair": "Bulb Repair",
  "blub": "Bulb",
  "bulb": "Bulb",
  
  // Uniforms
  "uniform": "Uniforms",
  "uniforms": "Uniforms",
  "security guard new uniform": "Uniforms",

  // Cleaning & Tools
  "jahdo": "Jhado / Cleaning",
  "jhado": "Jhado / Cleaning",
  "balcha": "Balcha / Shovel",
  "sweeper accessories": "Sweeper Accessories",
  "chemical + wash": "Chemical & Wash",
  "gutter cleaned": "Gutter Cleaning",
  "chuna + riksha fare": "Chuna & Transport",
  "ghaneti": "Ghaneti / Bell",

  // Hardware & Materials
  "bans": "Bans / Bamboo",
  "bans.": "Bans / Bamboo",
  "lock": "Locks / Security Hardware",
  "wire lock": "Locks / Security Hardware",
  "dhakan": "Chamber Cover / Dhakan",
  "valve chamber cover": "Valve Chamber Cover",
  "remaining amount for water chamber": "Water Chamber Works",
  "ring + cap labour charges": "Ring & Cap Labor",
  "terpal": "Tarpaulin / Terpal",

  // Electrical
  "electricial accessories": "Electrical Accessories",
  "electrical accessories": "Electrical Accessories",
  "electrician (arham)": "Electrician - Extra",
  "electrician charges": "Electrician - Retainer",
  "electrician retainer": "Electrician - Retainer",

  // Salaries & Payroll
  "security expense": "Security Expense",
  "sweeper salary": "Sweeper Salary",

  // Community, Events & Utilities
  "water tanker": "Water Tanker",
  "park": "Park Maintenance",
  "park maintenance": "Park Maintenance",
  "event exp.": "Event Expenses",
  "event exp": "Event Expenses",
  "event expense": "Event Expenses",
  "fare rikshaw & panaflex": "Panaflex & Transport",
  "receipt books": "Receipt Books / Stationery",
  "previous committee outstanding": "Previous Committee Outstanding",
  "miscellaneous": "Miscellaneous Expenses",
  "miscellaneous expenses": "Miscellaneous Expenses",
  "welder charges": "Welder Charges",
  "welder charges + culhari": "Welder Charges & Axe",

  // CapEx
  "cctv": "CCTV Cameras",
  "cctv cameras": "CCTV Cameras",
  "cctv expense": "CCTV Cameras",
  "pedestal fan": "Pedestal Fans",
  "ceiling fan": "Ceiling Fans",
  "chair": "Chairs & Furniture",
  "shed installation": "Shed Installation",
  "wooden stair": "Wooden Stairs",
  "transportation for wooden stair": "Wooden Stairs Transport"
}

export const PARENT_CATEGORIES = [
  'Salaries & Payroll',
  'Electrical & Infrastructure',
  'Supplies & Hardware',
  'Community & Utilities',
  'Capital Expenditures (CapEx)'
]

export const CATEGORY_MAPPINGS = {
  'Salaries & Payroll': [
    'Security Expense',
    'Sweeper Salary',
    'Electrician - Retainer'
  ],
  'Electrical & Infrastructure': [
    'Electrician - Extra',
    'Electrical Accessories',
    'Bulb Repair',
    'New Bulb'
  ],
  'Supplies & Hardware': [
    'Uniforms',
    'Bans / Bamboo',
    'Jhado / Cleaning',
    'Balcha / Shovel',
    'Locks / Security Hardware',
    'Sweeper Accessories',
    'Chemical & Wash',
    'Chuna & Transport',
    'Ghaneti / Bell',
    'Chamber Cover / Dhakan',
    'Valve Chamber Cover',
    'Water Chamber Works',
    'Ring & Cap Labor',
    'Tarpaulin / Terpal'
  ],
  'Community & Utilities': [
    'Water Tanker',
    'Park Maintenance',
    'Event Expenses',
    'Panaflex & Transport',
    'Receipt Books / Stationery',
    'Previous Committee Outstanding',
    'Miscellaneous Expenses',
    'Gutter Cleaning',
    'Welder Charges',
    'Welder Charges & Axe'
  ],
  'Capital Expenditures (CapEx)': [
    'CCTV Cameras',
    'Pedestal Fans',
    'Ceiling Fans',
    'Chairs & Furniture',
    'Shed Installation',
    'Wooden Stairs',
    'Wooden Stairs Transport'
  ]
}

/**
 * Normalizes an item name to its canonical dictionary form
 * @param {string} rawText 
 * @returns {string} Normalized item name
 */
export function normalizeItem(rawText) {
  if (!rawText) return "Uncategorized"
  const cleaned = rawText.trim().toLowerCase()
  return ITEM_MAP[cleaned] || rawText.trim()
}

/**
 * Returns the standardized 2-tier parent category for any given item
 * @param {string} itemRawOrNormalized 
 * @param {string} [fallbackCategory] 
 * @returns {string} One of the 5 parent categories
 */
export function getParentCategory(itemRawOrNormalized, fallbackCategory = '') {
  const norm = normalizeItem(itemRawOrNormalized)
  
  for (const [parentCat, items] of Object.entries(CATEGORY_MAPPINGS)) {
    if (items.some(it => it.toLowerCase() === norm.toLowerCase())) {
      return parentCat
    }
  }

  // Fallback heuristic based on common keywords
  const lower = norm.toLowerCase()
  if (lower.includes('salary') || lower.includes('security') || lower.includes('guard')) return 'Salaries & Payroll'
  if (lower.includes('bulb') || lower.includes('electric') || lower.includes('wire') || lower.includes('light')) return 'Electrical & Infrastructure'
  if (lower.includes('uniform') || lower.includes('jhado') || lower.includes('bans') || lower.includes('lock') || lower.includes('balcha') || lower.includes('hardware')) return 'Supplies & Hardware'
  if (lower.includes('cctv') || lower.includes('camera') || lower.includes('fan') || lower.includes('capital') || lower.includes('furniture') || lower.includes('shed')) return 'Capital Expenditures (CapEx)'
  if (lower.includes('tanker') || lower.includes('water') || lower.includes('park') || lower.includes('event') || lower.includes('clean') || lower.includes('utility')) return 'Community & Utilities'

  if (fallbackCategory && PARENT_CATEGORIES.includes(fallbackCategory)) {
    return fallbackCategory
  }

  return 'Community & Utilities'
}

/**
 * Enriches an expense object with normalized item name and parent category
 * @param {Object} expense 
 * @returns {Object} Enriched expense
 */
export function enrichExpense(expense) {
  if (!expense) return expense
  const normalizedName = normalizeItem(expense.name)
  const parentCategory = getParentCategory(normalizedName, expense.category)
  return {
    ...expense,
    rawName: expense.name,
    normalizedName,
    parentCategory
  }
}
