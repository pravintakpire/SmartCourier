import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Container, PackedItem } from '../../types';

interface Container3DViewProps {
  container: Container;
  packedItems: PackedItem[];
  showFreeSpace: boolean;
  animateLoading: boolean;
}

interface BoxMeshProps {
    item: PackedItem;
    isAnimated: boolean;
    index: number;
    totalItems: number;
}

const BoxMesh: React.FC<BoxMeshProps> = ({ item, isAnimated, index, totalItems }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const targetPos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
    
    useFrame((state, delta) => {
        if (!isAnimated) {
            if (meshRef.current) meshRef.current.position.copy(targetPos);
            return;
        }

        if (meshRef.current) {
            // Simple animation stagger based on index
            const startTime = index * 0.1;
            const elapsedTime = state.clock.getElapsedTime();
            
            if (elapsedTime < startTime) {
                meshRef.current.visible = false;
            } else {
                meshRef.current.visible = true;
                const progress = Math.min((elapsedTime - startTime) * 2, 1); // 0.5s duration
                // Animate from top
                const startPos = new THREE.Vector3(targetPos.x, targetPos.y + 100, targetPos.z);
                meshRef.current.position.lerpVectors(startPos, targetPos, progress);
            }
        }
    });

    return (
        <group>
            <mesh ref={meshRef}>
                <boxGeometry args={[item.dimensions.length, item.dimensions.height, item.dimensions.width]} />
                <meshStandardMaterial color={item.color} />
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(item.dimensions.length, item.dimensions.height, item.dimensions.width)]} />
                    <lineBasicMaterial color="black" linewidth={2} opacity={0.2} transparent />
                </lineSegments>
            </mesh>
        </group>
    );
}

const FreeSpaceVisualizer = ({ container, packedItems }: { container: Container, packedItems: PackedItem[] }) => {
    // Simplified free space visualization: Just showing a volume above the max height used
    const maxHeight = packedItems.reduce((max, p) => Math.max(max, p.position.y + p.dimensions.height/2), 0);
    const freeHeight = container.dimensions.height - maxHeight;
    
    if (freeHeight <= 1) return null; // Tolerance

    return (
         <group position={[container.dimensions.length/2, maxHeight + freeHeight/2, container.dimensions.width/2]}>
             <mesh>
                <boxGeometry args={[container.dimensions.length, freeHeight, container.dimensions.width]} />
                <meshStandardMaterial color="#f87171" transparent opacity={0.25} />
             </mesh>
             {/* Wireframe for better visibility of volume */}
             <mesh>
                 <boxGeometry args={[container.dimensions.length, freeHeight, container.dimensions.width]} />
                 <meshBasicMaterial color="#fca5a5" wireframe opacity={0.5} transparent />
             </mesh>
         </group>
    );
};

const Container3DView: React.FC<Container3DViewProps> = ({ container, packedItems, showFreeSpace, animateLoading }) => {
  // Center the container logic
  const cx = container.dimensions.length / 2;
  const cy = container.dimensions.height / 2;
  const cz = container.dimensions.width / 2;

  // Camera settings
  const camPos = new THREE.Vector3(container.dimensions.length * 1.5, container.dimensions.height * 2, container.dimensions.width * 2);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-2xl relative">
      <Canvas camera={{ position: [camPos.x, camPos.y, camPos.z], fov: 50, near: 1, far: 5000 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[100, 200, 100]} intensity={1.5} castShadow />
        <OrbitControls target={[cx, cy, cz]} makeDefault />
        <Grid infiniteGrid fadeDistance={500} sectionColor="#4f4f4f" cellColor="#2f2f2f" position={[0, -1, 0]} />

        {/* Container Wireframe */}
        <group position={[cx, cy, cz]}>
           <mesh>
             <boxGeometry args={[container.dimensions.length, container.dimensions.height, container.dimensions.width]} />
             <meshBasicMaterial color="#94a3b8" wireframe />
           </mesh>
           {/* Floor */}
           <mesh position={[0, -container.dimensions.height/2, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[container.dimensions.length, container.dimensions.width]} />
             <meshStandardMaterial color="#334155" opacity={0.5} transparent />
           </mesh>
        </group>

        {/* Packed Items */}
        {packedItems.map((item, idx) => (
            <BoxMesh 
                key={`${item.itemId}-${idx}`} 
                item={item} 
                isAnimated={animateLoading} 
                index={idx}
                totalItems={packedItems.length}
            />
        ))}

        {/* Free Space Overlay */}
        {showFreeSpace && <FreeSpaceVisualizer container={container} packedItems={packedItems} />}

      </Canvas>
       <div className="absolute bottom-4 left-4 bg-black/60 p-2 rounded text-white text-xs pointer-events-none select-none">
         <div className="flex items-center gap-2 mb-1">
             <div className="w-3 h-3 border border-slate-400"></div> Container
         </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-red-400/30 border border-red-400"></div> Free Space
         </div>
         {/* Hover Tooltip (Basic Implementation - React Three Fiber usually needs Raycaster for interactivity but this is a static label for now) */}
         <div className="mt-2 pt-2 border-t border-white/20 text-[10px] text-slate-300">
             Hover/Click support coming in v2
         </div>
       </div>
    </div>
  );
};

export default Container3DView;