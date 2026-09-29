import { useState, useMemo } from 'react'
import {
  MessageSquare, Send, Users, UserPlus, Megaphone, Copy,
  Check, ExternalLink, Trash2, Pencil, Search, Sparkles,
  Droplet, FileText, AlertTriangle, ArrowRight, RotateCcw,
  Plus, CheckCheck, Smartphone, Globe, Link2, X
} from 'lucide-react'
import {
  addWhatsAppContact, updateWhatsAppContact, deleteWhatsAppContact,
  bulkAddWhatsAppContacts, updateWhatsAppGroups
} from '../utils/storage'
import { predictNextWaterSupply } from '../utils/waterPrediction'

export default function WhatsAppBroadcastHub({
  data,
  setData,
  selectedMonth,
  selectedYear,
  totals,
  showNotif
}) {
  const [activeSubTab, setActiveSubTab] = useState('composer') // 'composer' | 'contacts' | 'groups'
  const currentMonthKey = `${selectedMonth} ${selectedYear}`

  // ─── Contacts State ──────────────────────────────────────────
  const contacts = data.contacts || []
  const groups = data.groups || [
    { id: '1', name: 'N.T.R.C Sector 7D/1', link: '' },
    { id: '2', name: 'NTRG 2 Asad Hanzalla street', link: '' }
  ]

  const [searchTerm, setSearchTerm] = useState('')
  const [editingContact, setEditingContact] = useState(null)
  const [contactForm, setContactForm] = useState({ name: '', phone: '', houseNo: '', tag: 'Resident', group: 'NTRG 2 Asad Hanzalla street' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkParsed, setBulkParsed] = useState([])

  // ─── Groups State ────────────────────────────────────────────
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupLink, setNewGroupLink] = useState('')
  const [groupLinkModal, setGroupLinkModal] = useState(null) // { group, pendingText, linkInput }
  const [savingGroupLink, setSavingGroupLink] = useState(false)

  // ─── Composer State ──────────────────────────────────────────
  const [activeTemplate, setActiveTemplate] = useState('water') // 'water' | 'expense' | 'dues' | 'custom'
  const [msgLanguage, setMsgLanguage] = useState('ur') // Default to 'ur' for community notices
  const [copied, setCopied] = useState(false)
  const [queueIndex, setQueueIndex] = useState(0)

  // Water Prediction data
  const predictionData = useMemo(() => predictNextWaterSupply(data.waterSupply || []), [data.waterSupply])

  // Helper to build template text for any language
  const buildTemplateMessage = (templateKey, lang) => {
    const websiteUrl = 'https://monthly-expense-dashboard.vercel.app/view'
    const last = predictionData.lastSupply
    const p = predictionData.prediction
    const rec = totals.record
    const isDeficit = totals.totalSaving < 0

    // ─── 1. WATER SUPPLY & FORECAST ───
    if (templateKey === 'water') {
      if (lang === 'ur') {
        let text = `💧 *پانی کی سپلائی کا شیڈول اور متوقع پیشگوئی*\n`
        text += `📍 *نارتھ ٹاؤن ریذیڈنٹس (North Town Residents)*\n\n`
        if (predictionData.hasEnoughData) {
          text += `✅ *گزشتہ سپلائی:* ${last.formattedStart} تا ${last.formattedEnd}\n`
          text += `🔮 *اگلی متوقع سپلائی:* *${p.windowFormatted}*\n`
          text += `🎯 *زیادہ امکان آغاز:* ${p.predictedDateFormatted}\n`
          text += `⏳ *متوقع دورانیہ:* ${p.avgDurationText}\n`
          text += `🔄 *سپلائی سائیکل:* ہر ~${p.avgIntervalDays} دن بعد (${p.reliabilityScore}% مستقل مزاجی)\n\n`
        } else {
          text += `ℹ️ پانی کی سپلائی کا ریکارڈ اپ ڈیٹ کیا جا رہا ہے۔\n\n`
        }
        text += `⚠️ *ضروری اطلاع:* تمام معزز رہائشیوں سے گزارش ہے کہ اپنے انڈر گراؤنڈ ٹینک چیک کر لیں اور موٹروں کی بروقت تیاری یقینی بنائیں۔\n\n`
        text += `🌐 *آن لائن اخراجات اور پانی کا ٹریکر:* \n${websiteUrl}`
        return text
      } else {
        let text = `💧 *WATER SUPPLY ANNOUNCEMENT & FORECAST*\n`
        text += `📍 *North Town Residents*\n\n`
        if (predictionData.hasEnoughData) {
          text += `✅ *Recent Supply:* ${last.formattedStart} – ${last.formattedEnd}\n`
          text += `🔮 *Next Expected Arrival:* *${p.windowFormatted}*\n`
          text += `🎯 *Most Probable Start:* ${p.predictedDateFormatted}\n`
          text += `⏳ *Estimated Duration:* ${p.avgDurationText}\n`
          text += `🔄 *Cadence:* Every ~${p.avgIntervalDays} days (${p.reliabilityScore}% regularity)\n\n`
        } else {
          text += `ℹ️ Water supply tracking is being updated.\n\n`
        }
        text += `⚠️ *Notice:* Please keep water storage tanks clean and ready.\n\n`
        text += `🌐 *Live Dashboard:*\n${websiteUrl}`
        return text
      }
    }

    // ─── 2. MONTHLY EXPENSE & FINANCIAL SHEET ───
    if (templateKey === 'expense') {
      if (lang === 'ur') {
        let text = `📊 *ماہانہ مالیاتی رپورٹ: ${currentMonthKey}*\n`
        text += `📍 *نارتھ ٹاؤن ریذیڈنٹس مینجمنٹ کمیٹی*\n\n`
        text += `💵 *ابتدائی بیلنس (Opening):* PKR ${Number(rec.openingBalance || 0).toLocaleString('en-PK')}\n`
        text += `📥 *ماہانہ کلیکشن (Collection):* PKR ${Number(rec.monthlyCollection || 0).toLocaleString('en-PK')}\n`
        text += `🛒 *کل اخراجات (Total Expense):* PKR ${Number(totals.totalExpense || 0).toLocaleString('en-PK')}\n`
        text += `📈 *اس ماہ کی بچت (Monthly Saving):* PKR ${Number(totals.saving || 0).toLocaleString('en-PK')}\n`
        text += `${isDeficit ? '⚠️ *مجموعی خسارہ (Total Deficit)*' : '💰 *مجموعی جمع شدہ بچت (Total Saving)*'}: PKR ${Number(Math.abs(totals.totalSaving || 0)).toLocaleString('en-PK')}\n\n`
        if (rec.note) {
          text += `📝 *انتظامیہ کا اہم نوٹ:*\n"${rec.note}"\n\n`
        }
        text += `📄 *تفصیلی اخراجات اور بلز دیکھنے کے لیے لنک ملاحظہ فرمائیں:*\n${websiteUrl}`
        return text
      } else {
        let text = `📊 *MONTHLY FINANCIAL STATEMENT: ${currentMonthKey.toUpperCase()}*\n`
        text += `📍 *North Town Residents*\n\n`
        text += `💵 *Opening Balance:* PKR ${Number(rec.openingBalance || 0).toLocaleString('en-PK')}\n`
        text += `📥 *Monthly Collection:* PKR ${Number(rec.monthlyCollection || 0).toLocaleString('en-PK')}\n`
        text += `🛒 *Total Expenses:* PKR ${Number(totals.totalExpense || 0).toLocaleString('en-PK')}\n`
        text += `📈 *Monthly Saving:* PKR ${Number(totals.saving || 0).toLocaleString('en-PK')}\n`
        text += `${isDeficit ? '⚠️ *Total Deficit*' : '💰 *Total Saving*'}: PKR ${Number(Math.abs(totals.totalSaving || 0)).toLocaleString('en-PK')}\n\n`
        if (rec.note) text += `📝 *Note:*\n"${rec.note}"\n\n`
        text += `📄 *Check Detailed Statement:*\n${websiteUrl}`
        return text
      }
    }

    // ─── 3. MAINTENANCE DUES REMINDER ───
    if (templateKey === 'dues') {
      if (lang === 'ur') {
        let text = `🔔 *یاددہانی: ماہانہ مینٹیننس و سیکیورٹی فیس*\n`
        text += `📍 *نارتھ ٹاؤن ریذیڈنٹس (North Town Residents)*\n\n`
        text += `معزز رہائشی بھائیو اور بہنو،\nالسلام علیکم!\n\n`
        text += `آپ سے مؤدبانہ گزارش ہے کہ برائے مہربانی ماہ *${currentMonthKey}* کی ماہانہ مینٹیننس و سیکیورٹی فیس جلد از جلد جمع کروا دیں۔\n\n`
        text += `بروقت ادائیگی سے سیکیورٹی گارڈز، سویپرز کی تنخواہیں اور گلی کے انتظامات بلاتعطل جاری رہتے ہیں۔\n\n`
        text += `📞 *رابطہ برائے ادائیگی:*\n`
        text += `• جناب عبدالمجید صاحب: 0301-3377675\n`
        text += `• جناب فہد رضوان صاحب: 0344-3160446\n\n`
        text += `🌐 *ماہانہ حساب کتاب آن لائن دیکھیں:*\n${websiteUrl}\n\n`
        text += `آپ کے تعاون کا بہت شکریہ! جزاکم اللہ خیراً۔`
        return text
      } else {
        let text = `🔔 *REMINDER: MONTHLY MAINTENANCE DUES*\n`
        text += `📍 *North Town Residents*\n\n`
        text += `Dear Residents,\n`
        text += `Please clear your monthly maintenance collection for *${currentMonthKey}* at your earliest convenience.\n\n`
        text += `Timely payments ensure uninterrupted security, sweeper cleanliness, and neighborhood maintenance.\n\n`
        text += `📞 *Contacts:* Mr. Majeed (0301-3377675) | Mr. Fahad (0344-3160446)\n\n`
        text += `🌐 *Expense Summary:* ${websiteUrl}\n\n`
        text += `Thank you for your cooperation! 🙏`
        return text
      }
    }

    // ─── 4. CUSTOM / IMPORTANT NOTICE ───
    if (lang === 'ur') {
      return `📢 *انتظامیہ کی طرف سے ضروری اطلاع*\n📍 *نارتھ ٹاؤن ریذیڈنٹس (North Town Residents)*\n\nمعزز رہائشیوں،\nالسلام علیکم!\n\n[یہاں اپنا پیغام درج کریں]\n\nشکریہ،\nانتظامیہ کمیٹی نارتھ ٹاؤن ریذیڈنٹس\n🌐 ${websiteUrl}`
    } else {
      return `📢 *IMPORTANT NOTICE*\n📍 *North Town Residents*\n\nDear Residents,\n\n[Write your announcement here]\n\nThank you,\nManagement Committee\n🌐 ${websiteUrl}`
    }
  }

  // Active message text state initialized with current template and language
  const [messageText, setMessageText] = useState(() => buildTemplateMessage('water', 'ur'))

  // Switch Template handler
  const handleSelectTemplate = (tmpl) => {
    setActiveTemplate(tmpl)
    setMessageText(buildTemplateMessage(tmpl, msgLanguage))
  }

  // Switch Language handler
  const handleLanguageChange = (newLang) => {
    setMsgLanguage(newLang)
    setMessageText(buildTemplateMessage(activeTemplate, newLang))
  }

  // ─── Actions ─────────────────────────────────────────────────
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText)
    setCopied(true)
    showNotif('Message text copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareToGroup = (group) => {
    let groupMessageText = messageText
    const groupSlug = group.name.includes('7D') ? '7d1' : 'ntrg2'
    if (groupMessageText.includes('/view') && !groupMessageText.includes('?grp=')) {
      groupMessageText = groupMessageText.replace(/\/view(?!\?)/g, `/view?grp=${groupSlug}`)
    }
    try {
      navigator.clipboard.writeText(groupMessageText)
    } catch (e) {}

    // If group has an invite link configured, open that exact group chat directly!
    if (group.link && group.link.trim()) {
      let targetUrl = group.link.trim()
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl
      }
      window.open(targetUrl, '_blank')
      showNotif(`Announcement copied! Opening "${group.name}" — just paste (Ctrl+V) and send.`)
    } else {
      // 1-Click Direct WhatsApp open with pre-typed announcement — no blocking popup!
      const encoded = encodeURIComponent(groupMessageText)
      const url = `https://api.whatsapp.com/send?text=${encoded}`
      window.open(url, '_blank')
      showNotif(`Announcement copied! Tap "${group.name}" in WhatsApp and click Send.`)
    }
  }

  const handleSaveAndOpenGroupLink = async (e) => {
    if (e) e.preventDefault()
    if (!groupLinkModal) return
    const { group, pendingText, linkInput } = groupLinkModal
    if (!linkInput.trim()) {
      showNotif('Please enter a WhatsApp group link', 'error')
      return
    }

    let cleanLink = linkInput.trim()
    if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      cleanLink = 'https://' + cleanLink
    }

    setSavingGroupLink(true)
    try {
      const updated = groups.map(g => g.id === group.id ? { ...g, link: cleanLink } : g)
      const fresh = await updateWhatsAppGroups(updated)
      setData(fresh)

      if (pendingText) {
        try {
          await navigator.clipboard.writeText(pendingText)
        } catch (err) {}
      }

      window.open(cleanLink, '_blank')
      showNotif(`Link saved! Opening ${group.name} — paste (Ctrl+V) directly in the group chat.`)
      setGroupLinkModal(null)
    } catch (err) {
      showNotif('Failed to save group link', 'error')
    } finally {
      setSavingGroupLink(false)
    }
  }

  const handleOpenFallbackShare = () => {
    if (!groupLinkModal) return
    const { group, pendingText } = groupLinkModal
    const encoded = encodeURIComponent(pendingText || messageText)
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank')
    showNotif(`Notice copied! Select "${group.name}" in WhatsApp and click Send.`)
    setGroupLinkModal(null)
  }

  const handleSendToCurrentContact = () => {
    const current = filteredContacts[queueIndex]
    if (!current) return
    const cleanPhone = current.phone.replace(/[^0-9]/g, '')
    const groupSlug = (current.group || '').includes('7D') ? '7d1' : 'ntrg2'
    // Personalize link for direct tracking if present
    let personalizedText = messageText
    if (personalizedText.includes('/view') && !personalizedText.includes('?u=')) {
      const nameParam = encodeURIComponent(current.name || '')
      const addrParam = encodeURIComponent(current.houseNo || '')
      personalizedText = personalizedText.replace(/\/view(?!\?)/g, `/view?u=${cleanPhone}&name=${nameParam}&addr=${addrParam}&grp=${groupSlug}`)
    }
    const encoded = encodeURIComponent(personalizedText)
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
    window.open(url, '_blank')

    if (queueIndex < filteredContacts.length - 1) {
      setQueueIndex(q => q + 1)
    }
  }

  // ─── Contact Management Actions ──────────────────────────────
  const handleSaveContact = async (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.phone) {
      showNotif('Name and phone are required', 'error')
      return
    }

    // Format phone
    let formattedPhone = contactForm.phone.trim()
    if (formattedPhone.startsWith('03')) {
      formattedPhone = '+92 ' + formattedPhone.substring(1)
    }

    try {
      let fresh
      if (editingContact) {
        fresh = await updateWhatsAppContact({
          ...contactForm,
          phone: formattedPhone,
          id: editingContact.id
        })
        showNotif('Contact updated successfully!')
      } else {
        fresh = await addWhatsAppContact({
          ...contactForm,
          phone: formattedPhone
        })
        showNotif('Contact added to directory!')
      }
      setData(fresh)
      setContactForm({ name: '', phone: '', houseNo: '', tag: 'Resident' })
      setEditingContact(null)
      setShowAddModal(false)
    } catch (err) {
      showNotif('Failed to save contact', 'error')
    }
  }

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return
    try {
      const fresh = await deleteWhatsAppContact(id)
      setData(fresh)
      showNotif('Contact deleted', 'error')
    } catch (err) {
      showNotif('Failed to delete contact', 'error')
    }
  }

  // Smart parser for bulk pasting contacts from WhatsApp
  const handleParseBulk = (text) => {
    setBulkText(text)
    const lines = text.split('\n').filter(l => l.trim().length > 0)
    const parsed = []

    const phoneRegex = /(\+?92[\s-]?\d{3}[\s-]?\d{7}|03\d{2}[\s-]?\d{7})/

    lines.forEach(line => {
      const match = line.match(phoneRegex)
      if (match) {
        const rawPhone = match[0]
        let cleanPhone = rawPhone.replace(/[\s-]/g, '')
        if (cleanPhone.startsWith('03')) {
          cleanPhone = '+92' + cleanPhone.substring(1)
        }
        if (!cleanPhone.startsWith('+')) {
          cleanPhone = '+' + cleanPhone
        }

        let name = line.replace(rawPhone, '').replace(/^[~\s,-]+|[~\s,-]+$/g, '').trim()
        if (!name) name = 'Resident'

        const houseMatch = line.match(/7[dD][\s/-]?\d?/i)
        const houseNo = houseMatch ? houseMatch[0].toUpperCase() : ''

        parsed.push({
          name: name.replace(/~/g, '').trim(),
          phone: cleanPhone,
          houseNo,
          tag: line.toLowerCase().includes('admin') ? 'Committee' : 'Resident'
        })
      }
    })

    setBulkParsed(parsed)
  }

  const handleImportBulk = async () => {
    if (bulkParsed.length === 0) return
    try {
      const fresh = await bulkAddWhatsAppContacts(bulkParsed)
      setData(fresh)
      showNotif(`Successfully imported ${bulkParsed.length} contacts!`)
      setBulkText('')
      setBulkParsed([])
      setShowBulkModal(false)
    } catch (err) {
      showNotif('Failed to import contacts', 'error')
    }
  }

  // ─── Group Management ────────────────────────────────────────
  const handleAddGroup = async (e) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      link: newGroupLink.trim()
    }
    const updated = [...groups, newGroup]
    try {
      const fresh = await updateWhatsAppGroups(updated)
      setData(fresh)
      setNewGroupName('')
      setNewGroupLink('')
      showNotif('New WhatsApp group added!')
    } catch (err) {
      showNotif('Failed to add group', 'error')
    }
  }

  const handleDeleteGroup = async (id) => {
    if (groups.length <= 1) {
      alert('You must have at least one group configured.')
      return
    }
    if (!window.confirm('Delete this WhatsApp group?')) return
    const updated = groups.filter(g => g.id !== id)
    try {
      const fresh = await updateWhatsAppGroups(updated)
      setData(fresh)
      showNotif('Group removed', 'error')
    } catch (err) {
      showNotif('Failed to delete group', 'error')
    }
  }

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts
    const q = searchTerm.toLowerCase()
    return contacts.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.houseNo?.toLowerCase().includes(q)
    )
  }, [contacts, searchTerm])

  return (
    <div className="space-y-6">
      {/* ─── Top Header & Sub-Tabs ─── */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                WhatsApp Broadcast &amp; Directory Hub
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Broadcast announcements to community groups or send updates directly to residents.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('composer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'composer'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary'
            }`}
          >
            <Megaphone size={14} /> Compose &amp; Send
          </button>
          <button
            onClick={() => setActiveSubTab('contacts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'contacts'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary'
            }`}
          >
            <Users size={14} /> Contacts Directory ({contacts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('groups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'groups'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary'
            }`}
          >
            <Smartphone size={14} /> Groups ({groups.length})
          </button>
        </div>
      </div>

      {/* ─── TAB 1: COMPOSER & BROADCASTER ─── */}
      {activeSubTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Composer Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Templates with Language Switcher */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" /> Select Notice Template
                </h3>

                {/* 🇵🇰 اردو / 🇬🇧 English Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('ur')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all font-urdu ${
                      msgLanguage === 'ur'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    🇵🇰 اردو (Urdu)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      msgLanguage === 'en'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Water Supply */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('water')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeTemplate === 'water'
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Droplet size={18} className="text-blue-500 mb-2" />
                  <div>
                    <span className="text-xs font-bold block">Water Supply</span>
                    <span className="text-[11px] font-urdu text-blue-600 dark:text-blue-300 font-bold block">پانی کی سپلائی</span>
                  </div>
                </button>

                {/* 2. Monthly Expense */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('expense')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeTemplate === 'expense'
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <FileText size={18} className="text-emerald-500 mb-2" />
                  <div>
                    <span className="text-xs font-bold block">Monthly Expense</span>
                    <span className="text-[11px] font-urdu text-emerald-600 dark:text-emerald-300 font-bold block">ماہانہ اخراجات</span>
                  </div>
                </button>

                {/* 3. Dues Reminder */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('dues')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeTemplate === 'dues'
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <AlertTriangle size={18} className="text-amber-500 mb-2" />
                  <div>
                    <span className="text-xs font-bold block">Dues Reminder</span>
                    <span className="text-[11px] font-urdu text-amber-600 dark:text-amber-300 font-bold block">فیس کی یاددہانی</span>
                  </div>
                </button>

                {/* 4. Custom Notice */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('custom')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeTemplate === 'custom'
                      ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Megaphone size={18} className="text-purple-500 mb-2" />
                  <div>
                    <span className="text-xs font-bold block">Custom Notice</span>
                    <span className="text-[11px] font-urdu text-purple-600 dark:text-purple-300 font-bold block">خاص اطلاع</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Message Text Editor */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span>Message Content (WhatsApp Formatted)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${msgLanguage === 'ur' ? 'bg-emerald-100 text-emerald-800 font-urdu' : 'bg-blue-100 text-blue-800'}`}>
                    {msgLanguage === 'ur' ? 'اردو' : 'English'}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={11}
                dir={msgLanguage === 'ur' ? 'rtl' : 'ltr'}
                className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none ${
                  msgLanguage === 'ur'
                    ? 'font-urdu text-[15px] leading-relaxed text-slate-900 dark:text-slate-100'
                    : 'font-sans text-xs md:text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100'
                }`}
                placeholder={msgLanguage === 'ur' ? 'یہاں اپنا پیغام درج کریں...' : 'Type your announcement here...'}
              />

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Supports *bold*, _italics_, ~strikethrough~, and emojis.</span>
                <span>{messageText.length} characters</span>
              </div>
            </div>

            {/* Dispatch Buttons: Send to Community Groups */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    1-Click Broadcast to Community Groups
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full font-bold">
                    Reaches All Members
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Click a group below to automatically copy the announcement and open that WhatsApp group chat directly:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map(g => (
                  <div
                    key={g.id}
                    onClick={() => handleShareToGroup(g)}
                    className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/40 transition-all text-emerald-900 dark:text-emerald-200 group active:scale-98 shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="size-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        WA
                      </div>
                      <div>
                        <span className="text-xs font-black block group-hover:text-emerald-700">{g.name}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          {g.link ? (
                            <>Open Direct Group Chat &amp; Paste <ArrowRight size={10} /></>
                          ) : (
                            <>Click to Send to Group <ArrowRight size={10} /></>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setGroupLinkModal({
                            group: g,
                            pendingText: messageText,
                            linkInput: g.link || ''
                          })
                        }}
                        className="p-1.5 rounded-lg text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 transition-colors"
                        title="Configure WhatsApp Group Link"
                      >
                        <Link2 size={15} />
                      </button>
                      <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                        <Send size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-base flex-shrink-0">💡</span>
                <p className="leading-relaxed">
                  <strong>Direct Group Access:</strong> Clicking a group button copies the announcement to your clipboard and opens that specific WhatsApp group chat directly. When WhatsApp opens, simply paste (<strong>Ctrl+V</strong>) and hit Send! Click the link icon (<Link2 size={12} className="inline mx-0.5 text-emerald-600" />) to update any group invite link anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: WhatsApp Live Preview & Individual Queue */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live WhatsApp Preview */}
            <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800">
              <div className="bg-emerald-800 px-4 py-3 flex items-center gap-3">
                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  NT
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-tight">North Town Residents</h4>
                  <p className="text-[10px] text-emerald-200 font-medium">Community Broadcast Preview</p>
                </div>
              </div>

              {/* Chat Canvas with WhatsApp Wallpaper feel */}
              <div className="p-4 bg-slate-950/90 min-h-[340px] flex flex-col justify-end space-y-2">
                <div className="self-center bg-slate-800/80 text-[10px] text-slate-300 px-3 py-1 rounded-full font-medium mb-2">
                  TODAY
                </div>

                <div
                  dir={msgLanguage === 'ur' ? 'rtl' : 'ltr'}
                  className={`self-start max-w-[92%] bg-emerald-900/90 border border-emerald-700/50 text-white p-3.5 rounded-2xl rounded-tl-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                    msgLanguage === 'ur' ? 'font-urdu text-[14px] text-right' : 'text-xs text-left'
                  }`}
                >
                  {messageText}
                  <div className={`flex items-center gap-1 mt-1 text-[9px] text-emerald-300/80 font-mono ${msgLanguage === 'ur' ? 'justify-start' : 'justify-end'}`}>
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck size={12} className="text-emerald-300" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Formatted for WhatsApp Mobile &amp; Web</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  Copy Message
                </button>
              </div>
            </div>

            {/* Individual Contacts Sequential Sender Queue */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Sequential Direct Sender
                  </h3>
                  <p className="text-xs text-slate-500">
                    Send directly to saved residents one by one.
                  </p>
                </div>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {filteredContacts.length} Contacts
                </span>
              </div>

              {filteredContacts.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center text-xs text-slate-500">
                  No contacts found. Add contacts in the Directory tab below or bulk import them.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">
                        Contact #{queueIndex + 1} of {filteredContacts.length}
                      </span>
                      <span className="text-[11px] font-bold text-primary">
                        {Math.round(((queueIndex + 1) / filteredContacts.length) * 100)}% Complete
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${((queueIndex + 1) / filteredContacts.length) * 100}%` }}
                      />
                    </div>

                    {filteredContacts[queueIndex] && (
                      <div className="pt-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                            {filteredContacts[queueIndex].name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {filteredContacts[queueIndex].phone} {filteredContacts[queueIndex].houseNo ? `(${filteredContacts[queueIndex].houseNo})` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600">
                          {filteredContacts[queueIndex].tag || 'Resident'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendToCurrentContact}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Send size={14} /> Send &amp; Next Resident
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueIndex(q => Math.min(filteredContacts.length - 1, q + 1))}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                      title="Skip Contact"
                    >
                      <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueIndex(0)}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                      title="Reset Queue"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: RESIDENT CONTACTS DIRECTORY ─── */}
      {activeSubTab === 'contacts' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users size={20} className="text-primary" /> Resident Contacts Directory
              </h3>
              <p className="text-xs text-slate-500">
                Manage all neighborhood residents and committee member phone numbers.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <FileText size={14} /> Bulk Paste Import
              </button>
              <button
                onClick={() => {
                  setEditingContact(null)
                  setContactForm({ name: '', phone: '', houseNo: '', tag: 'Resident' })
                  setShowAddModal(true)
                }}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <UserPlus size={14} /> Add Contact
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone number, or house # (e.g. Asad, 7D/1)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-xs font-medium"
            />
          </div>

          {/* Table */}
          <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">WhatsApp Number</th>
                  <th className="p-3.5">Group</th>
                  <th className="p-3.5">House / Street</th>
                  <th className="p-3.5">Tag</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                      {contacts.length === 0 ? 'No contacts added yet. Click "Add Contact" or "Bulk Paste Import" to get started.' : 'No contacts matching search filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">{c.name}</td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          {c.phone} <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          (c.group || '').includes('7D')
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {c.group || 'NTRG 2 Asad Hanzalla street'}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-600 dark:text-slate-300">{c.houseNo || '—'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${c.tag === 'Committee' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                          {c.tag || 'Resident'}
                        </span>
                      </td>
                      <td className="p-3.5 flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingContact(c)
                            setContactForm({
                              name: c.name,
                              phone: c.phone,
                              houseNo: c.houseNo || '',
                              tag: c.tag || 'Resident',
                              group: c.group || 'NTRG 2 Asad Hanzalla street'
                            })
                            setShowAddModal(true)
                          }}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Contact"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: MANAGE GROUPS ─── */}
      {activeSubTab === 'groups' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Smartphone size={20} className="text-primary" /> Community WhatsApp Groups
            </h3>
            <p className="text-xs text-slate-500">
              Manage WhatsApp groups where announcements and notices are dispatched.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map(g => (
              <div key={g.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    WA
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{g.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {g.link ? (
                        <a href={g.link} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold">
                          Group Chat Linked <ExternalLink size={10} />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setGroupLinkModal({ group: g, linkInput: '' })}
                          className="text-amber-600 hover:underline font-bold text-[10px]"
                        >
                          + Set Group Invite Link
                        </button>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setGroupLinkModal({ group: g, linkInput: g.link || '' })}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                    title="Configure WhatsApp Group Link"
                  >
                    <Link2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(g.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Group"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Group Form */}
          <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3">
            <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={14} /> Add Another WhatsApp Group
            </h4>
            <form onSubmit={handleAddGroup} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Group Name (e.g. NTRG 3 Sector 7D)"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                required
                className="sm:col-span-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="url"
                placeholder="WhatsApp Group Invite Link (https://chat.whatsapp.com/...)"
                value={newGroupLink}
                onChange={e => setNewGroupLink(e.target.value)}
                className="sm:col-span-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <button
                type="submit"
                className="bg-primary text-white text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add / Edit Single Contact ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {editingContact ? 'Edit Resident Contact' : 'Add Resident Contact'}
            </h3>

            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Shamim"
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +92 344 3160446 or 03443160446"
                  value={contactForm.phone}
                  onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">House / Street #</label>
                  <input
                    type="text"
                    placeholder="e.g. 7D/1"
                    value={contactForm.houseNo}
                    onChange={e => setContactForm({ ...contactForm, houseNo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tag / Role</label>
                  <select
                    value={contactForm.tag}
                    onChange={e => setContactForm({ ...contactForm, tag: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    <option value="Resident">Resident</option>
                    <option value="Committee">Committee / Admin</option>
                    <option value="Shopkeeper">Shop / Commercial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">WhatsApp Group</label>
                <select
                  value={contactForm.group || 'NTRG 2 Asad Hanzalla street'}
                  onChange={e => setContactForm({ ...contactForm, group: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary font-bold"
                >
                  <option value="N.T.R.C Sector 7D/1">N.T.R.C Sector 7D/1</option>
                  <option value="NTRG 2 Asad Hanzalla street">NTRG 2 Asad Hanzalla street</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90"
                >
                  {editingContact ? 'Update' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Bulk Paste Import ─── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Bulk Paste Contacts from WhatsApp
            </h3>
            <p className="text-xs text-slate-500">
              Paste raw text from WhatsApp group info. The system will automatically detect names, Pakistani phone numbers, and house numbers.
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={e => handleParseBulk(e.target.value)}
              placeholder="Paste here, e.g.:&#10;~Asad Shamim 7D/1 +92 344 3160446&#10;~Hanzalla Muzaffar +92 346 2650446&#10;Abdul Majeed Uncle 7D/1 +92 301 3377675"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-primary"
            />

            {bulkParsed.length > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl text-xs space-y-1 max-h-36 overflow-y-auto">
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                  Detected {bulkParsed.length} Contacts:
                </span>
                {bulkParsed.map((p, i) => (
                  <div key={i} className="text-slate-600 dark:text-slate-300 font-mono text-[11px] flex justify-between">
                    <span>{p.name} {p.houseNo ? `(${p.houseNo})` : ''}</span>
                    <span className="font-bold text-emerald-700">{p.phone}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkParsed.length === 0}
                onClick={handleImportBulk}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Import {bulkParsed.length} Contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Connect / Configure WhatsApp Group Link ─── */}
      {groupLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Link2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Connect Direct Group Chat
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                    {groupLinkModal.group?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGroupLinkModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Paste the <strong>WhatsApp Group Invite Link</strong> for <strong>{groupLinkModal.group?.name}</strong>. Once saved, clicking this group button will immediately open this specific group chat directly in WhatsApp!
            </p>

            <form onSubmit={handleSaveAndOpenGroupLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  WhatsApp Group Invite Link
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://chat.whatsapp.com/..."
                    value={groupLinkModal.linkInput}
                    onChange={e => setGroupLinkModal({ ...groupLinkModal, linkInput: e.target.value })}
                    className="w-full pl-3 pr-20 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText()
                        if (clip) setGroupLinkModal(prev => ({ ...prev, linkInput: clip.trim() }))
                      } catch (err) {}
                    }}
                    className="absolute right-2 top-2 text-[10px] font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                  >
                    Paste
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
                <span className="font-extrabold block">💡 How to get this link in WhatsApp:</span>
                <ol className="list-decimal list-inside space-y-0.5 opacity-90 pl-1 text-[11px]">
                  <li>Open the group in WhatsApp (Mobile or Web).</li>
                  <li>Tap the Group Name at the top for <strong>Group Info</strong>.</li>
                  <li>Tap <strong>Invite via link</strong> &gt; <strong>Copy link</strong>.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={savingGroupLink || !groupLinkModal.linkInput?.trim()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Send size={14} />
                  <span>{savingGroupLink ? 'Saving...' : 'Save Link & Open Group Chat Directly'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenFallbackShare}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-xs font-semibold hover:underline"
                >
                  Or Open WhatsApp Share Picker (Forward) →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
