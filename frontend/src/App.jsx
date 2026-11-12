
import { useState, useEffect, useCallback } from 'react'
import './App.css'

import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  issueEquipment,
  returnEquipment,
} from './api/equipmentApi'

// Navigation items
const navigation = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Equipment', icon: '▤' },
  { name: 'Allocations', icon: '⇄' },
]

// Empty equipment form
const emptyForm = {
  name: '',
  category: '',
  lab: '',
  condition: 'Good',
  status: 'Available',
}

// Convert a date into YYYY-MM-DD using local calendar values
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Format a date stored by MongoDB
function formatDate(dateValue) {
  if (!dateValue) return 'Not available'

  const dateString = String(dateValue).slice(0, 10)
  const [year, month, day] = dateString.split('-')

  if (!year || !month || !day) return 'Invalid date'

  return `${day}/${month}/${year}`
}

// Check whether equipment is overdue
function isOverdue(item) {
  if (item.status !== 'Issued' || !item.expectedReturnDate) {
    return false
  }

  const dueDate = String(item.expectedReturnDate).slice(0, 10)
  const today = getLocalDateString()

  return dueDate < today
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  // Equipment records retrieved from MongoDB
  const [equipment, setEquipment] = useState([])

  // Add/edit form state
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  // Issue equipment form state
  const [selectedForIssue, setSelectedForIssue] = useState(null)

  const [issueForm, setIssueForm] = useState({
    issuedTo: '',
    expectedReturnDate: '',
  })

  // Loading and feedback states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allocationSaving, setAllocationSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Minimum return date: tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minReturnDate = getLocalDateString(tomorrow)

  // Dashboard statistics
  const available = equipment.filter(
    item => item.status === 'Available'
  ).length

  const issued = equipment.filter(
    item => item.status === 'Issued'
  ).length

  const maintenance = equipment.filter(
    item => item.status === 'Maintenance'
  ).length

  const overdueCount = equipment.filter(isOverdue).length

  // Active allocations
  const activeAllocations = equipment.filter(
    item => item.status === 'Issued'
  )

  // Fetch equipment from the backend
  const fetchEquipment = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }

      setError('')

      const response = await getEquipment()

      setEquipment(
        Array.isArray(response.data) ? response.data : []
      )
    } catch (err) {
      console.error('Error fetching equipment:', err)

      setError(
        err.response?.data?.message ||
        'Unable to load equipment. Please check your backend connection.'
      )
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch records when the application first loads
  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  // Handle add/edit form changes
  function handleChange(event) {
    const { name, value } = event.target

    setFormData(previous => ({
      ...previous,
      [name]: value,
    }))
  }

  // Add or update equipment in MongoDB
  async function handleSubmit(event) {
    event.preventDefault()

    if (!formData.name.trim() ||
        !formData.category.trim() ||
        !formData.lab.trim()) {
      setError('Please complete all required fields.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const cleanedData = {
        ...formData,
        name: formData.name.trim(),
        category: formData.category.trim(),
        lab: formData.lab.trim(),
      }

      if (editingId) {
        await updateEquipment(editingId, cleanedData)
        setSuccess('Equipment updated successfully.')
      } else {
        await createEquipment(cleanedData)
        setSuccess('Equipment added successfully.')
      }

      await fetchEquipment(false)

      resetForm()
      setActivePage('Equipment')
    } catch (err) {
      console.error('Error saving equipment:', err)

      setError(
        err.response?.data?.message ||
        'Unable to save equipment. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Load an equipment record into the edit form
  function handleEdit(item) {
    setFormData({
      name: item.name || '',
      category: item.category || '',
      lab: item.lab || '',
      condition: item.condition || 'Good',
      status: item.status || 'Available',
    })

    setEditingId(item._id)
    setError('')
    setSuccess('')
    setActivePage('Edit Equipment')
  }

  // Delete equipment from MongoDB
  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this equipment?'
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await deleteEquipment(id)
      await fetchEquipment(false)

      setSuccess('Equipment deleted successfully.')
    } catch (err) {
      console.error('Error deleting equipment:', err)

      setError(
        err.response?.data?.message ||
        'Unable to delete equipment. Please try again.'
      )
    }
  }

  // Open the issue equipment form
  function handleStartIssue(item) {
    if (item.status !== 'Available' || item.condition !== 'Good') {
      setError('Only available equipment in good condition can be issued.')
      return
    }

    setSelectedForIssue(item)

    setIssueForm({
      issuedTo: '',
      expectedReturnDate: '',
    })

    setError('')
    setSuccess('')
    setActivePage('Issue Equipment')
  }

  // Handle issue form changes
  function handleIssueChange(event) {
    const { name, value } = event.target

    setIssueForm(previous => ({
      ...previous,
      [name]: value,
    }))
  }

  // Issue equipment to a borrower
  async function handleIssueSubmit(event) {
    event.preventDefault()

    if (!selectedForIssue) {
      setError('Please select equipment to issue.')
      return
    }

    const borrower = issueForm.issuedTo.trim()
    const returnDate = issueForm.expectedReturnDate

    if (!borrower || !returnDate) {
      setError('Please enter the borrower name and return date.')
      return
    }

    if (returnDate <= getLocalDateString()) {
      setError('Expected return date must be a future date.')
      return
    }

    try {
      setAllocationSaving(true)
      setError('')
      setSuccess('')

      await issueEquipment(selectedForIssue._id, {
        issuedTo: borrower,
        expectedReturnDate: returnDate,
      })

      await fetchEquipment(false)

      setSelectedForIssue(null)
      setIssueForm({
        issuedTo: '',
        expectedReturnDate: '',
      })

      setSuccess('Equipment issued successfully.')
      setActivePage('Allocations')
    } catch (err) {
      console.error('Error issuing equipment:', err)

      setError(
        err.response?.data?.message ||
        'Unable to issue equipment. Please try again.'
      )
    } finally {
      setAllocationSaving(false)
    }
  }

  // Return issued equipment
  async function handleReturn(item) {
    const confirmed = window.confirm(
      `Record the return of "${item.name}" from ${item.issuedTo}?`
    )

    if (!confirmed) return

    try {
      setAllocationSaving(true)
      setError('')
      setSuccess('')

      await returnEquipment(item._id)
      await fetchEquipment(false)

      setSuccess(`${item.name} has been returned successfully.`)
    } catch (err) {
      console.error('Error returning equipment:', err)

      setError(
        err.response?.data?.message ||
        'Unable to record the equipment return. Please try again.'
      )
    } finally {
      setAllocationSaving(false)
    }
  }

  // Reset add/edit form
  function resetForm() {
    setFormData(emptyForm)
    setEditingId(null)
  }

  // Cancel add/edit form
  function cancelForm() {
    resetForm()
    setError('')
    setSuccess('')
    setActivePage('Equipment')
  }

  // Cancel issue form
  function cancelIssue() {
    setSelectedForIssue(null)
    setIssueForm({
      issuedTo: '',
      expectedReturnDate: '',
    })

    setError('')
    setSuccess('')
    setActivePage('Equipment')
  }

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">L</div>

          <div>
            <h2>LabTrack</h2>
            <span>Laboratory Management</span>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav>
          {navigation.map(item => (
            <button
              key={item.name}
              className={`nav-link ${
                activePage === item.name ||
                (
                  activePage.includes('Equipment') &&
                  item.name === 'Equipment'
                )
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                resetForm()
                setSelectedForIssue(null)
                setError('')
                setSuccess('')
                setActivePage(item.name)
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">A</div>

          <div>
            <strong>Administrator</strong>
            <span>Lab Manager</span>
          </div>
        </div>

      </aside>

      {/* Main content */}
      <main className="main-content">

        {/* Header */}
        <header className="topbar">

          <div>
            <p className="breadcrumb">
              Workspace / {activePage}
            </p>

            <h1>{activePage}</h1>
          </div>

          <div className="topbar-right">
            <span className="online-dot"></span>
            <span>System online</span>
          </div>

        </header>

        {/* Feedback messages */}
        {loading && (
          <p>Loading equipment from database...</p>
        )}

        {error && (
          <p style={{ color: '#ff6b6b' }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ color: '#22c55e' }}>
            {success}
          </p>
        )}

        {/* Dashboard */}
        {activePage === 'Dashboard' && !loading && (

          <section>

            <div className="welcome">
              <h2>Welcome back, Administrator</h2>
              <p>
                Here's what's happening in your laboratories today.
              </p>
            </div>

            {/* Statistics */}
            <div className="stats-grid">

              <StatCard
                label="Total Equipment"
                value={equipment.length}
                icon="▤"
              />

              <StatCard
                label="Available"
                value={available}
                icon="✓"
              />

              <StatCard
                label="Currently Issued"
                value={issued}
                icon="⇄"
              />

              <StatCard
                label="Under Maintenance"
                value={maintenance}
                icon="⚙"
              />

              <StatCard
                label="Overdue"
                value={overdueCount}
                icon="!"
              />

            </div>

            {/* Recent equipment */}
            <div className="panel">
              <EquipmentTable
                equipment={equipment.slice(0, 5)}
              />
            </div>

          </section>
        )}

        {/* Equipment inventory */}
        {activePage === 'Equipment' && (

          <section className="panel">

            <div className="panel-heading">

              <div>
                <h2>Equipment Inventory</h2>
                <p>
                  View and manage laboratory equipment.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  resetForm()
                  setError('')
                  setSuccess('')
                  setActivePage('Add Equipment')
                }}
              >
                + Add Equipment
              </button>

            </div>

            {!loading && (
              <EquipmentTable
                equipment={equipment}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onIssue={handleStartIssue}
                onReturn={handleReturn}
              />
            )}

          </section>
        )}

        {/* Add and edit equipment form */}
        {(activePage === 'Add Equipment' ||
          activePage === 'Edit Equipment') && (

          <section className="panel form-panel">

            <div className="panel-heading">
              <div>
                <h2>
                  {editingId
                    ? 'Edit Equipment'
                    : 'Add New Equipment'}
                </h2>

                <p>
                  Enter the details of your laboratory equipment.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                <label>
                  Equipment Name

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Arduino Uno"
                    required
                  />
                </label>

                <label>
                  Category

                  <input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Microcontroller"
                    required
                  />
                </label>

                <label>
                  Laboratory

                  <input
                    name="lab"
                    value={formData.lab}
                    onChange={handleChange}
                    placeholder="e.g. IoT Lab"
                    required
                  />
                </label>

                <label>
                  Condition

                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                  >
                    <option value="Good">Good</option>
                    <option value="Needs repair">
                      Needs repair
                    </option>
                  </select>
                </label>

                <label>
                  Status

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={Boolean(editingId && formData.status === 'Issued')}
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                    {editingId && formData.status === 'Issued' && (
                      <option value="Issued">Issued</option>
                    )}
                  </select>

                  {editingId && formData.status === 'Issued' && (
                    <small>
                      Use the Allocations page to return issued equipment.
                    </small>
                  )}
                </label>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Equipment'
                      : 'Save Equipment'}
                </button>

              </div>

            </form>

          </section>
        )}

        {/* Issue equipment form */}
        {activePage === 'Issue Equipment' && selectedForIssue && (

          <section className="panel form-panel">

            <div className="panel-heading">
              <div>
                <h2>Issue Equipment</h2>
                <p>
                  Enter the borrower and expected return date.
                </p>
              </div>
            </div>

            <div className="welcome">
              <h3>{selectedForIssue.name}</h3>
              <p>
                {selectedForIssue.category} · {selectedForIssue.lab}
              </p>
            </div>

            <form onSubmit={handleIssueSubmit}>

              <div className="form-grid">

                <label>
                  Borrower Name

                  <input
                    name="issuedTo"
                    value={issueForm.issuedTo}
                    onChange={handleIssueChange}
                    placeholder="e.g. Rahul Sharma"
                    required
                    maxLength={100}
                  />
                </label>

                <label>
                  Expected Return Date

                  <input
                    type="date"
                    name="expectedReturnDate"
                    value={issueForm.expectedReturnDate}
                    onChange={handleIssueChange}
                    min={minReturnDate}
                    required
                  />
                </label>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelIssue}
                  disabled={allocationSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={allocationSaving}
                >
                  {allocationSaving
                    ? 'Issuing...'
                    : 'Confirm Issue'}
                </button>

              </div>

            </form>

          </section>
        )}

        {/* Allocations page */}
        {activePage === 'Allocations' && (

          <section className="panel">

            <div className="panel-heading">

              <div>
                <h2>Equipment Allocations</h2>
                <p>
                  Track equipment currently issued to borrowers.
                </p>
              </div>

              <span className="record-count">
                {activeAllocations.length} active allocations
              </span>

            </div>

            <div className="stats-grid">
              <StatCard
                label="Active Allocations"
                value={activeAllocations.length}
                icon="⇄"
              />

              <StatCard
                label="Overdue Returns"
                value={overdueCount}
                icon="!"
              />
            </div>

            <div className="table-scroll">

              <table>

                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Borrower</th>
                    <th>Laboratory</th>
                    <th>Issued On</th>
                    <th>Expected Return</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {activeAllocations.length === 0 ? (

                    <tr>
                      <td colSpan={7}>
                        No active allocations found.
                      </td>
                    </tr>

                  ) : (

                    activeAllocations.map(item => (

                      <tr key={item._id}>

                        <td>
                          <strong>{item.name}</strong>
                        </td>

                        <td>{item.issuedTo || 'Not available'}</td>

                        <td>{item.lab}</td>

                        <td>{formatDate(item.issuedAt)}</td>

                        <td>{formatDate(item.expectedReturnDate)}</td>

                        <td>
                          {isOverdue(item) ? (
                            <span className="status overdue">
                              Overdue
                            </span>
                          ) : (
                            <span className="status issued">
                              Issued
                            </span>
                          )}
                        </td>

                        <td>
                          <button
                            className="primary-button"
                            onClick={() => handleReturn(item)}
                            disabled={allocationSaving}
                          >
                            Record Return
                          </button>
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

      </main>

    </div>
  )
}

// Dashboard statistic card
function StatCard({ label, value, icon }) {
  return (

    <div className="stat-card">

      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>

      <strong>{value}</strong>

      <small>In your inventory</small>

    </div>

  )
}

// Equipment table with search and filters
function EquipmentTable({
  equipment,
  onEdit,
  onDelete,
  onIssue,
  onReturn,
}) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Get available categories dynamically
  const categories = [
    ...new Set(equipment.map(item => item.category))
  ]

  // Apply search and filters
  const filteredEquipment = equipment.filter(item => {

    const matchesSearch =
      (item.name || '').toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      categoryFilter === 'All' ||
      item.category === categoryFilter

    const matchesStatus =
      statusFilter === 'All' ||
      item.status === statusFilter

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus
    )
  })

  function clearFilters() {
    setSearch('')
    setCategoryFilter('All')
    setStatusFilter('All')
  }

  const hasActions = Boolean(onEdit || onDelete || onIssue || onReturn)

  return (

    <div>

      {/* Table heading */}
      <div className="panel-heading">

        <div>
          <h2>Equipment Records</h2>
          <p>Overview of your laboratory assets.</p>
        </div>

        <span className="record-count">
          {filteredEquipment.length} of {equipment.length} records
        </span>

      </div>

      {/* Search and filters */}
      <div className="filter-toolbar">

        <input
          type="text"
          placeholder="Search equipment..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        <select
          value={categoryFilter}
          onChange={event => setCategoryFilter(event.target.value)}
        >
          <option value="All">All Categories</option>

          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}

        </select>

        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Issued">Issued</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        <button
          className="secondary-button"
          onClick={clearFilters}
        >
          Clear Filters
        </button>

      </div>

      {/* Equipment records */}
      <div className="table-scroll">

        <table>

          <thead>
            <tr>
              <th>Equipment</th>
              <th>Category</th>
              <th>Laboratory</th>
              <th>Condition</th>
              <th>Status</th>
              {hasActions && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>

            {filteredEquipment.length === 0 ? (

              <tr>
                <td colSpan={hasActions ? 6 : 5}>
                  No matching equipment found.
                </td>
              </tr>

            ) : (

              filteredEquipment.map(item => (

                <tr key={item._id}>

                  <td>
                    <strong>{item.name}</strong>
                    {isOverdue(item) && (
                      <small style={{ display: 'block', color: '#ff6b6b' }}>
                        Overdue return
                      </small>
                    )}
                  </td>

                  <td>{item.category}</td>

                  <td>{item.lab}</td>

                  <td>{item.condition}</td>

                  <td>
                    {isOverdue(item) ? (
                      <span className="status overdue">
                        Overdue
                      </span>
                    ) : (
                      <span
                        className={`status ${(item.status || '').toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    )}
                  </td>

                  {hasActions && (

                    <td>

                      <div className="action-buttons">

                        {onIssue &&
                          item.status === 'Available' &&
                          item.condition === 'Good' && (
                            <button
                              className="edit-button"
                              onClick={() => onIssue(item)}
                            >
                              Issue
                            </button>
                          )}

                        {onReturn && item.status === 'Issued' && (
                          <button
                            className="primary-button"
                            onClick={() => onReturn(item)}
                          >
                            Return
                          </button>
                        )}

                        {onEdit && (
                          <button
                            className="edit-button"
                            onClick={() => onEdit(item)}
                          >
                            Edit
                          </button>
                        )}

                        {onDelete && item.status !== 'Issued' && (
                          <button
                            className="delete-button"
                            onClick={() => onDelete(item._id)}
                          >
                            Delete
                          </button>
                        )}

                      </div>

                    </td>

                  )}

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>

  )
}

export default App
