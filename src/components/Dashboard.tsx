import { signOut, User } from 'firebase/auth'
import { auth } from '../firebase'

const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL ?? ''

interface Props {
  user: User
}

export default function Dashboard({ user }: Props) {
  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">
          <span className="logo-x">X</span>
          <span className="logo-text">epelin</span>
        </div>
        <div className="dash-user">
          <span className="user-email">{user.email}</span>
          <button className="btn-logout" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-title-row">
          <h2 className="dash-title">P1 — Growth Engineer II</h2>
          <span className="dash-badge">Operations Dashboard</span>
        </div>

        <section className="sheet-section">
          <h3 className="section-title">Operations Sheet</h3>
          {SHEET_URL ? (
            <div className="sheet-wrapper">
              <iframe
                src={SHEET_URL}
                title="Operations Google Sheet"
                className="sheet-iframe"
                style={{ border: 'none' }}
                allowFullScreen
              />
            </div>
          ) : (
            <div className="sheet-placeholder">
              <p>Set <code>VITE_GOOGLE_SHEET_URL</code> in your <code>.env</code> file to embed the Google Sheet here.</p>
              <p className="placeholder-hint">Use the edit URL from your Google Sheet: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing&rm=minimal</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
