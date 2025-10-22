import { BankingHome } from "@/components/banking-home"

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <BankingHome />
}
