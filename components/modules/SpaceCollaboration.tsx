import React, { useState } from 'react';
import { Copy, Check, Globe, Calculator, TrendingUp, DollarSign, Package, Box } from 'lucide-react';

interface Props {
  metrics: {
    volumeUtilization: number;
    freeVolume: number; // m3
    totalVolume?: number; 
  };
  containerName: string;
}

const SpaceSharing: React.FC<Props> = ({ metrics, containerName }) => {
  const [copied, setCopied] = useState(false);
  const [marketRate, setMarketRate] = useState(50); // Default rate per m3

  // Heuristics
  const approxMediumBoxes = Math.floor(metrics.freeVolume / 0.08); // ~0.08 m3 per box
  const approxPallets = Math.floor(metrics.freeVolume / 1.2); // ~1.2 m3 per pallet (stacked)
  const potentialRevenue = metrics.freeVolume * marketRate;

  const percentUsed = metrics.volumeUtilization;
  const percentFree = Math.max(0, 100 - percentUsed);

  const shareText = `Space Available Alert: We have approx ${metrics.freeVolume.toFixed(2)} m³ free in our ${containerName}. Capacity for ~${approxMediumBoxes} med boxes or ~${approxPallets} pallets. Rate: $${marketRate}/m³ (neg). Route departing soon. #Logistics #SpaceSharing`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-emerald-50 p-4 border-b border-emerald-100">
        <h3 className="font-bold text-emerald-800 flex items-center gap-2">
            <Globe className="w-5 h-5" /> Space Exchange
        </h3>
        <p className="text-xs text-emerald-600 mt-1">Monetize your employed empty space.</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
         
         {/* Space Visualization */}
         <div>
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-700">Container Utilization</span>
                <span className="text-xs text-slate-500">{metrics.volumeUtilization.toFixed(1)}% Used</span>
            </div>
            <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div 
                    className="h-full bg-slate-500 flex items-center justify-center text-[10px] text-white font-medium transition-all duration-500" 
                    style={{ width: `${percentUsed}%` }}
                >
                    {percentUsed > 15 && 'Employed'}
                </div>
                <div 
                    className="h-full bg-emerald-400 flex items-center justify-center text-[10px] text-emerald-900 font-bold transition-all duration-500" 
                    style={{ width: `${percentFree}%` }}
                >
                    {percentFree > 15 && 'Rentable'}
                </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-400">
                <span>Cargo</span>
                <span>{metrics.freeVolume.toFixed(2)} m³ Free</span>
            </div>
         </div>

         {/* Rent Calculator */}
         <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <div className="flex items-center gap-2 mb-3">
                 <Calculator className="w-4 h-4 text-indigo-500" />
                 <span className="font-bold text-slate-700 text-sm">Rent Potential Calculator</span>
             </div>
             
             <div className="flex items-center gap-3 mb-4">
                 <div className="flex-1">
                     <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Market Rate ($/m³)</label>
                     <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">$</span>
                        <input 
                            type="number" 
                            value={marketRate} 
                            onChange={(e) => setMarketRate(Number(e.target.value))}
                            className="w-full pl-6 p-1.5 rounded border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>
                 </div>
                 <div className="flex-1">
                     <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Est. Revenue</label>
                     <div className="text-lg font-bold text-emerald-600">
                         ${potentialRevenue.toFixed(0)}
                     </div>
                 </div>
             </div>
             
             <div className="flex gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Renting this space could cover <strong>{((potentialRevenue / 500) * 100).toFixed(0)}%</strong> of fuel costs (est).</span>
             </div>
         </div>

         {/* Capacity Equivalents */}
         <div>
             <p className="text-xs font-bold text-slate-500 uppercase mb-2">Capacity Equivalent</p>
             <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 transition-colors">
                    <Box className="w-5 h-5 text-blue-500" />
                    <span className="text-xl font-bold text-slate-800">{approxMediumBoxes}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Medium Boxes</span>
                 </div>
                 <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-amber-400 transition-colors">
                    <Package className="w-5 h-5 text-amber-500" />
                    <span className="text-xl font-bold text-slate-800">~{approxPallets}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Pallets</span>
                 </div>
             </div>
         </div>

         {/* Share Action */}
         <div className="pt-2 border-t border-slate-100">
             <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Collaboration Message Preview</label>
             <div className="bg-slate-800 text-slate-300 text-xs p-3 rounded-lg font-mono mb-3 leading-relaxed opacity-90">
                 {shareText}
             </div>
             <button 
                onClick={copyToClipboard}
                className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${copied ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
             >
                {copied ? <><Check className="w-4 h-4"/> Copied to Clipboard</> : <><Copy className="w-4 h-4"/> Copy Offer Text</>}
             </button>
         </div>
      </div>
    </div>
  );
};

export default SpaceSharing;