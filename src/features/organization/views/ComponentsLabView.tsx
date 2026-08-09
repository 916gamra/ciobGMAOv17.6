import React from 'react';
import { PartsCatalogLabView } from './PartsCatalogLabView';

interface ComponentsLabViewProps {
  user?: any;
  tabId?: string;
}

export function ComponentsLabView({ user, tabId }: ComponentsLabViewProps) {
  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0f] text-slate-200">
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <PartsCatalogLabView user={user} tabId={tabId} />
      </div>
    </div>
  );
}

