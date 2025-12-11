export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface BoxType {
  id: string;
  name: string;
  dimensions: Dimensions;
  maxWeightKg: number;
  color: string;
  cost?: number;
}

export interface Item {
  id: string;
  name: string;
  weightKg: number;
  dimensions: Dimensions; // Estimated or actual
  shape: 'box' | 'cylinder' | 'irregular';
  isFragile: boolean;
  isStackable: boolean;
  imageUrl?: string;
  assignedBoxId?: string; // The box type selected for this item
  customBoxDimensions?: Dimensions; // For modular packaging
  quantity?: number;
  packTogether?: boolean; // If true, quantity > 1 means "pack all in one box"
  clientId?: string; // Randomly assigned client ID
}

export interface PackedItem {
  itemId: string;
  boxTypeId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // 0 or 90 degrees mostly
  dimensions: Dimensions; // The outer box dimensions
  color: string;
  weightKg: number;
  clientId?: string;
}

export interface Container {
  id: string;
  name: string;
  dimensions: Dimensions;
  maxWeightKg: number;
  color?: string; // Optional visual color
  isActive?: boolean;
}

export interface PricingRule {
  type: 'flat' | 'slab';
  baseRatePerKg: number;
  slabs?: { maxKg: number; rate: number }[];
}

export interface PackingSolution {
  containerId: string;
  packedItems: PackedItem[];
  unpackedItems: Item[]; // Items that didn't fit
  metrics: {
    volumeUtilization: number; // percentage
    totalWeight: number;
    boxCount: number;
    freeVolume: number;
  }
}