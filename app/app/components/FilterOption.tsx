interface FilterOptionProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function FilterOption({ label, active, onClick }: FilterOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors min-h-[48px] flex items-center justify-between ${
        active
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span>{label}</span>
      {active && (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
