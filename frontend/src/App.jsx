import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083'

const initialForm = {
  title: '',
  description: '',
  roomType: '',
  rent: '',
  city: '',
  address: '',
  createdBy: '',
}

const normalizeCity = (city) => (typeof city === 'string' ? city.trim() : '')

function App() {
  const [activeView, setActiveView] = useState('home')

  return (
    <main className="app-shell">
      {activeView === 'home' && <Home onSelect={setActiveView} />}
      {activeView === 'post' && <PostVacancy onBack={() => setActiveView('home')} />}
      {activeView === 'view' && <ViewVacancies onBack={() => setActiveView('home')} />}
      {activeView === 'manage' && <ManageVacancy onBack={() => setActiveView('home')} />}
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
        <button type="button" className="home-action" onClick={() => onSelect('manage')}>
          Modify / Delete Post
        </button>
      </div>
    </section>
  )
}

function PostVacancy({ onBack }) {
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [vacancyId, setVacancyId] = useState('')
  const [managementToken, setManagementToken] = useState('')
  const [tokenCopied, setTokenCopied] = useState(false)
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

  const canSubmit = useMemo(() => {
    const requiredFieldsFilled =
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.roomType.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.createdBy.trim().length > 0
    return requiredFieldsFilled && !numericValidationError
  }, [form, numericValidationError])

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
    setManagementToken('')
    setTokenCopied(false)
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

      const payload = await response.json()

      if (!response.ok) {
        throw new Error('Unable to post vacancy. Please verify the details and try again.')
      }

      setMessage('Vacancy posted successfully.')
      setVacancyId(payload?.vacancy?.id ? String(payload.vacancy.id) : '')
      setManagementToken(payload.managementToken || '')
      setTokenCopied(false)
      setForm(initialForm)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyManagementToken = async () => {
    if (!managementToken) return
    try {
      await navigator.clipboard.writeText(managementToken)
      setTokenCopied(true)
    } catch {
      setError('Unable to copy token. Please copy it manually.')
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
        <input placeholder="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
        <input placeholder="Address (optional)" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
        <input placeholder="Your Name" value={form.createdBy} onChange={(e) => updateField('createdBy', e.target.value)} />
        <button type="submit" disabled={!canSubmit || isLoading}>{isLoading ? 'Posting...' : 'Submit Vacancy'}</button>
      </form>
      {message && <p className="ok-message">{message}</p>}
      {managementToken && (
        <>
          <p className="ok-message">Vacancy ID: <strong>{vacancyId}</strong></p>
          <p className="ok-message">Management Token: <strong>{managementToken}</strong></p>
          <p className="ok-message">Save this token safely. It is required to update or delete this vacancy later.</p>
          <button type="button" onClick={copyManagementToken}>Copy Token</button>
          {tokenCopied && <p className="ok-message">Token copied.</p>}
        </>
      )}
      {error && <p className="error-message">{error}</p>}
    </section>
  )
}

function ManageVacancy({ onBack }) {
  const [vacancyId, setVacancyId] = useState('')
  const [token, setToken] = useState('')
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const parsedId = Number(vacancyId)
  const hasValidId = Number.isInteger(parsedId) && parsedId > 0

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

  const canUpdate = useMemo(() => {
    const requiredFieldsFilled =
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.roomType.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.createdBy.trim().length > 0
    return requiredFieldsFilled && !numericValidationError && hasValidId && token.trim().length > 0
  }, [form, hasValidId, numericValidationError, token])

  const canDelete = hasValidId && token.trim().length > 0

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const loadVacancy = async () => {
    if (!hasValidId) {
      setError('Please enter a valid vacancy ID.')
      return
    }

    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/vacancies`)
      if (!response.ok) {
        throw new Error('Unable to load vacancies.')
      }
      const data = await response.json()
      const vacancy = Array.isArray(data) ? data.find((item) => Number(item.id) === parsedId) : null
      if (!vacancy) {
        throw new Error('Vacancy not found for the provided ID.')
      }
      setForm({
        title: vacancy.title || '',
        description: vacancy.description || '',
        roomType: vacancy.roomType || '',
        rent: vacancy.rent != null ? String(vacancy.rent) : '',
        city: vacancy.city || '',
        address: vacancy.address || '',
        createdBy: vacancy.createdBy || '',
      })
      setMessage('Vacancy loaded. You can now edit and update it.')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const submitUpdate = async (event) => {
    event.preventDefault()
    if (!canUpdate) {
      setError(numericValidationError || 'Please fill all required fields, vacancy ID, and token.')
      return
    }

    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/vacancies/${parsedId}?token=${encodeURIComponent(token.trim())}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rent: numericValues.rent,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to update vacancy. Check ID and management token.')
      }

      setMessage('Vacancy updated successfully.')
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteVacancy = async () => {
    if (!canDelete) {
      setError('Vacancy ID and management token are required for delete.')
      return
    }

    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/vacancies/${parsedId}?token=${encodeURIComponent(token.trim())}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Unable to delete vacancy. Check ID and management token.')
      }
      setMessage('Vacancy deleted successfully.')
      setForm(initialForm)
      setVacancyId('')
      setToken('')
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="screen">
      <button className="back-button" onClick={onBack} type="button">Back</button>
      <h2>Modify / Delete Vacancy</h2>
      <div className="card form-grid">
        <input
          placeholder="Vacancy ID"
          type="number"
          min="1"
          value={vacancyId}
          onChange={(event) => setVacancyId(event.target.value)}
        />
        <input
          placeholder="Management Token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
        <button type="button" onClick={loadVacancy} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load Vacancy by ID'}
        </button>
      </div>

      <form className="card form-grid" onSubmit={submitUpdate}>
        <input placeholder="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
        <input placeholder="Room Type (e.g. PRIVATE)" value={form.roomType} onChange={(e) => updateField('roomType', e.target.value)} />
        <input placeholder="Rent" type="number" min="1" value={form.rent} onChange={(e) => updateField('rent', e.target.value)} />
        <input placeholder="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
        <input placeholder="Address (optional)" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
        <input placeholder="Your Name" value={form.createdBy} onChange={(e) => updateField('createdBy', e.target.value)} />
        <div className="row-actions">
          <button type="submit" disabled={!canUpdate || isLoading}>
            {isLoading ? 'Saving...' : 'Update Vacancy'}
          </button>
          <button type="button" className="danger-button" onClick={deleteVacancy} disabled={!canDelete || isLoading}>
            {isLoading ? 'Working...' : 'Delete Vacancy'}
          </button>
        </div>
      </form>

      {message && <p className="ok-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </section>
  )
}

function ViewVacancies({ onBack }) {
  const [vacancies, setVacancies] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
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

    loadVacancies()
  }, [])

  const cityOptions = useMemo(() => {
    const normalizedCities = vacancies.map((vacancy) => normalizeCity(vacancy.city))
    const uniqueCities = new Set()
    normalizedCities.forEach((trimmedCity) => {
      if (trimmedCity) {
        uniqueCities.add(trimmedCity)
      }
    })
    return Array.from(uniqueCities).sort()
  }, [vacancies])

  const visibleVacancies = useMemo(() => {
    if (!selectedCity) {
      return vacancies
    }
    return vacancies.filter((vacancy) => normalizeCity(vacancy.city) === selectedCity)
  }, [vacancies, selectedCity])

  return (
    <section className="screen">
      <button className="back-button" onClick={onBack} type="button">Back</button>
      <h2>View Vacancy</h2>
      <div className="card filters">
        <select value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)}>
          <option value="">All cities</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="vacancy-list">
        {visibleVacancies.map((vacancy) => (
          <article className="card vacancy-card" key={vacancy.id}>
            <h3>{vacancy.title}</h3>
            <p>{vacancy.description}</p>
            <p><strong>Room Type:</strong> {vacancy.roomType}</p>
            <p><strong>Rent:</strong> ₹{vacancy.rent}</p>
            <p><strong>City:</strong> {vacancy.city}</p>
            {vacancy.address && <p><strong>Address:</strong> {vacancy.address}</p>}
            <p><strong>Posted By:</strong> {vacancy.createdBy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default App
