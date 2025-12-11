import { BoxType, Container, Dimensions, Item, PackedItem, PackingSolution } from "../types";

// --- Box Selection Logic ---

export const findBestBox = (item: Item, boxes: BoxType[]): { box: BoxType; efficiency: number; price: number } | null => {
  // Filter boxes that fit the item
  const candidates = boxes.filter(box => 
    box.dimensions.length >= item.dimensions.length &&
    box.dimensions.width >= item.dimensions.width &&
    box.dimensions.height >= item.dimensions.height &&
    box.maxWeightKg >= item.weightKg
  );

  if (candidates.length === 0) return null;

  // Sort by volume (smallest fit)
  candidates.sort((a, b) => getVolume(a.dimensions) - getVolume(b.dimensions));
  
  const bestBox = candidates[0];
  const itemVol = getVolume(item.dimensions);
  const boxVol = getVolume(bestBox.dimensions);
  const efficiency = (itemVol / boxVol) * 100;

  // Placeholder price calc
  const price = 10 + (item.weightKg * 2); 

  return { box: bestBox, efficiency, price };
};

const getVolume = (d: Dimensions) => d.length * d.width * d.height;

// --- Container Packing Logic (Simplified Heuristic) ---

export const packContainer = (items: Item[], boxTypes: BoxType[], container: Container): PackingSolution => {
  // 1. Prepare items to pack (convert items to their assigned box dimensions)
  const boxesToPack: { item: Item; dimensions: Dimensions; color: string; boxId: string }[] = [];
  const unpacked: Item[] = [];

  items.forEach(item => {
    // If Custom / Modular Box
    if (item.assignedBoxId === 'custom' && item.customBoxDimensions) {
         boxesToPack.push({
             item,
             dimensions: item.customBoxDimensions,
             color: '#a78bfa', // Distinct color for custom boxes
             boxId: 'custom'
         });
    } 
    // If Standard Box
    else if (item.assignedBoxId) {
      const boxType = boxTypes.find(b => b.id === item.assignedBoxId);
      if (boxType) {
        boxesToPack.push({ 
            item, 
            dimensions: boxType.dimensions,
            color: boxType.color,
            boxId: boxType.id
        });
      } else {
        unpacked.push(item);
      }
    } else {
        unpacked.push(item);
    }
  });

  // Sort by height (descending) to create flatter layers, then by base area
  boxesToPack.sort((a, b) => b.dimensions.height - a.dimensions.height || 
                             (b.dimensions.length * b.dimensions.width) - (a.dimensions.length * a.dimensions.width));

  const packedItems: PackedItem[] = [];
  
  // Simplified "Shelf" Algorithm for MVP 3D Visualization
  // Concept: Fill along X, then Z, then Y.
  
  let currentX = 0;
  let currentY = 0;
  let currentZ = 0;
  let maxRowHeight = 0;
  let maxShelfZ = 0;

  boxesToPack.forEach(({ item, dimensions, color, boxId }) => {
    // Check if we need a new row (X axis full)
    if (currentX + dimensions.length > container.dimensions.length) {
      currentX = 0;
      currentZ += maxShelfZ; // Move "back" in Z
      maxShelfZ = 0; // Reset for new row
    }

    // Check if we need a new shelf/layer (Z axis full)
    if (currentZ + dimensions.width > container.dimensions.width) {
      currentX = 0;
      currentZ = 0;
      currentY += maxRowHeight; // Move "up" in Y
      maxRowHeight = 0;
    }

    // Check if we fit in height (Y axis full)
    if (currentY + dimensions.height <= container.dimensions.height) {
      // Place it
      packedItems.push({
        itemId: item.id,
        boxTypeId: boxId,
        position: { x: currentX + dimensions.length/2, y: currentY + dimensions.height/2, z: currentZ + dimensions.width/2 }, // Centered anchor for Three.js usually
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { ...dimensions },
        color: color,
        weightKg: item.weightKg,
        clientId: item.clientId
      });

      // Update cursors
      currentX += dimensions.length;
      maxRowHeight = Math.max(maxRowHeight, dimensions.height);
      maxShelfZ = Math.max(maxShelfZ, dimensions.width);
    } else {
      unpacked.push(item);
    }
  });

  const usedVolume = packedItems.reduce((acc, p) => acc + getVolume(p.dimensions), 0);
  const totalVolume = getVolume(container.dimensions);
  const totalWeight = packedItems.reduce((acc, p) => acc + p.weightKg, 0);

  return {
    containerId: container.id,
    packedItems,
    unpackedItems: unpacked,
    metrics: {
      volumeUtilization: (usedVolume / totalVolume) * 100,
      totalWeight,
      boxCount: packedItems.length,
      freeVolume: (totalVolume - usedVolume) / 1000000 // Convert cm3 to m3
    }
  };
};