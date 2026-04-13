import { useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const initialForm = {
  title: '',
  description: '',
  roomType: '',
  rent: '',
  address: '',
  createdBy: '',
}

function App() {
  const [activeView, setActiveView] = useState('home')

  return (
    <main className="app-shell">
      {activeView === 'home' && <Home onSelect={setActiveView} />}
      {activeView === 'post' && <PostVacancy onBack={() => setActiveView('home')} />}
      {activeView === 'view' && <ViewVacancies onBack={() => setActiveView('home')} />}
    </main>
  )
}

function Home({ onSelect }) {
  return (
    <section className="home-screen">
      <h1>Find your next home nearby</h1>
      <div className="home-actions">
        <button type="button" className="home-action" onClick={() => onSelect('post')}>
          Post Vacancy
        </button>
        <button type="button" className="home-action" onClick={() => onSelect('view')}>
          View Vacancy
        </button>
      </div>
    </section>
  )
}

function PostVacancy({ onBack }) {
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const numericValues = useMemo(
    () => ({
      rent: Number(form.rent),
    }),
    [form.rent],
  )

  const numericValidationError = useMemo(() => {
    if (!Number.isFinite(numericValues.rent) || numericValues.rent <= 0) {
      return 'Rent must be a valid positive number.'
    }

    return ''
  }, [numericValues])

  const canSubmit = useMemo(
    () => Object.values(form).every((value) => String(value).trim().length > 0) && !numericValidationError,
    [form, numericValidationError],
  )

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!canSubmit) {
      if (numericValidationError) {
        setError(numericValidationError)
      }
      return
    }

    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/vacancies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rent: numericValues.rent,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to post vacancy. Please verify the details and try again.')
      }

      setMessage('Vacancy posted successfully.')
      setForm(initialForm)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="screen">
      <button className="back-button" onClick={onBack} type="button">Back</button>
      <h2>Post Vacancy</h2>
      <form className="card form-grid" onSubmit={submit}>
        <input placeholder="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
        <input placeholder="Room Type (e.g. PRIVATE)" value={form.roomType} onChange={(e) => updateField('roomType', e.target.value)} />
        <input placeholder="Rent" type="number" min="1" value={form.rent} onChange={(e) => updateField('rent', e.target.value)} />
        <input placeholder="Address" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
        <input placeholder="Your Name" value={form.createdBy} onChange={(e) => updateField('createdBy', e.target.value)} />
        <button type="submit" disabled={!canSubmit || isLoading}>{isLoading ? 'Posting...' : 'Submit Vacancy'}</button>
      </form>
      {message && <p className="ok-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </section>
  )
}

function ViewVacancies({ onBack }) {
  const [vacancies, setVacancies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadVacancies = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/vacancies`)
      if (!response.ok) {
        throw new Error('Unable to fetch vacancies.')
      }

      const data = await response.json()
      setVacancies(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="screen">
      <button className="back-button" onClick={onBack} type="button">Back</button>
      <h2>View Vacancy</h2>
      <div className="card filters">
        <div className="row-actions">
          <button type="button" onClick={loadVacancies}>Load Vacancies</button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="vacancy-list">
        {vacancies.map((vacancy) => (
          <article className="card vacancy-card" key={vacancy.id}>
            <h3>{vacancy.title}</h3>
            <p>{vacancy.description}</p>
            <p><strong>Room Type:</strong> {vacancy.roomType}</p>
            <p><strong>Rent:</strong> ₹{vacancy.rent}</p>
            <p><strong>Address:</strong> {vacancy.address}</p>
            <p><strong>Posted By:</strong> {vacancy.createdBy}</p>
            {typeof vacancy.distanceKm === 'number' && <p><strong>Distance:</strong> {vacancy.distanceKm.toFixed(2)} km</p>}
          </article>
        ))}
      </div>
    </section>
  )
}

export default App
