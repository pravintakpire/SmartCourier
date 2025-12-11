import React, { useState, useEffect } from 'react';
import { Camera, Package, Info, Check, Trash2, Box, Maximize, Layers, Pencil, Ruler, Search, ScanLine, Loader2, Combine } from 'lucide-react';
import { Item, BoxType, Dimensions } from '../../types';
import { analyzeItemImage, analyzeItemText } from '../../services/geminiService';
import { findBestBox } from '../../services/packingService';
import Item3DView from '../visualizations/Item3DView';

interface Props {
  boxes: BoxType[];
  onAddToShipment: (items: Item[]) => void;
}

const ClientPacking: React.FC<Props> = ({ boxes, onAddToShipment }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
  // Client Management
  const [clientId, setClientId] = useState<string>(`#${Math.floor(1000 + Math.random() * 9000)}`);

  // Adding Mode
  const [addMode, setAddMode] = useState<'scan' | 'search'>('scan');

  // Text Search State
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCheck = (id: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCheckedItems(newSet);
  };

  const handleBundleItems = () => {
    const selected = items.filter(i => checkedItems.has(i.id));
    if (selected.length < 2) return;

    // Calculate metrics
    let totalWeight = 0;
    let totalVol = 0;
    const names: string[] = [];

    selected.forEach(i => {
        const qty = i.quantity || 1;
        totalWeight += i.weightKg * qty;
        totalVol += (i.dimensions.length * i.dimensions.width * i.dimensions.height) * qty;
        names.push(i.name);
    });

    // Heuristic dimensions: Cube with 30% air gap for irregular packing
    const targetVol = totalVol * 1.3; 
    const side = Math.round(Math.pow(targetVol, 1/3));

    const bundleItem: Item = {
        id: `bundle-${Date.now()}`,
        name: `Bundle: ${selected.length} Items`, 
        weightKg: totalWeight,
        dimensions: { length: side, width: side, height: side },
        shape: 'box', 
        isFragile: selected.some(i => i.isFragile),
        isStackable: selected.every(i => i.isStackable),
        quantity: 1,
        packTogether: false,
        clientId: clientId,
    };

    // Auto-assign best box for the new bundle
    const suggestion = findBestBox(bundleItem, boxes);
    if (suggestion) {
        bundleItem.assignedBoxId = suggestion.box.id;
    }

    // Remove selected items, add bundle
    const remaining = items.filter(i => !checkedItems.has(i.id));
    setItems([...remaining, bundleItem]);
    setCheckedItems(new Set());
    setSelectedItemId(bundleItem.id);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Call AI Agent
        const analysis = await analyzeItemImage(base64.split(',')[1]);
        
        // Auto-create item draft
        const newItem: Item = {
          id: Date.now().toString(),
          name: `Analyzed Item ${items.length + 1}`,
          weightKg: 1, // Default weight for image scan (user must edit)
          dimensions: analysis.dimensions,
          shape: analysis.shape,
          isFragile: false,
          isStackable: true,
          imageUrl: base64,
          quantity: 1,
          packTogether: false,
          clientId: clientId
        };
        
        // Find best box immediately
        const suggestion = findBestBox(newItem, boxes);
        if (suggestion) {
            newItem.assignedBoxId = suggestion.box.id;
        }

        setItems([...items, newItem]);
        setSelectedItemId(newItem.id);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextSearch = async () => {
      if (!searchQuery.trim()) return;
      setLoading(true);

      const analysis = await analyzeItemText(searchQuery);

      const newItem: Item = {
          id: Date.now().toString(),
          name: searchQuery,
          weightKg: analysis.weightKg,
          dimensions: analysis.dimensions,
          shape: analysis.shape,
          isFragile: false,
          isStackable: true,
          quantity: 1,
          packTogether: false,
          clientId: clientId
      };

      const suggestion = findBestBox(newItem, boxes);
      if (suggestion) {
          newItem.assignedBoxId = suggestion.box.id;
      }

      setItems([...items, newItem]);
      setSelectedItemId(newItem.id);
      setLoading(false);
      setSearchQuery('');
  };

  const selectedItem = items.find(i => i.id === selectedItemId);
  
  // Determine if we are using a standard box or a custom one
  const selectedBox = selectedItem?.assignedBoxId && selectedItem.assignedBoxId !== 'custom'
      ? boxes.find(b => b.id === selectedItem.assignedBoxId) 
      : null;

  const isCustomBox = selectedItem?.assignedBoxId === 'custom';

  const handleCustomBoxResize = (newDims: Dimensions) => {
      if (!selectedItem) return;
      const updatedItems = items.map(item => {
          if (item.id === selectedItem.id) {
              return { ...item, customBoxDimensions: newDims };
          }
          return item;
      });
      setItems(updatedItems);
  };

  const handleDimensionChange = (dim: keyof Dimensions, value: string) => {
      if (!selectedItem) return;
      const numValue = parseFloat(value) || 0;
      
      const updatedItems = items.map(item => {
          if (item.id === selectedItem.id) {
              return { 
                  ...item, 
                  dimensions: { ...item.dimensions, [dim]: numValue } 
              };
          }
          return item;
      });
      setItems(updatedItems);
  };

  const handleFinalize = () => {
      // Logic: If 'packTogether' is true, we create ONE item that represents the box containing everything.
      // If false, we explode into 'quantity' individual items.
      const shipmentItems: Item[] = [];
      
      items.forEach(item => {
          const qty = item.quantity || 1;
          
          if (item.packTogether && qty > 1) {
              // Create one consolidated item
              // We use the custom box dimensions (or selected box) as the item dimensions for the container packer
              // The weight is total weight
              const boxDims = item.customBoxDimensions || 
                             (item.assignedBoxId && boxes.find(b => b.id === item.assignedBoxId)?.dimensions) || 
                             item.dimensions; // Fallback (shouldn't happen if logic is correct)

              shipmentItems.push({
                  ...item,
                  id: `${item.id}-consolidated`,
                  name: `${item.name} (x${qty} Pack)`,
                  weightKg: item.weightKg * qty,
                  dimensions: boxDims, // The packer sees the BOX size as the ITEM size
                  customBoxDimensions: boxDims, // Ensure packer respects this
                  assignedBoxId: 'custom', // Force custom so packer uses the dimensions provided
                  quantity: 1
              });
          } else {
              // Create N individual items
              for (let i = 0; i < qty; i++) {
                  shipmentItems.push({
                      ...item,
                      id: `${item.id}-${i}`, // Unique ID for each instance
                      name: qty > 1 ? `${item.name} #${i+1}` : item.name,
                      quantity: 1 // Reset qty for the individual item
                  });
              }
          }
      });
      onAddToShipment(shipmentItems);
      
      // Reset for next client
      setItems([]);
      setClientId(`#${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // --- PRICING LOGIC ---
  // Reference: Small Box (30x30x30 = 27000cm3) costs $5.00
  const REF_VOL = 30 * 30 * 30; // 27000
  const REF_PRICE = 5.00;
  const PRICE_PER_CC = REF_PRICE / REF_VOL; // Cost per cubic cm
  const WEIGHT_CHARGE_PER_KG = 2.00; // Base shipping rate per kg (separate from packaging cost)

  // Calculate Custom Box Price
  let customBoxPrice = 0;
  
  // Calculate Totals for Client Summary
  let totalClientCost = 0;
  let totalClientVolume = 0;
  let totalClientPackages = 0;

  // Helper to calc price for an item configuration
  const calcPrice = (item: Item, boxId: string, customDims?: Dimensions) => {
      const qty = item.quantity || 1;
      const effectiveQty = item.packTogether ? 1 : qty;
      const totalWeight = item.weightKg * qty;
      const shippingCost = totalWeight * WEIGHT_CHARGE_PER_KG;
      
      let packagingCost = 0;

      if (boxId === 'custom' && customDims) {
          const vol = customDims.length * customDims.width * customDims.height;
          const totalVolume = vol * effectiveQty;
          const basePkgCost = totalVolume * PRICE_PER_CC;
          packagingCost = basePkgCost * 1.20; // +20%
      } else if (boxId !== 'custom') {
          const box = boxes.find(b => b.id === boxId);
          if (box) {
              const boxVol = box.dimensions.length * box.dimensions.width * box.dimensions.height;
              const totalBoxVol = boxVol * effectiveQty;
              packagingCost = totalBoxVol * PRICE_PER_CC;
          }
      }
      return packagingCost + shippingCost;
  };

  // Update Summary
  items.forEach(item => {
      if (item.assignedBoxId) {
          totalClientCost += calcPrice(item, item.assignedBoxId, item.customBoxDimensions);
          // Volume
          const dims = item.assignedBoxId === 'custom' && item.customBoxDimensions 
              ? item.customBoxDimensions 
              : (boxes.find(b => b.id === item.assignedBoxId)?.dimensions || item.dimensions);
          const vol = (dims.length * dims.width * dims.height) / 1000; // Liters
          totalClientVolume += vol * (item.packTogether ? 1 : (item.quantity || 1));
          totalClientPackages += (item.packTogether ? 1 : (item.quantity || 1));
      }
  });

  if (selectedItem) {
      // Current selection custom price logic for UI display
      const effectiveQty = selectedItem.packTogether ? 1 : (selectedItem.quantity || 1);
      const dims = selectedItem.customBoxDimensions || selectedItem.dimensions;
      const vol = dims.length * dims.width * dims.height;
      const totalVolume = vol * effectiveQty;
      const basePkgCost = totalVolume * PRICE_PER_CC;
      const customPkgCost = basePkgCost * 1.20;
      const totalWeight = selectedItem.weightKg * (selectedItem.quantity || 1);
      const shippingCost = totalWeight * WEIGHT_CHARGE_PER_KG;

      customBoxPrice = customPkgCost + shippingCost;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Left Column: List & Add */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full relative">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" /> Client Items
            </h2>
            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold">Client: {clientId}</span>
        </div>
        
        {/* Add Item Tabs */}
        <div className="mb-4">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-2">
                <button 
                    onClick={() => setAddMode('scan')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${addMode === 'scan' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ScanLine className="w-3 h-3" /> Scan Image
                </button>
                <button 
                    onClick={() => setAddMode('search')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${addMode === 'search' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Search className="w-3 h-3" /> Product Search
                </button>
            </div>

            {addMode === 'scan' ? (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center transition-colors hover:bg-blue-100 relative">
                    {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-blue-600"/></div>}
                    <label className="cursor-pointer block">
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={loading} />
                        <div className="flex flex-col items-center gap-2 text-blue-700">
                            <Camera className="w-6 h-6" />
                            <span className="font-semibold text-sm">Upload Photo</span>
                            <span className="text-[10px] text-blue-500 uppercase">AI Dimension Analysis</span>
                        </div>
                    </label>
                </div>
            ) : (
                 <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg relative">
                    {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"><Loader2 className="w-6 h-6 animate-spin text-blue-600"/></div>}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Ex: Samsung 55 Inch TV"
                            className="flex-1 bg-white border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
                        />
                        <button 
                            onClick={handleTextSearch}
                            disabled={!searchQuery.trim() || loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">AI looks up weight & dimensions automatically</p>
                 </div>
            )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-24 relative">
            {items.length === 0 && <p className="text-center text-slate-400 py-6 text-sm">No items added for this client yet.</p>}
            {items.map(item => (
                <div 
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors relative ${selectedItemId === item.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                    <div className="flex items-start gap-3">
                        <div className="pt-1">
                            <input 
                                type="checkbox" 
                                checked={checkedItems.has(item.id)}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    toggleCheck(item.id);
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.dimensions.length}x{item.dimensions.width}x{item.dimensions.height} cm • {item.weightKg}kg</p>
                                    {(item.quantity || 1) > 1 && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                                            {item.packTogether && <Layers className="w-3 h-3 text-blue-500" title="Packed Together"/>}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    {item.assignedBoxId ? <Check className="w-4 h-4 text-green-500 ml-auto mb-1" /> : <Info className="w-4 h-4 text-amber-500 ml-auto mb-1" />}
                                    {item.assignedBoxId && (
                                        <p className="text-xs font-bold text-slate-700">${calcPrice(item, item.assignedBoxId, item.customBoxDimensions).toFixed(2)}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Bundle Action Bar */}
        {checkedItems.size > 1 && (
            <div className="absolute bottom-28 left-4 right-4 bg-indigo-900 text-white p-3 rounded-lg shadow-xl z-20 flex items-center justify-between animate-in slide-in-from-bottom-5">
                <span className="text-sm font-bold">{checkedItems.size} items selected</span>
                <button 
                    onClick={handleBundleItems}
                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded text-xs font-bold flex items-center gap-2 transition-colors"
                >
                    <Combine className="w-4 h-4" /> Bundle into One Box
                </button>
            </div>
        )}
        
        {/* Sticky Footer for Client Summary */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-800 text-white p-3 rounded-lg shadow-lg z-30">
            <div className="flex justify-between text-xs mb-2 text-slate-300">
                <span>{totalClientPackages} Packages</span>
                <span>{(totalClientVolume/1000).toFixed(2)} m³</span>
            </div>
            <div className="flex justify-between items-end border-t border-slate-600 pt-2">
                <span className="font-bold text-sm">Client Total</span>
                <span className="text-xl font-bold text-green-400">${totalClientCost.toFixed(2)}</span>
            </div>
             <button 
                onClick={handleFinalize}
                className="mt-3 w-full py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 text-sm"
                disabled={items.length === 0}
            >
                Confirm Client & Next
            </button>
        </div>
      </div>

      {/* Center: Details & Configuration */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto">
         {selectedItem ? (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                     <h3 className="text-lg font-bold text-slate-800">Item Details</h3>
                     <button onClick={() => {
                         setItems(items.filter(i => i.id !== selectedItemId));
                         setSelectedItemId(null);
                     }} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded border border-slate-100 relative group">
                        <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                            <Ruler className="w-3 h-3" /> Dimensions (cm)
                            <span className="ml-auto text-[10px] bg-slate-200 px-1 rounded text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">Editable</span>
                        </span>
                        <div className="flex gap-2 text-sm font-mono">
                            <input 
                                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-1 rounded text-center transition-all" 
                                value={selectedItem.dimensions.length} 
                                onChange={(e) => handleDimensionChange('length', e.target.value)}
                            />
                            <span className="flex items-center text-slate-400">x</span>
                            <input 
                                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-1 rounded text-center transition-all" 
                                value={selectedItem.dimensions.width} 
                                onChange={(e) => handleDimensionChange('width', e.target.value)}
                            />
                            <span className="flex items-center text-slate-400">x</span>
                            <input 
                                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-1 rounded text-center transition-all" 
                                value={selectedItem.dimensions.height} 
                                onChange={(e) => handleDimensionChange('height', e.target.value)}
                            />
                        </div>
                    </div>
                     <div className="p-3 bg-slate-50 rounded border border-slate-100">
                        <span className="text-xs text-slate-500 uppercase block mb-1">Weight (kg) per item</span>
                        <input className="w-full bg-white border p-1 rounded font-mono" type="number" value={selectedItem.weightKg} onChange={(e) => {
                             const newItems = [...items];
                             const idx = newItems.findIndex(i => i.id === selectedItem.id);
                             newItems[idx].weightKg = Number(e.target.value);
                             setItems(newItems);
                        }} />
                    </div>
                </div>

                {/* Quantity & Pack Config */}
                <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Quantity</span>
                        <div className="flex items-center gap-2">
                             <button onClick={() => {
                                 const newItems = [...items];
                                 const item = newItems.find(i => i.id === selectedItemId);
                                 if (item && (item.quantity || 1) > 1) {
                                     item.quantity = (item.quantity || 1) - 1;
                                     setItems(newItems);
                                 }
                             }} className="w-8 h-8 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold">-</button>
                             <span className="w-8 text-center font-mono">{selectedItem.quantity || 1}</span>
                             <button onClick={() => {
                                 const newItems = [...items];
                                 const item = newItems.find(i => i.id === selectedItemId);
                                 if (item) {
                                     item.quantity = (item.quantity || 1) + 1;
                                     setItems(newItems);
                                 }
                             }} className="w-8 h-8 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold">+</button>
                        </div>
                    </div>
                    
                    {(selectedItem.quantity || 1) > 1 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                             <input 
                                type="checkbox" 
                                id="packTogether" 
                                checked={selectedItem.packTogether || false}
                                onChange={(e) => {
                                    const newItems = [...items];
                                    const idx = newItems.findIndex(i => i.id === selectedItemId);
                                    if(idx >= 0) {
                                        newItems[idx].packTogether = e.target.checked;
                                        // Reset custom dimensions to allow recalculation if needed, or leave to user
                                    }
                                    setItems(newItems);
                                }}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                             />
                             <label htmlFor="packTogether" className="text-sm text-slate-700 font-medium cursor-pointer select-none flex items-center gap-1">
                                Pack all {selectedItem.quantity} items in one box?
                             </label>
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Recommended Packaging</h4>
                    <p className="text-[10px] text-slate-400 mb-2 italic">Pricing based on Volume (Ref: 30cm³ @ $5) + Weight Charge</p>
                    <div className="space-y-2">
                        {/* Custom / Modular Option */}
                        <div 
                            onClick={() => {
                                const newItems = [...items];
                                const idx = newItems.findIndex(i => i.id === selectedItem.id);
                                newItems[idx].assignedBoxId = 'custom';
                                // Init custom dims if not set
                                if (!newItems[idx].customBoxDimensions) {
                                    newItems[idx].customBoxDimensions = {
                                        length: selectedItem.dimensions.length + 2,
                                        width: selectedItem.dimensions.width + 2,
                                        height: selectedItem.dimensions.height + 2
                                    };
                                }
                                setItems(newItems);
                            }}
                            className={`p-3 rounded border flex justify-between items-center transition-all cursor-pointer ${
                                isCustomBox 
                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Maximize className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-indigo-900">Custom / Modular Box</p>
                                    <p className="text-xs text-indigo-600">Dynamic Resize & Efficiency</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm text-indigo-900">${customBoxPrice.toFixed(2)}</p>
                                <p className="text-xs text-indigo-500">+20% Custom Fee</p>
                                {isCustomBox && <span className="mt-1 inline-block text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">EDITING</span>}
                            </div>
                        </div>

                        {/* Standard Boxes */}
                        {boxes.map(box => {
                            const qty = selectedItem.packTogether ? 1 : (selectedItem.quantity || 1);
                            
                            // Pricing Calculation for Standard Box
                            const boxVol = box.dimensions.length * box.dimensions.width * box.dimensions.height;
                            const totalBoxVol = boxVol * qty; // Volume of the packaging we are buying
                            const packagingCost = totalBoxVol * PRICE_PER_CC;
                            const totalWeight = selectedItem.weightKg * (selectedItem.quantity || 1);
                            const shippingCost = totalWeight * WEIGHT_CHARGE_PER_KG;
                            const totalPrice = packagingCost + shippingCost;

                            // Volume / Fit Checks
                            const singleItemVol = selectedItem.dimensions.length * selectedItem.dimensions.width * selectedItem.dimensions.height;
                            const totalItemVol = singleItemVol * (selectedItem.packTogether ? (selectedItem.quantity || 1) : 1);
                            
                            // Simple efficiency check
                            const fitsVol = totalItemVol <= boxVol;
                            const efficiency = fitsVol ? Math.round((totalItemVol / boxVol) * 100) : 0;
                            
                            // Simple Geometric check (relaxed for bulk)
                            const fitsGeo = selectedItem.packTogether ? fitsVol : (
                                box.dimensions.length >= selectedItem.dimensions.length && 
                                box.dimensions.height >= selectedItem.dimensions.height && 
                                box.dimensions.width >= selectedItem.dimensions.width
                            );
                            
                            const fits = fitsGeo;

                            return (
                                <div 
                                    key={box.id}
                                    onClick={() => fits && (() => {
                                        const newItems = [...items];
                                        const idx = newItems.findIndex(i => i.id === selectedItem.id);
                                        newItems[idx].assignedBoxId = box.id;
                                        setItems(newItems);
                                    })()}
                                    className={`p-3 rounded border flex justify-between items-center transition-all ${
                                        selectedItem.assignedBoxId === box.id 
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                        : fits ? 'border-slate-200 hover:bg-slate-50 cursor-pointer' : 'border-slate-100 bg-slate-100 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    <div>
                                        <p className="font-medium text-sm flex items-center gap-2">
                                            {box.name}
                                            {efficiency > 85 && fits && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold">ECO PICK</span>}
                                        </p>
                                        <p className="text-xs text-slate-500">{box.dimensions.length}x{box.dimensions.width}x{box.dimensions.height} cm</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-slate-700">${totalPrice.toFixed(2)}</p>
                                        {fits ? (
                                            <p className="text-xs text-green-600">{efficiency}% efficient</p>
                                        ) : (
                                            <p className="text-xs text-red-400">Too small</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
         ) : (
             <div className="h-full flex items-center justify-center text-slate-400">
                 Select an item to view details
             </div>
         )}
      </div>

      {/* Right: 3D Visualization */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 p-1 flex flex-col h-full">
         <div className="flex-1 rounded-lg overflow-hidden relative">
            {selectedItem ? (
                <Item3DView 
                    itemDimensions={selectedItem.dimensions} 
                    boxDimensions={isCustomBox ? (selectedItem.customBoxDimensions || null) : (selectedBox ? selectedBox.dimensions : null)}
                    itemShape={selectedItem.shape}
                    isResizable={isCustomBox}
                    onBoxResize={handleCustomBoxResize}
                    quantity={selectedItem.quantity || 1}
                    packTogether={selectedItem.packTogether || false}
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                     <Package className="w-16 h-16 opacity-20" />
                     <p>Select an item to see 3D fit</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ClientPacking;