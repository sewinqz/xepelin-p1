import { useState, useEffect } from 'react'
import { getOperationsFn, updateTasaFn, Operation } from '../services/sheetsService'

export default function TasaEditor() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successId, setSuccessId] = useState<number | null>(null)

  useEffect(() => {
    getOperationsFn()
      .then(({ data }) => setOperations(data.operations))
      .catch(() => setFetchError('Could not load operations. Check the function logs.'))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(op: Operation) {
    setEditingId(op.idOp)
    setEditValue(String(op.tasa))
    setSaveError('')
    setSuccessId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
    setSaveError('')
  }

  async function save(idOp: number) {
    const tasa = parseFloat(editValue)
    if (isNaN(tasa)) {
      setSaveError('Enter a valid number')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await updateTasaFn({ idOp, tasa })
      setOperations((ops) =>
        ops.map((op) => (op.idOp === idOp ? { ...op, tasa } : op))
      )
      setEditingId(null)
      setSuccessId(idOp)
      setTimeout(() => setSuccessId(null), 3000)
    } catch {
      setSaveError('Failed to update. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="sheet-section">
        <h3 className="section-title">Operations</h3>
        <div className="tasa-loading">
          <div className="spinner" style={{ width: 24, height: 24 }} />
          <span>Loading operations…</span>
        </div>
      </section>
    )
  }

  if (fetchError) {
    return (
      <section className="sheet-section">
        <h3 className="section-title">Operations</h3>
        <p className="error-msg">{fetchError}</p>
      </section>
    )
  }

  return (
    <section className="sheet-section">
      <h3 className="section-title">Operations</h3>
      <p className="section-desc">
        Select an operation and edit its rate. Changes are saved directly to the sheet.
      </p>

      {saveError && <p className="error-msg" style={{ marginBottom: 16 }}>{saveError}</p>}

      <div className="tasa-table-wrapper">
        <table className="tasa-table">
          <thead>
            <tr>
              <th>ID Op</th>
              <th>Tasa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => {
              const isEditing = editingId === op.idOp
              const isSuccess = successId === op.idOp
              return (
                <tr key={op.idOp} className={isSuccess ? 'row-success' : ''}>
                  <td>{op.idOp}</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="tasa-input"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') save(op.idOp)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                    ) : (
                      op.tasa
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <span className="row-actions">
                        <button
                          className="btn-save"
                          onClick={() => save(op.idOp)}
                          disabled={saving}
                        >
                          {saving ? '…' : 'Save'}
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        className="btn-edit"
                        onClick={() => startEdit(op)}
                        disabled={editingId !== null}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
