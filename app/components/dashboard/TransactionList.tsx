import { transactions } from "../../lib/mockData";

export default function TransactionList() {
  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-semibold mb-3">Ultime transazioni</h3>
      <ul className="space-y-3">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{tx.icon}</div>
              <div>
                <p className="font-medium">{tx.title}</p>
                <p className="text-xs text-gray-500">{tx.time}</p>
              </div>
            </div>
            <p
              className={`font-semibold ${
                tx.amount < 0 ? "text-red-500" : "text-green-600"
              }`}
            >
              {tx.amount.toLocaleString("it-IT", {
                style: "currency",
                currency: tx.currency,
              })}
            </p>
          </li>
        ))}
      </ul>
      <button className="w-full text-center text-indigo-600 mt-4 text-sm font-medium">
        Visualizza tutto
      </button>
    </div>
  );
}
