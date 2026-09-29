import { useState, useMemo } from 'react'
import {
  MessageSquare, Send, Users, UserPlus, Megaphone, Copy,
  Check, ExternalLink, Trash2, Pencil, Search, Sparkles,
  Droplet, FileText, AlertTriangle, ArrowRight, RotateCcw,
  Plus, CheckCheck, Smartphone
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
  const [contactForm, setContactForm] = useState({ name: '', phone: '', houseNo: '', tag: 'Resident' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkParsed, setBulkParsed] = useState([])

  // ─── Groups State ────────────────────────────────────────────
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupLink, setNewGroupLink] = useState('')

  // ─── Composer State ──────────────────────────────────────────
  const [activeTemplate, setActiveTemplate] = useState('water') // 'water' | 'expense' | 'dues' | 'custom'
  const [customUrdu, setCustomUrdu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [queueIndex, setQueueIndex] = useState(0)

  // Water Prediction data
  const predictionData = useMemo(() => predictNextWaterSupply(data.waterSupply || []), [data.waterSupply])

  // Template generator
  const generatedMessage = useMemo(() => {
    const websiteUrl = 'https://monthly-expense-dashboard.vercel.app/view'

    if (activeTemplate === 'water') {
      const last = predictionData.lastSupply
      const p = predictionData.prediction

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

      text += `⚠️ *Important Advice:* Please ensure your water motors and underground storage tanks are ready.\n\n`
      text += `🌐 *Live Expense & Water Tracker:*\n${websiteUrl}`
      return text
    }

    if (activeTemplate === 'expense') {
      const rec = totals.record
      const isDeficit = totals.totalSaving < 0

      let text = `📊 *MONTHLY FINANCIAL STATEMENT: ${currentMonthKey.toUpperCase()}*\n`
      text += `📍 *North Town Residents Management*\n\n`
      text += `💵 *Opening Balance:* PKR ${Number(rec.openingBalance || 0).toLocaleString('en-PK')}\n`
      text += `📥 *Monthly Collection:* PKR ${Number(rec.monthlyCollection || 0).toLocaleString('en-PK')}\n`
      text += `🛒 *Total Monthly Expense:* PKR ${Number(totals.totalExpense || 0).toLocaleString('en-PK')}\n`
      text += `📈 *Monthly Saving:* PKR ${Number(totals.saving || 0).toLocaleString('en-PK')}\n`
      text += `${isDeficit ? '⚠️ *Total Accumulated Deficit*' : '💰 *Total Accumulated Saving*'}: PKR ${Number(Math.abs(totals.totalSaving || 0)).toLocaleString('en-PK')}\n\n`

      if (rec.note) {
        text += `📝 *Management Note:*\n"${rec.note}"\n\n`
      }

      text += `📄 *Full Statement Breakdown & Receipts:*\n${websiteUrl}`
      return text
    }

    if (activeTemplate === 'dues') {
      let text = `🔔 *REMINDER: MONTHLY MAINTENANCE DUES*\n`
      text += `📍 *North Town Residents*\n\n`
      text += `Dear Residents,\n`
      text += `This is a gentle reminder to please clear your monthly maintenance & security collection for *${currentMonthKey}* at your earliest convenience.\n\n`
      text += `Timely payments ensure uninterrupted security, sweeper cleanliness, and neighborhood maintenance.\n\n`
      text += `📞 *Point of Contact:* Mr. Majeed (+92 301 3377675) & Mr. Fahad Rizwan (+92 344 3160446)\n\n`
      text += `🌐 *View Monthly Expenses & Savings Online:*\n${websiteUrl}\n\n`
      text += `Thank you for your cooperation! 🙏`
      return text
    }

    // Custom
    if (customUrdu) {
      return `📢 *انتظامیہ کی طرف سے ضروری اطلاع*\n📍 *North Town Residents*\n\nتمام معزز رہائشیوں سے گزارش ہے کہ مندرجہ ذیل اعلان پر توجہ فرمائیں: \n\n[یہاں اپنا پیغام لکھیں]\n\nشکریہ،\nانتظامیہ نارتھ ٹاؤن ریذیڈنٹس`
    }

    return `📢 *IMPORTANT ANNOUNCEMENT*\n📍 *North Town Residents*\n\nDear Residents,\n\nPlease take note of the following announcement:\n\n[Write announcement here]\n\nRegards,\nManagement Committee\n🌐 ${websiteUrl}`
  }, [activeTemplate, predictionData, totals, currentMonthKey, customUrdu])

  const [messageText, setMessageText] = useState(generatedMessage)

  // Update messageText when template changes
  const handleSelectTemplate = (tmpl) => {
    setActiveTemplate(tmpl)
    // Delay message update to next cycle
    setTimeout(() => {
      // Re-trigger memo
    }, 0)
  }

  // Sync state if template changed
  const applyTemplate = (tmpl, isUrdu = false) => {
    setActiveTemplate(tmpl)
    if (tmpl === 'custom') setCustomUrdu(isUrdu)
    // Directly generate
    const websiteUrl = 'https://monthly-expense-dashboard.vercel.app/view'
    if (tmpl === 'water') {
      const last = predictionData.lastSupply
      const p = predictionData.prediction
      let text = `💧 *WATER SUPPLY ANNOUNCEMENT & FORECAST*\n📍 *North Town Residents*\n\n`
      if (predictionData.hasEnoughData) {
        text += `✅ *Recent Supply:* ${last.formattedStart} – ${last.formattedEnd}\n`
        text += `🔮 *Next Expected Arrival:* *${p.windowFormatted}*\n`
        text += `🎯 *Most Probable Start:* ${p.predictedDateFormatted}\n`
        text += `⏳ *Estimated Duration:* ${p.avgDurationText}\n`
        text += `🔄 *Cadence:* Every ~${p.avgIntervalDays} days (${p.reliabilityScore}% regularity)\n\n`
      }
      text += `⚠️ *Notice:* Please keep water storage tanks clean and ready.\n\n`
      text += `🌐 *Live Dashboard:*\n${websiteUrl}`
      setMessageText(text)
    } else if (tmpl === 'expense') {
      const rec = totals.record
      const isDeficit = totals.totalSaving < 0
      let text = `📊 *MONTHLY FINANCIAL STATEMENT: ${currentMonthKey.toUpperCase()}*\n📍 *North Town Residents*\n\n`
      text += `💵 *Opening Balance:* PKR ${Number(rec.openingBalance || 0).toLocaleString('en-PK')}\n`
      text += `📥 *Monthly Collection:* PKR ${Number(rec.monthlyCollection || 0).toLocaleString('en-PK')}\n`
      text += `🛒 *Total Expenses:* PKR ${Number(totals.totalExpense || 0).toLocaleString('en-PK')}\n`
      text += `📈 *Monthly Saving:* PKR ${Number(totals.saving || 0).toLocaleString('en-PK')}\n`
      text += `${isDeficit ? '⚠️ *Total Deficit*' : '💰 *Total Saving*'}: PKR ${Number(Math.abs(totals.totalSaving || 0)).toLocaleString('en-PK')}\n\n`
      if (rec.note) text += `📝 *Note:*\n"${rec.note}"\n\n`
      text += `📄 *Check Detailed Statement:*\n${websiteUrl}`
      setMessageText(text)
    } else if (tmpl === 'dues') {
      let text = `🔔 *REMINDER: MONTHLY MAINTENANCE DUES*\n📍 *North Town Residents*\n\n`
      text += `Dear Residents,\nPlease clear your monthly maintenance collection for *${currentMonthKey}* at your earliest convenience.\n\n`
      text += `📞 *Contacts:* Mr. Majeed (0301-3377675) | Mr. Fahad (0344-3160446)\n\n`
      text += `🌐 *Expense Summary:* ${websiteUrl}\nThank you!`
      setMessageText(text)
    } else if (tmpl === 'custom') {
      if (isUrdu) {
        setMessageText(`📢 *انتظامیہ کی طرف سے ضروری اطلاع*\n📍 *North Town Residents*\n\nتمام معزز رہائشیوں سے گزارش ہے کہ:\n[اپنا پیغام یہاں درج کریں]\n\nشکریہ،\nانتظامیہ`)
      } else {
        setMessageText(`📢 *IMPORTANT NOTICE*\n📍 *North Town Residents*\n\nDear Residents,\n[Write your announcement here]\n\nThank you,\nManagement`)
      }
    }
  }

  // ─── Actions ─────────────────────────────────────────────────
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText)
    setCopied(true)
    showNotif('Message text copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareToGroup = (group) => {
    const encoded = encodeURIComponent(messageText)
    const url = `https://api.whatsapp.com/send?text=${encoded}`
    window.open(url, '_blank')
    showNotif(`Opening WhatsApp for: ${group.name}`)
  }

  const handleSendToCurrentContact = () => {
    const current = filteredContacts[queueIndex]
    if (!current) return
    const cleanPhone = current.phone.replace(/[^0-9]/g, '')
    const encoded = encodeURIComponent(messageText)
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

        // Remaining text is name
        let name = line.replace(rawPhone, '').replace(/^[~\s,-]+|[~\s,-]+$/g, '').trim()
        if (!name) name = 'Resident'

        // Detect house / sector tag if present (e.g. 7D/1, 7D2, 7D)
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
            {/* Quick Templates */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> Pre-built Notice Templates
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => applyTemplate('water')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeTemplate === 'water'
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Droplet size={18} className="text-blue-500 mb-2" />
                  <span className="text-xs font-bold">Water Supply &amp; Forecast</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTemplate('expense')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeTemplate === 'expense'
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <FileText size={18} className="text-emerald-500 mb-2" />
                  <span className="text-xs font-bold">Monthly Expense Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTemplate('dues')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeTemplate === 'dues'
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <AlertTriangle size={18} className="text-amber-500 mb-2" />
                  <span className="text-xs font-bold">Dues Payment Reminder</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTemplate('custom', false)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    activeTemplate === 'custom'
                      ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Megaphone size={18} className="text-purple-500 mb-2" />
                  <span className="text-xs font-bold">Custom Notice</span>
                </button>
              </div>

              {activeTemplate === 'custom' && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-bold text-slate-500">Notice Language:</span>
                  <button
                    type="button"
                    onClick={() => applyTemplate('custom', false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${!customUrdu ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('custom', true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-urdu ${customUrdu ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    اردو (Urdu)
                  </button>
                </div>
              )}
            </div>

            {/* Message Text Editor */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Message Content (WhatsApp Formatted)
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
                dir={customUrdu ? 'rtl' : 'ltr'}
                className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium leading-relaxed ${customUrdu ? 'font-urdu' : 'font-sans'}`}
                placeholder="Type your announcement here..."
              />

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Supports *bold*, _italics_, ~strikethrough~, and emojis.</span>
                <span>{messageText.length} characters</span>
              </div>
            </div>

            {/* Dispatch Buttons: Send to Community Groups */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  1-Click Broadcast to Community Groups
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sends this announcement directly into your community WhatsApp groups with one click:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleShareToGroup(g)}
                    className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all text-emerald-900 dark:text-emerald-200 group active:scale-98"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="size-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        WA
                      </div>
                      <div>
                        <span className="text-xs font-black block group-hover:text-emerald-700">{g.name}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Post to Group</span>
                      </div>
                    </div>
                    <Send size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
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

                <div className="self-start max-w-[92%] bg-emerald-900/90 border border-emerald-700/50 text-white p-3.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed whitespace-pre-wrap shadow-md">
                  {messageText}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-300/80 font-mono">
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
                  <th className="p-3.5">House / Street</th>
                  <th className="p-3.5">Tag</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">
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
                            setContactForm({ name: c.name, phone: c.phone, houseNo: c.houseNo || '', tag: c.tag || 'Resident' })
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
                        <a href={g.link} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          Group Invite Link <ExternalLink size={10} />
                        </a>
                      ) : 'Default Community Group'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteGroup(g.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Group"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Group Form */}
          <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3">
            <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={14} /> Add Another WhatsApp Group
            </h4>
            <form onSubmit={handleAddGroup} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Group Name (e.g. NTRG 3 Sector 7D)"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                required
                className="sm:col-span-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary"
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
    </div>
  )
}
