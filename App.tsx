import React, { useState } from 'react';
import { Package, Truck, Settings, Layers, Box as BoxIcon } from 'lucide-react';
import ClientPacking from './components/modules/ClientPacking';
import ContainerLoading from './components/modules/ContainerLoading';
import BoxLibrary from './components/modules/BoxLibrary';
import ContainerLibrary from './components/modules/ContainerLibrary';
import { DEFAULT_BOXES, DEFAULT_CONTAINERS } from './constants';
import { Item, BoxType, Container } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'pack' | 'load' | 'boxes' | 'fleet'>('pack');
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
      <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden lg:block tracking-tight">SmartCourier</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <NavButton 
                active={activeTab === 'pack'} 
                onClick={() => setActiveTab('pack')} 
                icon={<Package />} 
                label="Client Packaging" 
            />
            <NavButton 
                active={activeTab === 'load'} 
                onClick={() => setActiveTab('load')} 
                icon={<Truck />} 
                label="Container Load"
                badge={shipmentItems.length > 0 ? shipmentItems.length : undefined}
            />
            <div className="pt-4 pb-2 text-xs font-bold text-slate-500 uppercase px-3 hidden lg:block">Configuration</div>
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
            <div className="bg-slate-800 rounded p-3">
                <p className="text-xs text-slate-400 mb-1">Active Shipment Items</p>
                <p className="text-xl font-bold">{shipmentItems.length}</p>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <h1 className="text-xl font-bold text-slate-800">
                {activeTab === 'pack' && 'Client Packaging Optimizer'}
                {activeTab === 'load' && '3D Container Loading Simulator'}
                {activeTab === 'boxes' && 'Box Library'}
                {activeTab === 'fleet' && 'Container Fleet Management'}
            </h1>
            <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">Demo User</span>
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200"></div>
            </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden overflow-y-auto">
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
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
            active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        {React.cloneElement(icon, { className: "w-5 h-5" })}
        <span className="hidden lg:block font-medium">{label}</span>
        {badge !== undefined && (
            <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full hidden lg:block">
                {badge}
            </span>
        )}
    </button>
);

export default App;