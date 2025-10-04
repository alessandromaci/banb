import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RecipientForm } from "@/components/payments/RecipientForm"

export default function BankPaymentPage() {
  return (
    <div className="min-h-screen bg-[#1E1B3D] text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center px-6 py-4">
          <Link href="/payments">
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="px-6 mb-8">
          <h1 className="text-3xl font-bold text-white">Add recipient</h1>
        </div>

        {/* Form */}
        <div className="px-6 pb-24">
          <RecipientForm type="bank" />
        </div>
      </div>
    </div>
  )
}
