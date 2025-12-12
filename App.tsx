
import React, { useState } from 'react';
import { Package, Truck, Settings, Box as BoxIcon, LayoutDashboard } from 'lucide-react';
import ClientPacking from './components/modules/ClientPacking';
import ContainerLoading from './components/modules/ContainerLoading';
import BoxLibrary from './components/modules/BoxLibrary';
import ContainerLibrary from './components/modules/ContainerLibrary';
import Dashboard from './components/modules/Dashboard';
import { Logo } from './components/ui/Logo';
import { BackgroundPattern } from './components/ui/BackgroundPattern';
import { DEFAULT_BOXES, DEFAULT_CONTAINERS } from './constants';
import { Item, BoxType, Container } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pack' | 'load' | 'boxes' | 'fleet'>('dashboard');
  const [boxes, setBoxes] = useState<BoxType[]>(DEFAULT_BOXES);
  const [containers, setContainers] = useState<Container[]>(DEFAULT_CONTAINERS);
  const [shipmentItems, setShipmentItems] = useState<Item[]>([]);

  // Callback when a client shipment is finalized
  const handleFinalizeShipment = (newItems: Item[]) => {
      // Filter out items that don't have a box assigned, or handle them differently
      const validItems = newItems.filter(i => i.assignedBoxId);
      if (validItems.length < newItems.length) {
          alert(`Warning: ${newItems.length - validItems.length} items were skipped because no box was selected.`);
      }
      setShipmentItems(prev => [...prev, ...validItems]);
      setActiveTab('load'); // Switch to loading view
  };

  const handleUpdateShipmentItem = (updatedItem: Item) => {
    setShipmentItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleRemoveShipmentItem = (itemId: string) => {
    setShipmentItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const handleConfirmContainer = (shippedItemIds?: string[]) => {
      if(confirm("Confirm shipping for this container? The shipped items will be removed from the manifest.")) {
          if (shippedItemIds && shippedItemIds.length > 0) {
              setShipmentItems(prev => prev.filter(i => !shippedItemIds.includes(i.id)));
              
              // Only switch tab if EVERYthing is gone
              const remainingCount = shipmentItems.length - shippedItemIds.length;
              if (remainingCount <= 0) {
                  setActiveTab('pack');
              }
          } else {
              // Fallback clear all
              setShipmentItems([]);
              setActiveTab('pack');
          }
      }
  };

  // Filter only active containers for the loading module
  const activeContainers = containers.filter(c => c.isActive);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all shadow-xl z-20">
        <div className="p-6 flex items-center justify-center lg:justify-start border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
            <div className="hidden lg:block">
                <Logo size="md" />
            </div>
            <div className="block lg:hidden">
                <Logo size="sm" />
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <NavButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                icon={<LayoutDashboard />} 
                label="Dashboard" 
            />
            <div className="pt-4 pb-2 text-xs font-bold text-slate-500 uppercase px-3 hidden lg:block tracking-wider">Modules</div>
            <NavButton 
                active={activeTab === 'pack'} 
                onClick={() => setActiveTab('pack')} 
                icon={<Package />} 
                label="Client Packing" 
            />
            <NavButton 
                active={activeTab === 'load'} 
                onClick={() => setActiveTab('load')} 
                icon={<Truck />} 
                label="Container Load"
                badge={shipmentItems.length > 0 ? shipmentItems.length : undefined}
            />
            <div className="pt-4 pb-2 text-xs font-bold text-slate-500 uppercase px-3 hidden lg:block tracking-wider">Configuration</div>
            <NavButton 
                active={activeTab === 'boxes'} 
                onClick={() => setActiveTab('boxes')} 
                icon={<Settings />} 
                label="Box Library" 
            />
             <NavButton 
                active={activeTab === 'fleet'} 
                onClick={() => setActiveTab('fleet')} 
                icon={<BoxIcon />} 
                label="Fleet / Containers" 
            />
        </nav>

        <div className="p-4 border-t border-slate-800 hidden lg:block">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1 font-medium">Active Shipment Items</p>
                <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-white">{shipmentItems.length}</p>
                    <span className="text-xs text-slate-500">pending</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <BackgroundPattern />

        <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10 relative">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {activeTab === 'dashboard' && 'Operations Overview'}
                {activeTab === 'pack' && 'Client Packaging Optimizer'}
                {activeTab === 'load' && '3D Container Loading Simulator'}
                {activeTab === 'boxes' && 'Box Library'}
                {activeTab === 'fleet' && 'Container Fleet Management'}
            </h1>
            <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-600">Demo User</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 border-2 border-white shadow-md"></div>
            </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden overflow-y-auto bg-slate-50/50 relative z-10">
            {activeTab === 'dashboard' && (
                <Dashboard onNavigate={setActiveTab} />
            )}
            {activeTab === 'pack' && (
                <ClientPacking boxes={boxes} onAddToShipment={handleFinalizeShipment} />
            )}
            {activeTab === 'load' && (
                <ContainerLoading 
                    shipmentItems={shipmentItems} 
                    boxTypes={boxes} 
                    containers={activeContainers}
                    onUpdateItem={handleUpdateShipmentItem}
                    onRemoveItem={handleRemoveShipmentItem}
                    onConfirmContainer={handleConfirmContainer}
                />
            )}
            {activeTab === 'boxes' && (
                <BoxLibrary boxes={boxes} setBoxes={setBoxes} />
            )}
            {activeTab === 'fleet' && (
                <ContainerLibrary containers={containers} setContainers={setContainers} />
            )}
        </div>
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, badge }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
            active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <span className="hidden lg:block font-medium">{label}</span>
        {badge !== undefined && (
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full hidden lg:block font-bold ${
                active ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
                {badge}
            </span>
        )}
    </button>
);

export default App;
