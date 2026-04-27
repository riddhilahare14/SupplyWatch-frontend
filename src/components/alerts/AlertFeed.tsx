import React from 'react';
import { useSupplyStore } from '../../store/useSupplyStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient, isMockMode } from '../../api/client';
import { MOCK_REROUTES } from '../../mocks/mockData';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface AlertFeedProps {
  onSelectReroute: (id: string) => void;
  selectedId: string | null;
}

const AlertFeed: React.FC<AlertFeedProps> = ({ onSelectReroute, selectedId }) => {
  const { pendingReroutes, setPendingReroutes } = useSupplyStore();

  const { data: initialReroutes } = useQuery({
    queryKey: ['reroutes'],
    queryFn: async () => {
      if (isMockMode) return MOCK_REROUTES;
      const res = await apiClient.get('/reroutes');
      return res.data;
    },
    staleTime: Infinity,
  });

  React.useEffect(() => {
    if (initialReroutes) setPendingReroutes(initialReroutes);
  }, [initialReroutes, setPendingReroutes]);

  const sections = [
    { 
      title: 'Requires Action', 
      items: pendingReroutes.filter(r => r.status === 'pending'),
      icon: <AlertTriangle className="text-red-400" size={14} />,
      bgColor: 'bg-red-400/5'
    },
    { 
      title: 'Auto-Resolved', 
      items: pendingReroutes.filter(r => r.status === 'auto_executed'),
      icon: <CheckCircle className="text-green-400" size={14} />,
      bgColor: 'bg-green-400/5'
    }
  ];

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <div key={section.title} className={clsx("flex flex-col", section.bgColor)}>
          <div className="px-6 py-3 flex items-center gap-2 border-b border-slate-800/50">
            {section.icon}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</span>
            <span className="ml-auto text-[10px] font-mono text-slate-500">{section.items.length}</span>
          </div>
          
          <div className="divide-y divide-slate-800/30">
            {section.items.length === 0 ? (
              <div className="px-6 py-4 text-[10px] text-slate-600 italic">No alerts in this category</div>
            ) : (
              section.items.map((r) => (
                <div 
                  key={r.id}
                  onClick={() => onSelectReroute(r.id)}
                  className={clsx(
                    "px-6 py-5 cursor-pointer transition-all hover:bg-slate-800/40 border-l-2",
                    selectedId === r.id ? "bg-slate-800/60 border-blue-500 shadow-inner" : "border-transparent"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-slate-200">{r.shipment_id}</span>
                    <span className="text-[10px] text-slate-500">{formatDistanceToNow(parseISO(r.created_at))} ago</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {r.reason}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Detour</span>
                      <span className="text-xs font-mono text-amber-400">+{r.detour_pct}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Cost Delta</span>
                      <span className="text-xs font-mono text-red-400">+{r.cost_delta_pct}%</span>
                    </div>
                    <div className="flex flex-col ml-auto">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Status</span>
                      <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded border uppercase", 
                        r.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                      )}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertFeed;
