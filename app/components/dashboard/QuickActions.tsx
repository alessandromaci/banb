import { Plus, ArrowDown, Info, MoreHorizontal } from "lucide-react";

export default function QuickActions() {
  const actions = [
    { label: "Aggiungi fondi", icon: <Plus size={20} /> },
    { label: "Preleva", icon: <ArrowDown size={20} /> },
    { label: "Info", icon: <Info size={20} /> },
    { label: "Altro", icon: <MoreHorizontal size={20} /> },
  ];

  return (
    <div className="flex justify-around text-sm text-gray-600 mt-4">
      {actions.map((a, idx) => (
        <button
          key={idx}
          className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100"
        >
          <span className="bg-gray-200 p-3 rounded-full">{a.icon}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
