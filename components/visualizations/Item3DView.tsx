import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text, PerspectiveCamera, GizmoHelper, GizmoViewport, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Dimensions } from '../../types';
import { RotateCcw, Play, Pause, ScanEye, Maximize, ArrowRightLeft } from 'lucide-react';

interface Item3DViewProps {
  itemDimensions: Dimensions;
  boxDimensions: Dimensions | null;
  itemShape: 'box' | 'cylinder' | 'irregular';
  isResizable?: boolean;
  onBoxResize?: (newDims: Dimensions) => void;
  quantity?: number;
  packTogether?: boolean;
}

const Item3DView: React.FC<Item3DViewProps> = ({ 
    itemDimensions, 
    boxDimensions, 
    itemShape, 
    isResizable = false, 
    onBoxResize,
    quantity = 1,
    packTogether = false
}) => {
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<any>(null);

  // Effective quantity to visualize
  const displayQty = packTogether ? quantity : 1;

  // Local state for sliders to ensure smooth UI updates
  // Initialize with box dimensions if available, otherwise default to item or cluster
  const [localBoxDims, setLocalBoxDims] = useState<Dimensions>(boxDimensions || itemDimensions);

  // Determine the constraints for packing items
  // If Resizable (Modular), the local state is the constraint.
  // If Standard Box, the prop is the constraint.
  // If neither (initial), we have no constraint and fall back to cubic packing.
  const layoutConstraints = isResizable ? localBoxDims : boxDimensions;

  // Calculate layout for multiple items with REFLOW logic
  const { positions: itemLayout, bounds: contentBounds } = useMemo(() => {
    if (displayQty <= 1) {
        return { 
            positions: [{ x: 0, y: 0, z: 0 }],
            bounds: itemDimensions
        };
    }

    const gap = 0.5; // Small gap for visual separation
    const iL = itemDimensions.length + gap;
    const iW = itemDimensions.width + gap;
    const iH = itemDimensions.height + gap;

    const positions: {x: number, y: number, z: number}[] = [];

    // Packing Limits
    // If we have constraints, we try to fit within Length and Width, and stack in Height.
    // If no constraints (initial cubic state), we define a "target" cubic shape.
    let limitCols = 1000;
    let limitRows = 1000;

    if (layoutConstraints) {
        // Calculate how many items fit along X and Z axes
        limitCols = Math.max(1, Math.floor(layoutConstraints.length / iL));
        limitRows = Math.max(1, Math.floor(layoutConstraints.width / iW));
    } else {
        // Fallback to cubic heuristic if no box defined yet (minimize surface area)
        const side = Math.ceil(Math.pow(displayQty, 1/3));
        limitCols = side;
        limitRows = side;
    }

    let count = 0;
    // Fill strategy: Z (Width/Rows) -> X (Length/Cols) -> Y (Height/Layers)
    // This fills the "floor" of the box first
    let currentY = 0;
    
    // Safety break to prevent infinite loops
    while (count < displayQty && currentY < 1000) {
        for (let z = 0; z < limitRows; z++) {
            for (let x = 0; x < limitCols; x++) {
                 if (count >= displayQty) break;
                 
                 positions.push({
                     x: x * iL,
                     y: currentY * iH,
                     z: z * iW
                 });
                 count++;
            }
            if (count >= displayQty) break;
        }
        currentY++;
    }

    // Calculate bounds of the generated cluster
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    positions.forEach(p => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    });

    // Add item half-extents to get full bounding box
    // (Since positions represent the center of each item)
    // Actually, in ThreeJS boxGeometry, 0,0,0 is center. 
    // If we render at `p`, the item extends from p - size/2 to p + size/2.
    // Logic above treats `p` as grid steps `x * iL`. 
    // If x=0, we are at 0. Item extends -L/2 to L/2.
    // If x=1, we are at L+gap. Item extends L+gap - L/2 to L+gap + L/2.
    
    const bounds = {
        length: (maxX - minX) + itemDimensions.length,
        height: (maxY - minY) + itemDimensions.height,
        width: (maxZ - minZ) + itemDimensions.width
    };

    // Center the positions so the whole cluster is centered around (0,0,0) locally
    // EXCEPT Y: We want Y to start at 0 (bottom of cluster aligned) so it sits on floor.
    // Actually, for the `group` logic below, we center everything.
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const centeredPositions = positions.map(p => ({
        x: p.x - centerX,
        y: p.y - centerY, 
        z: p.z - centerZ
    }));

    return { positions: centeredPositions, bounds };

  }, [displayQty, itemDimensions, layoutConstraints]);

  // Sync local state when prop changes, ONLY if switching box contexts
  useEffect(() => {
      if (boxDimensions) {
          setLocalBoxDims(boxDimensions);
      } else if (!isResizable) {
          // If switching to "No Box" standard view, wrap the content
          setLocalBoxDims({
              length: contentBounds.length + 2,
              width: contentBounds.width + 2,
              height: contentBounds.height + 2
          });
      }
  }, [boxDimensions, isResizable]); // Removing contentBounds from dep array to avoid loops

  // The box to visualize. 
  // If resizable, use local state (user controlled).
  // If standard, use prop.
  // Fallback to content bounds if nothing selected.
  const displayBox = isResizable ? localBoxDims : (boxDimensions || contentBounds);
  
  const maxDim = Math.max(
    displayBox.length, displayBox.width, displayBox.height,
    contentBounds.length, contentBounds.width, contentBounds.height
  );
  
  // Dynamic scale factor to keep view consistent regardless of size
  const scaleFactor = 4 / (maxDim || 1);

  const handleReset = () => {
    if (controlsRef.current) {
        controlsRef.current.reset();
    }
    setAutoRotate(false);
  };

  // Efficiency Calculation
  const singleItemVol = itemDimensions.length * itemDimensions.width * itemDimensions.height;
  const totalItemVol = singleItemVol * displayQty;
  const boxVol = displayBox.length * displayBox.width * displayBox.height;
  const efficiency = Math.min(100, Math.round((totalItemVol / boxVol) * 100));

  const handleResize = (dimension: keyof Dimensions, value: number) => {
      // Allow resizing smaller than content? 
      // Usually user wants to shrink wrap. 
      // We limit min size to 1 item dim? Or allow full freedom with warning.
      // Let's limit to at least 1 item size to avoid bugs.
      const minVal = itemDimensions[dimension];
      const newValue = Math.max(Number(value), minVal);
      
      const newDims = { ...localBoxDims, [dimension]: newValue };
      setLocalBoxDims(newDims);
      if (onBoxResize) {
          onBoxResize(newDims);
      }
  };

  const optimizeSize = () => {
      // Aim for ~80% efficiency
      const targetVol = totalItemVol / 0.80;
      const currentVol = boxVol;
      const scaleRatio = Math.cbrt(targetVol / currentVol);

      const newDims = {
          length: Math.max(Math.ceil(localBoxDims.length * scaleRatio), itemDimensions.length),
          width: Math.max(Math.ceil(localBoxDims.width * scaleRatio), itemDimensions.width),
          height: Math.max(Math.ceil(localBoxDims.height * scaleRatio), itemDimensions.height),
      };

      setLocalBoxDims(newDims);
      if (onBoxResize) onBoxResize(newDims);
  };

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-inner relative group" style={{ touchAction: 'none' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={45} />
        
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.0} castShadow />
        <spotLight position={[-10, 10, -5]} intensity={0.5} angle={0.2} />
        
        <Environment preset="city" />

        <OrbitControls 
            ref={controlsRef}
            makeDefault 
            autoRotate={autoRotate}
            autoRotateSpeed={4.0}
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={40}
        />
        
        <Grid 
            infiniteGrid 
            fadeDistance={30} 
            sectionColor="#4f4f4f" 
            cellColor="#2f2f2f" 
            position={[0, -0.01, 0]}
        />

        {/* The Item Cluster */}
        {/* We position the group so the BOTTOM of the cluster is at Y=0 (Floor) */}
        <group position={[0, (contentBounds.height * scaleFactor) / 2, 0]}>
            {itemLayout.map((pos, idx) => (
                <group key={idx} position={[pos.x * scaleFactor, pos.y * scaleFactor, pos.z * scaleFactor]}>
                    {itemShape === 'cylinder' ? (
                        <mesh castShadow receiveShadow>
                            <cylinderGeometry args={[
                                (itemDimensions.width * scaleFactor) / 2, 
                                (itemDimensions.width * scaleFactor) / 2, 
                                itemDimensions.height * scaleFactor, 
                                32
                            ]} />
                            <meshStandardMaterial color="#fcd34d" roughness={0.3} metalness={0.2} />
                        </mesh>
                    ) : itemShape === 'irregular' ? (
                        <mesh castShadow receiveShadow>
                            <dodecahedronGeometry args={[(Math.min(itemDimensions.length, itemDimensions.width) * scaleFactor) / 1.5, 0]} />
                            <meshStandardMaterial color="#fcd34d" roughness={0.3} metalness={0.2} />
                        </mesh>
                    ) : (
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[
                                itemDimensions.length * scaleFactor, 
                                itemDimensions.height * scaleFactor, 
                                itemDimensions.width * scaleFactor
                            ]} />
                            <meshStandardMaterial color="#fcd34d" roughness={0.3} metalness={0.2} />
                        </mesh>
                    )}
                </group>
            ))}
            
            <Text 
                position={[0, contentBounds.height * scaleFactor / 2 + 0.6, 0]} 
                fontSize={0.3} 
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {displayQty > 1 ? `${displayQty} Items` : 'Item'}
            </Text>
        </group>

        {/* The Box */}
        {/* We position the box so its BOTTOM is at Y=0 (Floor) */}
        {(boxDimensions || isResizable) && (
            <group position={[0, (displayBox.height * scaleFactor) / 2, 0]}>
                {/* Translucent Box Shell */}
                <mesh>
                    <boxGeometry args={[
                        displayBox.length * scaleFactor, 
                        displayBox.height * scaleFactor, 
                        displayBox.width * scaleFactor
                    ]} />
                    <meshPhysicalMaterial 
                        color={isResizable ? "#a78bfa" : "white"}
                        transparent 
                        opacity={0.15} 
                        roughness={0.1} 
                        metalness={0.1}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    /> 
                </mesh>
                {/* Wireframe edges */}
                 <mesh>
                    <boxGeometry args={[
                        displayBox.length * scaleFactor, 
                        displayBox.height * scaleFactor, 
                        displayBox.width * scaleFactor
                    ]} />
                    <meshBasicMaterial 
                        color={isResizable ? "#a78bfa" : "#60a5fa"} 
                        wireframe 
                    /> 
                </mesh>
            </group>
        )}

        <ContactShadows opacity={0.6} scale={20} blur={2.5} far={4} color="#000000" />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
        </GizmoHelper>

      </Canvas>

      {/* Box Resizing Controls Overlay */}
      {isResizable && (
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-indigo-500 shadow-2xl w-64">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      <Maximize className="w-4 h-4 text-indigo-400" /> Modular Box
                  </h3>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${efficiency > 75 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {efficiency}% eff.
                  </span>
              </div>
              
              <div className="space-y-3">
                  <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase font-bold">
                          <span>Length (cm)</span>
                          <span className="text-white">{localBoxDims.length}</span>
                      </div>
                      <input 
                        type="range" 
                        min={itemDimensions.length} 
                        max={Math.max(contentBounds.length * 1.5, 100)} 
                        value={localBoxDims.length}
                        onChange={(e) => handleResize('length', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                  </div>
                   <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase font-bold">
                          <span>Width (cm)</span>
                          <span className="text-white">{localBoxDims.width}</span>
                      </div>
                      <input 
                        type="range" 
                        min={itemDimensions.width} 
                        max={Math.max(contentBounds.width * 1.5, 100)} 
                        value={localBoxDims.width}
                        onChange={(e) => handleResize('width', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                  </div>
                   <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase font-bold">
                          <span>Height (cm)</span>
                          <span className="text-white">{localBoxDims.height}</span>
                      </div>
                      <input 
                        type="range" 
                        min={itemDimensions.height} 
                        max={Math.max(contentBounds.height * 1.5, 100)} 
                        value={localBoxDims.height}
                        onChange={(e) => handleResize('height', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                  </div>

                  <button 
                    onClick={optimizeSize}
                    className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                  >
                      <ArrowRightLeft className="w-3 h-3" /> Auto-Optimize (80%)
                  </button>
                  <p className="text-[9px] text-slate-500 text-center mt-1">
                      Based on {displayQty} items in cluster
                  </p>
              </div>
          </div>
      )}

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
         <div className="flex gap-2">
            <button 
                onClick={() => setAutoRotate(!autoRotate)}
                className="p-2 bg-slate-800/80 backdrop-blur-sm text-white rounded-full hover:bg-slate-700 shadow-lg border border-slate-600 transition-colors"
                title={autoRotate ? "Stop Rotation" : "Auto Rotate"}
            >
                {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button 
                onClick={handleReset}
                className="p-2 bg-slate-800/80 backdrop-blur-sm text-white rounded-full hover:bg-slate-700 shadow-lg border border-slate-600 transition-colors"
                title="Reset View"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
         </div>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none select-none">
        <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <ScanEye className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-white/80 font-medium">Interactive 3D Preview</span>
        </div>
      </div>
    </div>
  );
};

export default Item3DView;