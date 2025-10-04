import { StatusIndicator } from "@/components/payments/StatusIndicator"

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-[#1E1B3D] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-white">Payment status</h1>
        </div>

        {/* Status Indicator */}
        <StatusIndicator />
      </div>
    </div>
  )
}
