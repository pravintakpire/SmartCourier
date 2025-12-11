import React, { useState } from 'react';
import { Container } from '../../types';
import { Truck, Plus, Trash, Check, AlertTriangle } from 'lucide-react';

interface Props {
  containers: Container[];
  setContainers: (containers: Container[]) => void;
}

const ContainerLibrary: React.FC<Props> = ({ containers, setContainers }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContainer, setNewContainer] = useState<Partial<Container>>({
    name: '',
    dimensions: { length: 300, width: 200, height: 200 },
    maxWeightKg: 1000
  });

  const activeCount = containers.filter(c => c.isActive).length;

  const toggleActive = (id: string) => {
    const container = containers.find(c => c.id === id);
    if (!container) return;

    // If turning on, check limit
    if (!container.isActive && activeCount >= 2) {
      alert("You can only have a maximum of 2 active containers at a time. Please deactivate another one first.");
      return;
    }

    const updated = containers.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setContainers(updated);
  };

  const handleAddContainer = () => {
    if (!newContainer.name || !newContainer.dimensions?.length) return;

    const container: Container = {
      id: `c-${Date.now()}`,
      name: newContainer.name,
      dimensions: newContainer.dimensions as any,
      maxWeightKg: newContainer.maxWeightKg || 1000,
      isActive: false // Default to inactive so we don't breach limit immediately
    };

    setContainers([...containers, container]);
    setShowAddForm(false);
    setNewContainer({
      name: '',
      dimensions: { length: 300, width: 200, height: 200 },
      maxWeightKg: 1000
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this container from your fleet?")) {
      setContainers(containers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" /> Fleet Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage your available trucks and containers.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-slate-700">Add New Vehicle Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
              <input 
                className="w-full border p-2 rounded" 
                placeholder="e.g. Box Truck" 
                value={newContainer.name}
                onChange={e => setNewContainer({...newContainer, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Length (cm)</label>
              <input 
                type="number" className="w-full border p-2 rounded" 
                value={newContainer.dimensions?.length}
                onChange={e => setNewContainer({...newContainer, dimensions: {...newContainer.dimensions!, length: Number(e.target.value)}})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Width (cm)</label>
              <input 
                type="number" className="w-full border p-2 rounded" 
                value={newContainer.dimensions?.width}
                onChange={e => setNewContainer({...newContainer, dimensions: {...newContainer.dimensions!, width: Number(e.target.value)}})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Height (cm)</label>
              <input 
                type="number" className="w-full border p-2 rounded" 
                value={newContainer.dimensions?.height}
                onChange={e => setNewContainer({...newContainer, dimensions: {...newContainer.dimensions!, height: Number(e.target.value)}})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Load (kg)</label>
              <input 
                type="number" className="w-full border p-2 rounded" 
                value={newContainer.maxWeightKg}
                onChange={e => setNewContainer({...newContainer, maxWeightKg: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
            <button onClick={handleAddContainer} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Vehicle</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {containers.map(container => (
          <div key={container.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden relative transition-all ${container.isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 opacity-80'}`}>
             <div className="p-5 flex justify-between items-start">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-bold text-lg text-slate-800">{container.name}</h3>
                   {container.isActive && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>}
                 </div>
                 <p className="text-sm text-slate-500 font-mono">
                    {container.dimensions.length} x {container.dimensions.width} x {container.dimensions.height} cm
                 </p>
                 <p className="text-sm text-slate-500 font-medium mt-1">
                    Max Load: {container.maxWeightKg} kg
                 </p>
               </div>

               <div className="flex flex-col items-end gap-2">
                 <button 
                    onClick={() => toggleActive(container.id)}
                    className={`px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors ${
                      container.isActive 
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                 >
                   {container.isActive ? <><Check className="w-4 h-4" /> Selected</> : 'Select'}
                 </button>
                 <button 
                    onClick={() => handleDelete(container.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded"
                    title="Delete Container"
                 >
                    <Trash className="w-4 h-4" />
                 </button>
               </div>
             </div>
             {container.isActive && (
               <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none"></div>
             )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
           <strong>Fleet Limit:</strong> You can select a maximum of <strong>2 active containers</strong> for the daily simulation. Deactivate a container to select another.
        </div>
      </div>
    </div>
  );
};

export default ContainerLibrary;