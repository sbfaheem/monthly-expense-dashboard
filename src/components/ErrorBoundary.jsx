import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('resident_identity')
      localStorage.removeItem('preferred_lang')
      sessionStorage.clear()
    } catch (e) {
      // ignore
    }
    window.location.href = '/view'
  }

  render() {
    if (this.state.hasError) {
      const isUrdu = typeof localStorage !== 'undefined' && localStorage.getItem('preferred_lang') === 'ur'

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="size-16 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-sm">
              ⚠️
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                {isUrdu ? 'ڈیش بورڈ لوڈ کرنے میں مسئلہ پیش آیا' : 'Something went wrong'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isUrdu 
                  ? 'براہ کرم صفحہ ریفریش کریں یا دوبارہ لاگ ان کریں۔' 
                  : 'An unexpected error occurred while rendering the dashboard. Please reload to continue.'}
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-left">
                  <p className="text-xs font-mono font-bold text-red-700 dark:text-red-300 break-words">
                    {this.state.error.message || String(this.state.error)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
              >
                {isUrdu ? 'صفحہ ریفریش کریں' : 'Reload Page'}
              </button>
              <button
                onClick={this.handleResetAndReload}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer"
              >
                {isUrdu ? 'کیشے صاف کر کے ری لوڈ کریں' : 'Reset & Reload'}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
