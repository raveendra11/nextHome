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
const toVacancyForm = (vacancy) => ({
  title: vacancy?.title || '',
  description: vacancy?.description || '',
  roomType: vacancy?.roomType || '',
  rent: vacancy?.rent != null ? String(vacancy.rent) : '',
  city: vacancy?.city || '',
  address: vacancy?.address || '',
  createdBy: vacancy?.createdBy || '',
})

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

      const createdId = payload && payload.vacancy ? Number(payload.vacancy.id) : NaN
      setMessage('Vacancy posted successfully.')
      setVacancyId(Number.isInteger(createdId) && createdId > 0 ? String(createdId) : '')
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
          {vacancyId && <p className="ok-message">Vacancy ID: <strong>{vacancyId}</strong></p>}
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

function ViewVacancies({ onBack }) {
  const [vacancies, setVacancies] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeVacancyId, setActiveVacancyId] = useState(null)
  const [managementToken, setManagementToken] = useState('')
  const [editForm, setEditForm] = useState(initialForm)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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

  const editRent = Number(editForm.rent)
  const hasValidRent = Number.isFinite(editRent) && editRent > 0
  const canUpdate =
    activeVacancyId != null &&
    managementToken.trim().length > 0 &&
    editForm.title.trim().length > 0 &&
    editForm.description.trim().length > 0 &&
    editForm.roomType.trim().length > 0 &&
    editForm.city.trim().length > 0 &&
    editForm.createdBy.trim().length > 0 &&
    hasValidRent
  const canDelete = activeVacancyId != null && managementToken.trim().length > 0

  const startManage = (vacancy) => {
    const enteredToken = window.prompt('Enter management token to modify/delete this vacancy.')
    if (enteredToken == null) {
      return
    }
    const trimmedToken = enteredToken.trim()
    if (!trimmedToken) {
      setError('Management token is required.')
      setMessage('')
      return
    }
    setActiveVacancyId(vacancy.id)
    setManagementToken(trimmedToken)
    setEditForm(toVacancyForm(vacancy))
    setError('')
    setMessage('Token captured. You can now update or delete this vacancy.')
  }

  const updateEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const submitUpdate = async (event) => {
    event.preventDefault()
    if (!canUpdate) {
      setError(hasValidRent ? 'Please fill all required fields.' : 'Rent must be a valid positive number.')
      setMessage('')
      return
    }

    setActionLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/vacancies/${activeVacancyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Management-Token': managementToken.trim(),
        },
        body: JSON.stringify({
          ...editForm,
          rent: editRent,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to update vacancy. Check management token.')
      }

      const updatedVacancy = await response.json()
      setVacancies((prev) =>
        prev.map((vacancy) => (vacancy.id === activeVacancyId ? updatedVacancy : vacancy)),
      )
      setMessage('Vacancy updated successfully.')
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const deleteVacancy = async () => {
    if (!canDelete) {
      setError('Management token is required to delete vacancy.')
      setMessage('')
      return
    }
    if (!window.confirm('Are you sure you want to delete this vacancy?')) {
      return
    }

    setActionLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/vacancies/${activeVacancyId}`, {
        method: 'DELETE',
        headers: {
          'X-Management-Token': managementToken.trim(),
        },
      })
      if (!response.ok) {
        throw new Error('Unable to delete vacancy. Check management token.')
      }
      setVacancies((prev) => prev.filter((vacancy) => vacancy.id !== activeVacancyId))
      setActiveVacancyId(null)
      setManagementToken('')
      setEditForm(initialForm)
      setMessage('Vacancy deleted successfully.')
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setActionLoading(false)
    }
  }

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
      {message && <p className="ok-message">{message}</p>}

      <div className="vacancy-list">
        {visibleVacancies.map((vacancy) => (
          <article className="card vacancy-card" key={vacancy.id}>
            <div className="vacancy-card-header">
              <h3>{vacancy.title}</h3>
              <button type="button" className="manage-card-button" onClick={() => startManage(vacancy)}>
                Modify / Delete
              </button>
            </div>
            <p>{vacancy.description}</p>
            <p><strong>Room Type:</strong> {vacancy.roomType}</p>
            <p><strong>Rent:</strong> ₹{vacancy.rent}</p>
            <p><strong>City:</strong> {vacancy.city}</p>
            {vacancy.address && <p><strong>Address:</strong> {vacancy.address}</p>}
            <p><strong>Posted By:</strong> {vacancy.createdBy}</p>

            {activeVacancyId === vacancy.id && (
              <form className="card form-grid inline-manage-form" onSubmit={submitUpdate}>
                <input
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(event) => updateEditField('title', event.target.value)}
                />
                <textarea
                  placeholder="Description"
                  value={editForm.description}
                  onChange={(event) => updateEditField('description', event.target.value)}
                />
                <input
                  placeholder="Room Type (e.g. PRIVATE)"
                  value={editForm.roomType}
                  onChange={(event) => updateEditField('roomType', event.target.value)}
                />
                <input
                  placeholder="Rent"
                  type="number"
                  min="1"
                  value={editForm.rent}
                  onChange={(event) => updateEditField('rent', event.target.value)}
                />
                <input
                  placeholder="City"
                  value={editForm.city}
                  onChange={(event) => updateEditField('city', event.target.value)}
                />
                <input
                  placeholder="Address (optional)"
                  value={editForm.address}
                  onChange={(event) => updateEditField('address', event.target.value)}
                />
                <input
                  placeholder="Your Name"
                  value={editForm.createdBy}
                  onChange={(event) => updateEditField('createdBy', event.target.value)}
                />
                <div className="row-actions">
                  <button type="submit" disabled={!canUpdate || actionLoading}>
                    {actionLoading ? 'Saving...' : 'Update Vacancy'}
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={deleteVacancy}
                    disabled={!canDelete || actionLoading}
                  >
                    {actionLoading ? 'Working...' : 'Delete Vacancy'}
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default App
