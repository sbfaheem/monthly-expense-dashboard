import React from 'react'
import { ShieldCheck, Zap, Droplet, Phone, MessageSquare, CheckCircle2, Wrench } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function ServiceDirectoryCard() {
  const { lang, t, isRtl } = useLanguage()
  const isUrdu = lang === 'ur'

  const services = [
    {
      id: 'security',
      title: t.guardGate || 'Security Gate Post',
      provider: isUrdu ? 'جناب عبدالمجید (سپروائزر)' : 'Supervisor Majeed',
      phone: '0301-3377675',
      rawPhone: '03013377675',
      waPhone: '923013377675',
      status: t.onDuty || 'On Duty',
      statusColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/50',
      waText: isUrdu ? 'السلام علیکم عبدالمجید صاحب! سیکیورٹی گیٹ کے حوالے سے رابطہ کیا ہے۔' : 'Hello Mr. Majeed, contacting regarding the security gate.'
    },
    {
      id: 'electrician',
      title: t.officialElectrician || 'Society Electrician',
      provider: isUrdu ? 'ارحم (سوسائٹی الیکٹریشن)' : 'Electrician Arham',
      phone: '0344-3160446',
      rawPhone: '03443160446',
      waPhone: '923443160446',
      status: t.available || 'Available',
      statusColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: <Zap size={20} className="text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50',
      waText: isUrdu ? 'السلام علیکم ارحم صاحب! الیکٹریکل مرمت کے کام کے لیے رابطہ کیا ہے۔' : 'Hello Arham, contacting regarding electrical work in Sector 7D/1.'
    },
    {
      id: 'tanker',
      title: t.tankerVendor || 'Water Tanker Provider',
      provider: isUrdu ? 'واٹر ٹینکر سروس (سپلائی)' : 'Water Tanker Service',
      phone: '0300-1234567',
      rawPhone: '03001234567',
      waPhone: '923001234567',
      status: t.available || 'Available',
      statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: <Droplet size={20} className="text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50',
      waText: isUrdu ? 'السلام علیکم! سیکٹر 7D/1 کے لیے واٹر ٹینکر درکار ہے۔' : 'Hello, requesting water tanker service for Sector 7D/1.'
    }
  ]

  return (
    <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-primary/10 shadow-sm space-y-5 transition-all">
      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">verified</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
              {t.serviceDirectoryTitle || 'Verified Community Services'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.availableServicesDesc || 'Authorized maintenance providers & utility suppliers for our area'}
          </p>
        </div>
      </div>

      {/* 3-Column Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Top row: Icon + Role Title + Status Badge */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className={`size-10 rounded-xl flex items-center justify-center border shadow-2xs ${svc.iconBg}`}>
                  {svc.icon}
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${svc.statusColor}`}>
                  <span className="size-1.5 rounded-full bg-current animate-pulse" />
                  {svc.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {svc.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                {svc.provider}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                <a href={`tel:${svc.rawPhone}`} className="hover:text-primary hover:underline">
                  {svc.phone}
                </a>
              </p>
            </div>

            {/* Direct Call & WhatsApp Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <a
                href={`tel:${svc.rawPhone}`}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95 shadow-2xs border border-slate-200 dark:border-slate-700"
              >
                <Phone size={13} className="text-slate-500 dark:text-slate-400" />
                <span>{t.callNow || 'Call'}</span>
              </a>

              <a
                href={`https://wa.me/${svc.waPhone}?text=${encodeURIComponent(svc.waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-all active:scale-95 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40"
              >
                <MessageSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t.chatWa || 'WhatsApp'}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
