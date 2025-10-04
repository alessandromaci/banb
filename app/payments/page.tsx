import { ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/payments/SearchBar";
import { PaymentOptions } from "@/components/payments/PaymentOptions";
import { FriendList } from "@/components/payments/FriendList";

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-[#1E1B3D] text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 text-white hover:bg-white/10"
          >
            <QrCode className="h-6 w-6" />
          </Button>
        </div>

        {/* Title */}
        <div className="px-6 mb-6">
          <h1 className="text-3xl font-bold text-white">New payment</h1>
        </div>

        {/* Search */}
        <div className="px-6 mb-6">
          <SearchBar placeholder="Name, @Revtag, phone, email" />
        </div>

        {/* Payment Options */}
        <div className="px-6 mb-8">
          <PaymentOptions />
        </div>

        {/* Friends List */}
        <div className="px-6 pb-24">
          <div className="mb-4">
            <h2 className="text-white/80 text-sm font-medium">Friends · 3</h2>
          </div>
          <FriendList />
        </div>
      </div>
    </div>
  );
}
