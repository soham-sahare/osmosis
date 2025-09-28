import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import * as Icons from 'lucide-react';
import type { ComponentData } from '../../types/job';
import { getComponentDefinition } from '../../constants/components';

interface CustomNodeProps extends NodeProps {
  data: ComponentData;
}

export const CustomNode: React.FC<CustomNodeProps> = memo(({ data, selected }) => {
  const def = getComponentDefinition(data.type);
  const iconName = def?.icon || data.config.icon || 'Box';
  const IconComponent = (Icons as any)[iconName];
  
  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'ring-2 ring-yellow-500 border-yellow-500';
      case 'success':
        return 'ring-2 ring-green-500 border-green-500';
      case 'error':
        return 'ring-2 ring-red-500 border-red-500';
      default:
        return selected 
          ? 'ring-2 ring-vercel-accent-blue border-vercel-accent-blue' 
          : 'border-vercel-light-border dark:border-vercel-dark-border hover:border-vercel-accent-blue dark:hover:border-vercel-accent-blue';
    }
  };

  const getStatusIndicator = () => {
      if (data.status === 'running') return <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />;
      if (data.status === 'success') return <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500" />;
      if (data.status === 'error') return <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />;
      return null;
  };

  return (
    <div
      className={`relative min-w-[120px] min-h-[80px] px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border transition-all duration-200 flex flex-col items-center justify-center gap-2 group ${getStatusColor()}`}
    >
      {/* Inputs Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-[var(--bg-secondary)] !border-2 !border-[var(--text-tertiary)] group-hover:!border-[var(--text-primary)] transition-colors z-10 -left-1.5" 
      />
      
      {/* Icon */}
      <div className={`${
        def?.category === 'input' ? 'text-blue-500' :
        def?.category === 'output' ? 'text-green-500' :
        def?.category === 'transformation' ? 'text-purple-500' :
        'text-[var(--text-secondary)]'
      } group-hover:text-[var(--text-primary)] transition-colors`}>
         {IconComponent && <IconComponent size={24} />}
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-center gap-0.5 max-w-full">
         {/* Component Type (Top) */}
         <div className="text-[9px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
             {def?.label || 'Component'}
         </div>
         
         {/* Instance Name (Bottom) */}
         <div className="text-xs font-medium text-[var(--text-primary)] text-center leading-tight truncate w-full px-1">
            {data.label}
         </div>
      </div>
      
      {/* Status Dot (Absolute) */}
      {getStatusIndicator()}

      {/* Outputs Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-[var(--bg-secondary)] !border-2 !border-[var(--text-tertiary)] group-hover:!border-[var(--text-primary)] transition-colors z-10 -right-1.5" 
      />
    </div>
  );
});
