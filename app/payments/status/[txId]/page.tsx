import { StatusIndicator } from "@/components/payments/StatusIndicator";

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}

        {/* Status Indicator */}
        <StatusIndicator />
      </div>
    </div>
  );
}
