import React from 'react';
import { BoxType } from '../../types';
import { Box, Plus, Trash } from 'lucide-react';

interface Props {
  boxes: BoxType[];
  setBoxes: (boxes: BoxType[]) => void;
}

const BoxLibrary: React.FC<Props> = ({ boxes, setBoxes }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Box className="w-6 h-6 text-blue-600" /> Packaging Library
            </h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add New Box Size
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boxes.map(box => (
                <div key={box.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
                    <div className="h-2" style={{ backgroundColor: box.color }}></div>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-lg text-slate-800">{box.name}</h3>
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">ID: {box.id}</span>
                        </div>
                        
                        <div className="space-y-3 mt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Dimensions</span>
                                <span className="font-mono text-slate-700">{box.dimensions.length} × {box.dimensions.width} × {box.dimensions.height} cm</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Max Load</span>
                                <span className="font-medium text-slate-700">{box.maxWeightKg} kg</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Volume</span>
                                <span className="font-medium text-slate-700">{((box.dimensions.length * box.dimensions.width * box.dimensions.height)/1000).toFixed(1)} L</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 bg-white text-red-500 rounded-full shadow hover:bg-red-50"><Trash className="w-4 h-4" /></button>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Tip:</strong> Keep a diverse range of box sizes (Small, Long, Flat, Large) to maximize the efficiency algorithm score.
        </div>
    </div>
  );
};

export default BoxLibrary;