import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, type LucideProps } from 'lucide-react';
import * as Icons from 'lucide-react';
import { COMPONENT_DEFINITIONS } from '../../constants/components';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['input', 'output', 'transformation'])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const onDragStart = (event: React.DragEvent, componentType: string, label: string, componentData: any) => {
    event.dataTransfer.setData('application/reactflow', componentType);
    event.dataTransfer.setData('label', label);
    event.dataTransfer.setData('componentData', JSON.stringify(componentData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredComponents = useMemo(() => {
    return COMPONENT_DEFINITIONS.filter((comp) =>
      comp.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const categories = [
    { id: 'input', label: 'Sources', color: 'text-blue-500' },
    { id: 'transformation', label: 'Transformations', color: 'text-purple-500' },
    { id: 'output', label: 'Destinations', color: 'text-green-500' },
  ];

  // State for hover tooltip in collapsed mode
  const [hoveredItem, setHoveredItem] = useState<{ label: string; top: number } | null>(null);

  if (collapsed) {
      return (
          <div className="w-12 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center py-4 transition-all duration-200">
              <button 
                onClick={() => setCollapsed(false)}
                className="p-2 mb-4 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title="Expand Sidebar"
              >
                  <Icons.PanelLeftOpen size={20} />
              </button>
              
              <div className="flex-1 w-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col items-center gap-4 pb-4">
                  {categories.map((category) => {
                      const categoryComponents = COMPONENT_DEFINITIONS.filter(c => c.category === category.id);
                      if (categoryComponents.length === 0) return null;
                      
                      return (
                          <div key={category.id} className="w-full flex flex-col items-center gap-2">
                              {/* Category Divider/Indicator could go here, but maybe just space is enough */}
                              <div className="w-8 h-px bg-[var(--border-color)] opacity-50 my-1" />
                              
                              {categoryComponents.map((component) => {
                                  const iconName = component.icon as keyof typeof Icons;
                                  const IconComponent = Icons[iconName] as React.FC<LucideProps>;
                                  
                                  return (
                                      <div
                                          key={component.type}
                                          draggable
                                          onDragStart={(e) =>
                                              onDragStart(e, component.type, component.label, {
                                                  label: component.label,
                                                  type: component.type,
                                                  config: { ...component.defaultConfig, icon: component.icon },
                                                  status: 'idle',
                                              })
                                          }
                                          onMouseEnter={(e) => {
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              setHoveredItem({ label: component.label, top: rect.top });
                                          }}
                                          onMouseLeave={() => setHoveredItem(null)}
                                          className="p-2 rounded-md cursor-grab hover:bg-[var(--bg-hover)] transition-colors group relative"
                                      >
                                          {IconComponent && (
                                              <IconComponent 
                                                  size={20} 
                                                  className={`${
                                                      category.id === 'input' ? 'text-blue-500' :
                                                      category.id === 'output' ? 'text-green-500' :
                                                      category.id === 'transformation' ? 'text-purple-500' :
                                                      'text-[var(--text-secondary)]'
                                                  }`} 
                                              />
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      );
                  })}
              </div>

              {/* Fixed Position Tooltip - Renders outside the scroll container concept visually via fixed */}
              {hoveredItem && (
                  <div 
                      className="fixed left-14 px-2 py-1 bg-black text-white text-xs rounded z-[100] pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-75 shadow-lg"
                      style={{ top: hoveredItem.top + 6 }} // +6 to align vertically center-ish relative to 32px-40px high icon
                  >
                      {hoveredItem.label}
                      {/* Little triangle arrow pointing left */}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-r-[4px] border-r-black border-b-[4px] border-b-transparent"></div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col h-full animate-in slide-in-from-left duration-200">
      <div className="h-10 flex items-center justify-between px-4 border-b border-[var(--border-color)]">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Components</span>
        <button 
           onClick={() => setCollapsed(true)}
           className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
           title="Collapse Sidebar"
        >
            <Icons.PanelLeftClose size={16} />
        </button>
      </div>
      <div className="p-3 border-b border-[var(--border-color)]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-2 space-y-4">
        {categories.map((category) => {
          const categoryComponents = filteredComponents.filter(
            (comp) => comp.category === category.id
          );
          
          if (categoryComponents.length === 0) return null;

          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-2 py-1.5 flex items-center justify-between hover:bg-[var(--bg-hover)] rounded-md transition-colors group mb-1"
              >
                <span className={`text-xs font-semibold flex items-center gap-2 ${category.color}`}>
                  {category.label}
                  <span className="text-[10px] text-[var(--text-tertiary)] font-mono bg-[var(--bg-secondary)] px-1 rounded border border-[var(--border-color)]">
                    {categoryComponents.length}
                  </span>
                </span>
                {isExpanded ? (
                  <ChevronDown size={14} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight size={14} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
                )}
              </button>

              {isExpanded && (
                <div className="grid grid-cols-2 gap-2 px-1">
                  {categoryComponents.map((component) => {
                    const iconName = component.icon as keyof typeof Icons;
                    const IconComponent = Icons[iconName] as React.FC<LucideProps>;
                    
                    return (
                      <div
                        key={component.type}
                        draggable
                        onDragStart={(e) =>
                          onDragStart(e, component.type, component.label, {
                            label: component.label,
                            type: component.type,
                            config: { ...component.defaultConfig, icon: component.icon },
                            status: 'idle',
                          })
                        }
                        className="flex flex-col items-center justify-center gap-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md cursor-grab active:cursor-grabbing hover:bg-[var(--bg-hover)] hover:border-[var(--text-tertiary)] transition-all group h-20"
                      >
                         {IconComponent && (
                            <IconComponent 
                              size={20} 
                              className={`${
                                category.id === 'input' ? 'text-blue-500' :
                                category.id === 'output' ? 'text-green-500' :
                                category.id === 'transformation' ? 'text-purple-500' :
                                'text-[var(--text-secondary)]'
                              } group-hover:text-[var(--text-primary)] transition-colors`} 
                            />
                          )}
                          <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] text-center leading-tight line-clamp-2">
                             {component.label}
                          </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
