import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast } = useApp()

  if (!toast) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] animate-slide-up">
      <div className={`px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
        toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}>
        {toast.message}
      </div>
    </div>
  )
}
