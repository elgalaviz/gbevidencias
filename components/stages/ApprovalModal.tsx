'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X, CheckCircle, XCircle } from 'lucide-react'

interface ApprovalModalProps {
  stageId: string
  stageName: string
  action: 'approve' | 'reject'
  userId: string
  onClose: () => void
  onDone: (stageId: string, newStatus: string, rejectionReason?: string) => void
}

export default function ApprovalModal({
  stageId,
  stageName,
  action,
  userId,
  onClose,
  onDone,
}: ApprovalModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isApprove = action === 'approve'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isApprove && !reason.trim()) return
    setError(null)
    setLoading(true)

    try {
      const update: any = {
        status: isApprove ? 'approved' : 'rejected',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        rejection_reason: isApprove ? null : reason.trim(),
      }

      const { error } = await (supabase
        .from('stages') as any)
        .update(update)
        .eq('id', stageId)

      if (error) throw error
      onDone(stageId, update.status, update.rejection_reason)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {isApprove ? 'Aprobar Etapa' : 'Rechazar Etapa'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl ${isApprove ? 'bg-green-50' : 'bg-red-50'}`}>
            {isApprove
              ? <CheckCircle className="text-green-500 shrink-0" size={24} />
              : <XCircle className="text-red-500 shrink-0" size={24} />
            }
            <div>
              <p className="font-semibold text-gray-800 text-sm">{stageName}</p>
              <p className={`text-xs mt-0.5 ${isApprove ? 'text-green-600' : 'text-red-600'}`}>
                {isApprove
                  ? 'Esta acción marcará la etapa como aprobada'
                  : 'Esta acción marcará la etapa como rechazada'
                }
              </p>
            </div>
          </div>

          {!isApprove && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo del rechazo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input resize-none"
                rows={3}
                required
                placeholder="Describe por qué se rechaza esta etapa..."
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1" disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className={`btn flex-1 ${isApprove ? 'btn-success' : 'btn-danger'}`}
              disabled={loading || (!isApprove && !reason.trim())}
            >
              {loading ? 'Procesando...' : isApprove ? 'Aprobar' : 'Rechazar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
