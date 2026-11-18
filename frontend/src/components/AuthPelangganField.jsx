import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const kelasInput = 'h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500'

export function AuthPelangganField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  autoFocus = false,
}) {
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`${kelasInput} ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
      />
      {error && <p id={errorId} role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}

export function PasswordField(props) {
  const [terlihat, setTerlihat] = useState(false)
  const errorId = `${props.id}-error`

  return (
    <div>
      <label htmlFor={props.id} className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{props.label}</label>
      <div className="relative">
        <input
          id={props.id}
          name={props.id}
          type={terlihat ? 'text' : 'password'}
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder ?? 'Masukkan password'}
          autoComplete={props.autoComplete}
          autoFocus={props.autoFocus}
          aria-invalid={Boolean(props.error)}
          aria-describedby={props.error ? errorId : undefined}
          className={`${kelasInput} pr-12 ${props.error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
        />
        <button
          type="button"
          onClick={() => setTerlihat((nilai) => !nilai)}
          aria-label={terlihat ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={terlihat}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {terlihat ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {props.error && <p id={errorId} role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{props.error}</p>}
    </div>
  )
}
