
import React from 'react';
import { Truck, Package, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { Logo } from '../ui/Logo';
import Container3DView from '../visualizations/Container3DView';
import { DEFAULT_CONTAINERS, DEFAULT_BOXES } from '../../constants';
import { Item, PackedItem } from '../../types';

interface Props {
  onNavigate: (tab: 'pack' | 'load') => void;
}

const Dashboard: React.FC<Props> = ({ onNavigate }) => {
  // Create a mock packed container for the visual hero section
  const heroContainer = DEFAULT_CONTAINERS[1]; // 20ft container
  
  // Generate some colorful mock boxes for the 3D visualization
  const mockPackedItems: PackedItem[] = Array.from({ length: 40 }).map((_, i) => {
      const box = DEFAULT_BOXES[i % DEFAULT_BOXES.length];
      const xPos = (i % 5) * box.dimensions.length;
      const zPos = (Math.floor(i / 5) % 3) * box.dimensions.width;
      const yPos = Math.floor(i / 15) * box.dimensions.height;
      
      return {
          itemId: `hero-${i}`,
          boxTypeId: box.id,
          position: { x: xPos + 20, y: yPos + 15, z: zPos + 20 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: box.dimensions,
          color: box.color,
          weightKg: 10
      };
  });

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Hero Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-indigo-50/80 to-transparent pointer-events-none"></div>
        
        <div className="flex-1 z-10 space-y-6">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
              <Zap className="w-3 h-3" /> AI-Powered Logistics V2.0
           </div>
           
           <div>
               <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                 Optimize Packing.<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">
                    Maximize Revenue.
                 </span>
               </h1>
               <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                   SmartCourier uses advanced 3D simulation and Gemini AI to eliminate empty space, reduce shipping costs, and monetize your spare container capacity.
               </p>
           </div>

           <div className="flex flex-wrap gap-4">
               <button 
                  onClick={() => onNavigate('pack')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                   <Package className="w-5 h-5" /> Start Packing
               </button>
               <button 
                  onClick={() => onNavigate('load')}
                  className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
               >
                   <Truck className="w-5 h-5" /> Load Simulator
               </button>
           </div>
        </div>

        {/* 3D Visual Hero */}
        <div className="flex-1 w-full h-[400px] lg:h-[450px] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                 <Container3DView 
                    container={heroContainer} 
                    packedItems={mockPackedItems}
                    showFreeSpace={true} 
                    animateLoading={true} 
                 />
            </div>
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none"></div>
            
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10 pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
                    <p className="text-slate-300 text-xs uppercase font-bold mb-1">Live Simulation</p>
                    <div className="flex items-center gap-3">
                        <Logo size="sm" />
                        <div>
                             <p className="text-white font-bold leading-none">SmartCourier</p>
                             <p className="text-indigo-300 text-xs">3D Engine Active</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-default">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Increase Efficiency</h3>
              <p className="text-slate-500 text-sm mb-4">
                  Users report up to <strong>25% more cargo</strong> per shipment by using our AI-driven custom box sizing.
              </p>
          </div>
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-pink-300 transition-colors cursor-default">
              <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Instant Dimensions</h3>
              <p className="text-slate-500 text-sm mb-4">
                  Snap a photo or type a name. Google Gemini AI estimates specs instantly, saving <strong>2-3 mins</strong> per item.
              </p>
          </div>
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors cursor-default">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Monetize Space</h3>
              <p className="text-slate-500 text-sm mb-4">
                  Don't ship air. Identify free container volume and generate collaboration offers to fill your trucks.
              </p>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
