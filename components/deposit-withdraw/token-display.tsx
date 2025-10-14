export function TokenDisplay() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-fit">
      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
        $
      </div>
      <span className="text-white font-medium">USDC</span>
    </div>
  )
}
