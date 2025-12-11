import React, { useState, useMemo, useEffect } from 'react';
import { Truck, Play, RefreshCw, Share2, BarChart2, X, ChevronRight, Eye, EyeOff, ClipboardList, Trash2, CheckCircle, Users, ArrowRightLeft } from 'lucide-react';
import Container3DView from '../visualizations/Container3DView';
import { Item, BoxType, Container, PackingSolution } from '../../types';
import { packContainer } from '../../services/packingService';
import SpaceSharing from './SpaceCollaboration';

interface Props {
  shipmentItems: Item[]; // Confirmed items from multiple clients
  boxTypes: BoxType[];
  containers: Container[]; // Active containers
  onUpdateItem: (item: Item) => void;
  onRemoveItem: (itemId: string) => void;
  onConfirmContainer: (shippedItemIds?: string[]) => void;
}

const ContainerLoading: React.FC<Props> = ({ 
  shipmentItems, 
  boxTypes, 
  containers,
  onUpdateItem,
  onRemoveItem,
  onConfirmContainer
}) => {
  const [selectedContainerId, setSelectedContainerId] = useState(containers.length > 0 ? containers[0].id : '');
  const [solution, setSolution] = useState<PackingSolution | null>(null);
  const [animate, setAnimate] = useState(false);
  const [showFreeSpace, setShowFreeSpace] = useState(true);
  
  // Modals
  const [showManifest, setShowManifest] = useState(false);

  // Client -> Container Assignment Map
  // Record<ClientId, ContainerId>
  const [clientAssignments, setClientAssignments] = useState<Record<string, string>>({});

  // Distinct Clients
  const clients = useMemo(() => {
      const uniqueIds = Array.from(new Set(shipmentItems.map(i => i.clientId || 'Unknown')));
      return uniqueIds.sort();
  }, [shipmentItems]);

  // Initialize assignments
  useEffect(() => {
    if (containers.length === 0) return;

    setClientAssignments(prev => {
        const next = { ...prev };
        let hasChanges = false;
        
        // Assign new clients to the first container by default
        clients.forEach(clientId => {
            if (!next[clientId]) {
                next[clientId] = containers[0].id;
                hasChanges = true;
            } else if (!containers.find(c => c.id === next[clientId])) {
                // If assigned container no longer exists/active, reset to first
                next[clientId] = containers[0].id;
                hasChanges = true;
            }
        });
        
        return hasChanges ? next : prev;
    });
    
    // Also ensure selectedContainerId is valid
    if (containers.length > 0 && !containers.find(c => c.id === selectedContainerId)) {
        setSelectedContainerId(containers[0].id);
    }
  }, [clients, containers, selectedContainerId]);

  const selectedContainer = containers.find(c => c.id === selectedContainerId) || containers[0];

  // Filter items for the CURRENTLY selected container based on assignment
  const itemsForCurrentContainer = useMemo(() => {
      return shipmentItems.filter(item => {
          const cId = item.clientId || 'Unknown';
          return clientAssignments[cId] === selectedContainerId;
      });
  }, [shipmentItems, clientAssignments, selectedContainerId]);

  // Run Simulation for the SELECTED container
  useEffect(() => {
    if (!selectedContainer) return;
    
    // We only pack the items assigned to this container
    const result = packContainer(itemsForCurrentContainer, boxTypes, selectedContainer);
    setSolution(result);
    
    if (itemsForCurrentContainer.length > 0) {
        setAnimate(true); 
    }
  }, [itemsForCurrentContainer, selectedContainerId, boxTypes, selectedContainer]);

  // Calculate Metrics for ALL containers (for the Distribution Panel)
  const containerStats = useMemo(() => {
      const stats: Record<string, { count: number, utilization: number, overflow: boolean }> = {};
      
      containers.forEach(c => {
          const itemsForC = shipmentItems.filter(item => {
              const cId = item.clientId || 'Unknown';
              return clientAssignments[cId] === c.id;
          });
          
          if (itemsForC.length === 0) {
              stats[c.id] = { count: 0, utilization: 0, overflow: false };
              return;
          }

          const res = packContainer(itemsForC, boxTypes, c);
          stats[c.id] = { 
              count: itemsForC.length, 
              utilization: res.metrics.volumeUtilization,
              overflow: res.unpackedItems.length > 0
          };
      });
      return stats;
  }, [shipmentItems, clientAssignments, containers, boxTypes]);


  const handleReplay = () => {
    if (itemsForCurrentContainer.length === 0) return;
    setAnimate(false);
    setTimeout(() => setAnimate(true), 100);
  };

  const handleUpdateQty = (item: Item, newQty: number) => {
      if (newQty < 1) return;
      const oldQty = item.quantity || 1;
      const unitWeight = item.weightKg / oldQty;
      
      onUpdateItem({
          ...item,
          quantity: newQty,
          weightKg: unitWeight * newQty
      });
  };

  const handleConfirmCurrentLoad = () => {
      if (!selectedContainer) return;
      // Get IDs of items in this container
      const itemIds = itemsForCurrentContainer.map(i => i.id);
      onConfirmContainer(itemIds);
  };

  // Group items by client for Manifest Modal
  const manifestByClient = useMemo(() => {
      const groups: Record<string, Item[]> = {};
      shipmentItems.forEach(item => {
          const clientId = item.clientId || 'Unknown';
          if (!groups[clientId]) groups[clientId] = [];
          groups[clientId].push(item);
      });
      return groups;
  }, [shipmentItems]);


  if (!selectedContainer) {
      return <div className="p-8 text-center text-slate-500">No active containers found. Please add a vehicle in the Fleet tab.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] relative">
      
      {/* Manifest Editor Modal */}
      {showManifest && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-blue-600" /> Global Shipment Manifest
                      </h3>
                      <button onClick={() => setShowManifest(false)} className="p-2 hover:bg-slate-200 rounded-full">
                          <X className="w-5 h-5 text-slate-500" />
                      </button>
                  </div>
                  <div className="p-0 overflow-y-auto bg-slate-50 flex-1">
                      {Object.keys(manifestByClient).length === 0 && (
                          <div className="p-8 text-center text-slate-400">No items in manifest. Go to Client Packaging to add items.</div>
                      )}
                      {(Object.entries(manifestByClient) as [string, Item[]][]).map(([clientId, items]) => (
                          <div key={clientId} className="mb-2 bg-white border-b border-slate-200">
                              <div className="px-4 py-2 bg-slate-100 font-bold text-xs text-slate-600 uppercase flex justify-between">
                                  <span>Client: {clientId}</span>
                                  <span>{items.length} Items</span>
                              </div>
                              {items.map(item => (
                                  <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                      <div className="flex-1">
                                          <p className="font-semibold text-sm text-slate-800">{item.name}</p>
                                          <p className="text-xs text-slate-500">
                                              {item.dimensions.length}x{item.dimensions.width}x{item.dimensions.height} cm • {item.weightKg.toFixed(1)} kg total
                                          </p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2 bg-slate-100 rounded px-2 py-1">
                                              <button onClick={() => handleUpdateQty(item, (item.quantity || 1) - 1)} className="text-slate-500 hover:text-blue-600 font-bold px-1">-</button>
                                              <span className="text-sm font-mono w-4 text-center">{item.quantity || 1}</span>
                                              <button onClick={() => handleUpdateQty(item, (item.quantity || 1) + 1)} className="text-slate-500 hover:text-blue-600 font-bold px-1">+</button>
                                          </div>
                                          <button 
                                              onClick={() => {
                                                  if(confirm('Remove this item from the manifest?')) onRemoveItem(item.id);
                                              }}
                                              className="p-1.5 text-red-400 hover:bg-red-50 rounded hover:text-red-600"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ))}
                  </div>
                  <div className="p-4 border-t bg-white flex justify-end">
                      <button onClick={() => setShowManifest(false)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Done</button>
                  </div>
              </div>
          </div>
      )}

      {/* Left Sidebar: Controls & Metrics */}
      <div className="col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-y-auto">
         <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" /> Load Plan
        </h2>

        {/* Container Selector */}
        <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">View Active Container</label>
            <div className="space-y-2">
                {containers.map(c => {
                    const stats = containerStats[c.id] || { count: 0, utilization: 0, overflow: false };
                    return (
                        <div 
                            key={c.id}
                            onClick={() => setSelectedContainerId(c.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedContainerId === c.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold text-sm ${selectedContainerId === c.id ? 'text-indigo-900' : 'text-slate-700'}`}>{c.name}</span>
                                {stats.overflow && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-bold">Overflow</span>}
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-500">{stats.count} Items</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full ${stats.utilization > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${stats.utilization}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">{stats.utilization.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Client Distribution Panel */}
        {containers.length > 1 && (
            <div className="mb-6 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                    <Users className="w-3 h-3 text-slate-500" /> Logistics & Distribution
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {clients.map(clientId => {
                        const currentCId = clientAssignments[clientId];
                        const itemCount = shipmentItems.filter(i => (i.clientId || 'Unknown') === clientId).length;
                        if (itemCount === 0) return null;

                        return (
                            <div key={clientId} className="bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-slate-700">Client {clientId}</span>
                                    <span className="text-slate-500">{itemCount} items</span>
                                </div>
                                <div className="flex bg-white rounded border border-slate-300 overflow-hidden">
                                    {containers.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setClientAssignments(prev => ({ ...prev, [clientId]: c.id }))}
                                            className={`flex-1 py-1.5 text-[10px] font-bold truncate px-1 transition-colors ${currentCId === c.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                            title={c.name}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                    Constraint: All packages for a client must be in one container.
                </p>
            </div>
        )}

        <div className="grid grid-cols-1 gap-2 mb-4">
             <button 
                onClick={() => setShowManifest(true)}
                className="w-full py-2.5 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded flex items-center justify-center gap-2 transition-colors"
            >
                <ClipboardList className="w-4 h-4" /> Global Manifest ({shipmentItems.length})
            </button>

            <button 
                onClick={() => setShowFreeSpace(!showFreeSpace)}
                className={`w-full py-2.5 px-3 text-xs font-bold rounded flex items-center justify-center gap-2 border transition-all ${
                    showFreeSpace 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
            >
                {showFreeSpace ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                {showFreeSpace ? 'Hide Rentable Space' : 'Show Rentable Space'}
            </button>
        </div>

        {solution && (
            <div className="space-y-4 mb-6 border-t border-slate-100 pt-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                         <span className="text-xs text-slate-500 uppercase font-bold">Current Load Efficiency</span>
                         <span className="text-xs font-mono text-slate-400">{solution.metrics.volumeUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-100">
                        <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${solution.metrics.volumeUtilization}%` }}></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white rounded border border-slate-200 shadow-sm">
                         <span className="text-xs text-slate-400 uppercase">Items Packed</span>
                         <p className="text-xl font-bold text-slate-700">{solution.metrics.boxCount} <span className="text-xs font-normal text-slate-400">/ {itemsForCurrentContainer.length}</span></p>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-200 shadow-sm">
                         <span className="text-xs text-slate-400 uppercase">Total Weight</span>
                         <p className="text-xl font-bold text-slate-700">{solution.metrics.totalWeight.toFixed(0)} <span className="text-sm font-normal text-slate-400">kg</span></p>
                    </div>
                </div>

                {itemsForCurrentContainer.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded text-amber-800 text-sm flex items-start gap-2">
                        <span className="text-lg">ℹ️</span>
                        <div>
                            <strong>Empty Load</strong>
                            <p className="text-xs mt-1">No clients assigned to this container.</p>
                        </div>
                    </div>
                ) : solution.unpackedItems.length > 0 ? (
                    <div className="p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <strong>Overflow!</strong>
                            <p className="text-xs mt-1">{solution.unpackedItems.length} items did not fit.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-green-50 border border-green-100 rounded text-green-700 text-sm flex items-center gap-2">
                         <span className="text-lg">✓</span> 
                         <span className="font-medium">All assigned items fit!</span>
                    </div>
                )}
            </div>
        )}

        <div className="mt-auto space-y-2">
             <button 
                onClick={handleReplay} 
                disabled={itemsForCurrentContainer.length === 0}
                className="w-full py-2 flex items-center justify-center gap-2 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                 <RefreshCw className="w-4 h-4" /> Replay Load Animation
             </button>
             
             <button 
                onClick={handleConfirmCurrentLoad} 
                disabled={itemsForCurrentContainer.length === 0}
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-green-600 border border-green-700 rounded hover:bg-green-700 text-white transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
                 <CheckCircle className="w-4 h-4" /> Ship {selectedContainer.name}
             </button>
        </div>
      </div>

      {/* Center: 3D Container View */}
      <div className="col-span-2 bg-slate-900 rounded-xl shadow-lg border border-slate-700 p-1 flex flex-col min-h-[400px]">
         {solution ? (
             <Container3DView 
                container={selectedContainer} 
                packedItems={solution.packedItems}
                showFreeSpace={showFreeSpace}
                animateLoading={animate}
             />
         ) : (
             <div className="h-full flex items-center justify-center text-white">Initializing...</div>
         )}
      </div>

      {/* Right: Collaboration & Export */}
      <div className="col-span-1 h-full">
         {solution && <SpaceSharing metrics={solution.metrics} containerName={selectedContainer.name} />}
      </div>
    </div>
  );
};

export default ContainerLoading;