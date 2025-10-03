import BalanceCard from "./components/dashboard/BalanceCard";
import QuickActions from "./components/dashboard/QuickActions";
import TransactionList from "./components/dashboard/TransactionList";

export default function DashboardPage() {
  return (
    <main className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <BalanceCard />
      <QuickActions />
      <TransactionList />
    </main>
  );
}
