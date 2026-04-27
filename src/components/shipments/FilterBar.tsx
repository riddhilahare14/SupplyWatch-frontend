import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterBarProps {
  filters: {
    search: string;
    status: string;
    risk: string;
    city: string;
  };
  onChange: (filters: any) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {
  const handleChange = (key: string, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({ search: '', status: 'All', risk: 'All', city: 'All' });
  };

  const isFiltered = filters.search || filters.status !== 'All' || filters.risk !== 'All' || filters.city !== 'All';

  return (
    <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur border border-slate-800 p-4 rounded-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder="Search shipment ID or carrier..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-12 pr-4 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-3">
        <FilterSelect 
          label="Status" 
          value={filters.status} 
          options={['All', 'In Transit', 'Delayed', 'Delivered']} 
          onChange={(v) => handleChange('status', v)} 
        />
        <FilterSelect 
          label="Risk" 
          value={filters.risk} 
          options={['All', 'Low', 'Medium', 'High']} 
          onChange={(v) => handleChange('risk', v)} 
        />
        <FilterSelect 
          label="City" 
          value={filters.city} 
          options={['All', 'Mumbai', 'Delhi', 'Chennai', 'Bangalore', 'Hyderabad']} 
          onChange={(v) => handleChange('city', v)} 
        />
      </div>

      {isFiltered && (
        <button 
          onClick={clearFilters}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
        >
          <X size={14} />
          CLEAR
        </button>
      )}
    </div>
  );
};

const FilterSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}:</span>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors cursor-pointer"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default FilterBar;
