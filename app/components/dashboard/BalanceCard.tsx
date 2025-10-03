import { profile } from "../../lib/mockData";

export default function BalanceCard() {
  return (
    <div className="bg-gradient-to-b from-purple-600 to-indigo-800 text-white p-6 rounded-2xl shadow-md text-center">
      <h2 className="text-sm opacity-80 mb-2">Saldo</h2>
      <p className="text-4xl font-bold">
        {profile.balance.toLocaleString("it-IT", {
          style: "currency",
          currency: profile.currency,
        })}
      </p>
    </div>
  );
}
