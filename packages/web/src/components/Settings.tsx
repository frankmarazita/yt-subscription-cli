import { useState } from 'react';
import { useConfigStore } from '../store/configStore';
import { reinitializeClients } from '../services/client';
import { queryClient } from '../queryClient';

export function Settings() {
  const { hosts, activeHostIndex, addHost, removeHost, setActiveHost } = useConfigStore();
  const [newUrl, setNewUrl] = useState('');

  function handleSetActive(index: number) {
    if (index === activeHostIndex) return;
    setActiveHost(index);
    reinitializeClients();
    queryClient.clear();
  }

  function handleAdd() {
    const url = newUrl.trim();
    if (!url) return;
    addHost(url);
    setNewUrl('');
  }

  function handleRemove(index: number) {
    if (hosts.length === 1) return;
    removeHost(index);
    reinitializeClients();
    queryClient.clear();
  }

  return (
    <div className="p-4">
      <div className="text-[11px] font-semibold text-[#888] uppercase tracking-[0.8px] mb-2.5">Hosts</div>
      <div className="flex flex-col gap-2 mb-4">
        {hosts.map((host, index) => {
          const isActive = index === activeHostIndex;
          return (
            <div
              key={index}
              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer [-webkit-tap-highlight-color:transparent] active:bg-[#ebebeb] ${isActive ? 'bg-[#e3f2fd]' : 'bg-[#f5f5f5]'}`}
              onClick={() => handleSetActive(index)}
            >
              <span className={`flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap ${isActive ? 'text-[#2196f3] font-medium' : 'text-[#333]'}`}>
                {host}
              </span>
              {isActive && <span className="text-[#2196f3] font-semibold">✓</span>}
              {hosts.length > 1 && (
                <button
                  className="border-none bg-transparent text-red-500 text-sm cursor-pointer p-1 leading-none"
                  onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-[#ddd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2196f3]"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="http://192.168.1.x:3000"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          className="bg-[#2196f3] text-white border-none rounded-lg px-[18px] text-[22px] cursor-pointer active:bg-[#1976d2]"
          onClick={handleAdd}
        >
          +
        </button>
      </div>
    </div>
  );
}
