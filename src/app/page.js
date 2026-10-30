import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4 text-primary">
          <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">ExpensePro</h2>
            <span className="text-primary text-xs font-semibold uppercase tracking-wider">Viewer Mode</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-primary/10 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-sm text-primary">visibility</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Read-only Access</span>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Export CSV">
              <span className="material-symbols-outlined">download</span>
            </button>
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Print Report">
              <span className="material-symbols-outlined">print</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-8">
        {/* Header Section with Month Selector */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              MONTHLY EXPENSE SHEET – <span className="text-primary">MARCH 2026</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Detailed financial overview for the current billing cycle.</p>
          </div>
          
          <div className="flex items-center border border-primary/20 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
            <button className="px-4 py-2 text-sm font-bold text-slate-400 hover:bg-primary/5 border-r border-primary/10">JAN 2026</button>
            <button className="px-4 py-2 text-sm font-bold text-slate-400 hover:bg-primary/5 border-r border-primary/10">FEB 2026</button>
            <button className="px-6 py-2 text-sm font-bold bg-primary text-white">MARCH 2026</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Opening Balance</span>
              <span className="material-symbols-outlined text-slate-400">account_balance</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">32,830</div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-orange-500 border border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monthly Collection</span>
              <span className="material-symbols-outlined text-orange-500">payments</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">283,250</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-primary border border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Expense</span>
              <span className="material-symbols-outlined text-primary">shopping_cart</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">274,295</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-green-500 border border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Saving</span>
              <span className="material-symbols-outlined text-green-500">savings</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">8,955</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-secondary-gold border border-primary/10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Saving</span>
              <span className="material-symbols-outlined text-secondary-gold">account_balance_wallet</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">41,785</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Table Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
              <div className="px-6 py-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Operational Expenses</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase">Fixed Expenses</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">Security Expense</td>
                      <td className="px-6 py-4 text-sm font-bold text-right">210,000</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">Electrician Charges</td>
                      <td className="px-6 py-4 text-sm font-bold text-right">8,000</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">Sweeper Salary</td>
                      <td className="px-6 py-4 text-sm font-bold text-right">20,000</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">Sweeper Accessories</td>
                      <td className="px-6 py-4 text-sm font-bold text-right">6,200</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">Electrical Accessories</td>
                      <td className="px-6 py-4 text-sm font-bold text-right">14,765</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">Park</td>
                      <td className="px-6 py-4 text-sm font-bold text-right">3,530</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
              <div className="px-6 py-4 bg-secondary-gold/10 border-b border-secondary-gold/20 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Miscellaneous Expenses</h3>
                <span className="text-xs bg-secondary-gold/20 text-secondary-gold px-2 py-1 rounded font-bold uppercase">Variable Expenes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-purple-600 dark:text-purple-400">Miscellaneous Expenses</td>
                      <td className="px-6 py-4 text-sm font-bold text-right">6,800</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">Gutter Cleaned</td>
                      <td className="px-6 py-4 text-sm font-bold text-right">5,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Notes/Contact Panel */}
            <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/20">
              <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">notes</span> Notes
              </h4>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed text-right mb-6" dir="rtl">
                نوٹ: یہ اطلاع دی جاتی ہے کہ اس ماہ کی کلیکشن میں کمی اس لیے آئی ہے کیونکہ کچھ افراد نے اپنی ماہانہ رقم ادا نہیں کی، جس کی وجہ سے مجموعی کلیکشن اور سیونگ متاثر ہوئی ہے۔ براہ کرم آئندہ وقت پر ادائیگی یقینی بنائیں۔ شکریہ۔
              </p>
              
              <h4 className="font-bold text-primary mb-4 flex items-center gap-2 border-t border-primary/20 pt-4">
                <span className="material-symbols-outlined">contact_support</span> Point of Contact
              </h4>
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">For any questions or clarifications regarding this financial summary, please contact:</p>
                <div className="flex flex-col gap-2">
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span>Mr. Majeed Shb</span>
                    <span className="text-primary">0301-3377675</span>
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span>Mr. Fahad Rizwan</span>
                    <span className="text-primary">0344-3160446</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-background-dark border-t border-primary/10 py-6 text-center text-slate-400 text-xs">
        <p>© 2026 Expense Management System. Generated for review.</p>
      </footer>
    </div>
  );
}
