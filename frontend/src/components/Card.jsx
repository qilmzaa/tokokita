export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
