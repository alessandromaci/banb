import { LandingPage } from "@/components/landing-page";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function Page() {
  return <LandingPage />;
}
