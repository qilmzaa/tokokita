export default function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800 ${className}`}
    />
  )
}
