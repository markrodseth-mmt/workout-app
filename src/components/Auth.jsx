import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const fn = mode === 'signin' ? signIn : signUp
    const { error, data } = await fn(email.trim(), password)
    setBusy(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (mode === 'signup' && !data.session) {
      setMessage({ type: 'ok', text: 'Check your email to confirm your account, then sign in.' })
    }
    // On success the auth listener swaps this screen out automatically.
  }

  return (
    <main>
      <section className="card auth">
        <h2>{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
        <p className="small">Your workouts and history sync to this account across devices.</p>
        <form onSubmit={submit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button className="primary big" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        {message && (
          <p className={message.type === 'error' ? 'auth-msg error' : 'auth-msg ok'}>
            {message.text}
          </p>
        )}

        <button
          className="link"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setMessage(null)
          }}
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
      </section>
    </main>
  )
}
