export default function AdminDashboard() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <header className="flex items-center justify-between border-b border-primary/20 bg-white dark:bg-background-dark px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4 text-primary dark:text-accent">
          <span className="material-symbols-outlined text-3xl">account_balance</span>
          <h2 className="text-xl font-bold tracking-tight">FinDash Admin</h2>
        </div>
        <div className="flex justify-end gap-8">
          <button className="flex items-center justify-center rounded-lg h-10 px-5 bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-bold shadow-md">
            <span className="material-symbols-outlined mr-2 text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-primary/10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent text-3xl">admin_panel_settings</span>
              <h1 className="text-3xl font-bold tracking-tight">Data Entry Control Center</h1>
            </div>
            <p className="text-slate-500 text-sm">Manage system expenses and input monthly records.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-primary/10 p-6 flex flex-col h-fit">
            <h3 className="text-lg font-bold flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-primary dark:text-accent">add_circle</span>
              New Record Entry
            </h3>
            
            <form className="flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Month / Year</span>
                <input className="form-input rounded-lg border-primary/20 dark:bg-slate-900 dark:border-slate-600 dark:text-white" type="month" />
              </label>
              
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Opening Balance (PKR)</span>
                <input className="form-input rounded-lg border-primary/20 dark:bg-slate-900 dark:border-slate-600 dark:text-white" type="number" placeholder="e.g. 50400" />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Monthly Collection (PKR)</span>
                <input className="form-input rounded-lg border-primary/20 dark:bg-slate-900 dark:border-slate-600 dark:text-white" type="number" placeholder="284750" />
              </label>

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">save</span> Create Month
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-primary/10 p-5">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-primary">list_alt</span> March 2026 Breakdown</h3>
               <p className="text-sm text-yellow-600 mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                 Notice: Complete schema wiring via Supabase requires configuring NEXT_PUBLIC_SUPABASE_URL and Anon key.
               </p>
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Description</th>
                      <th className="px-5 py-3 font-semibold text-right">Amount (PKR)</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     <tr>
                       <td className="px-5 py-4 font-medium">Security Expense</td>
                       <td className="px-5 py-4 text-right">210,000</td>
                       <td className="px-5 py-4 text-right text-red-500"><span className="material-symbols-outlined text-sm cursor-pointer">delete</span></td>
                     </tr>
                     <tr>
                       <td className="px-5 py-4 font-medium">Sweeper Salary</td>
                       <td className="px-5 py-4 text-right">20,000</td>
                       <td className="px-5 py-4 text-right text-red-500"><span className="material-symbols-outlined text-sm cursor-pointer">delete</span></td>
                     </tr>
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
