"use client";

import { Delete } from "lucide-react";

interface NumberPadProps {
  onNumberClick: (num: string) => void;
  onBackspace: () => void;
}

export function NumberPad({ onNumberClick, onBackspace }: NumberPadProps) {
  const buttons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "back"],
  ];

  return (
    <div className="w-full max-w-sm mx-auto px-6 pb-4">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {buttons.map((row, rowIndex) =>
          row.map((btn, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() =>
                btn === "back" ? onBackspace() : onNumberClick(btn)
              }
              className="h-12 sm:h-14 max-h-[50px]:h-10 flex items-center justify-center text-white text-xl sm:text-2xl font-light hover:bg-white/5 active:bg-white/10 rounded-xl transition-colors"
            >
              {btn === "back" ? (
                <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                btn
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
