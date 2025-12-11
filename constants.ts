import { BoxType, Container, PricingRule } from './types';

export const DEFAULT_BOXES: BoxType[] = [
  { id: 'b1', name: 'Small Cube', dimensions: { length: 30, width: 30, height: 30 }, maxWeightKg: 10, color: '#60a5fa' },
  { id: 'b2', name: 'Medium Standard', dimensions: { length: 50, width: 40, height: 40 }, maxWeightKg: 20, color: '#34d399' },
  { id: 'b3', name: 'Large Mover', dimensions: { length: 60, width: 60, height: 60 }, maxWeightKg: 30, color: '#f87171' },
  { id: 'b4', name: 'Long Box', dimensions: { length: 100, width: 30, height: 30 }, maxWeightKg: 15, color: '#a78bfa' },
];

export const DEFAULT_CONTAINERS: Container[] = [
  { id: 'c1', name: 'Standard Van (Small)', dimensions: { length: 240, width: 140, height: 140 }, maxWeightKg: 800, isActive: true }, // ~4.7 m3
  { id: 'c2', name: '20ft Container (Simulated)', dimensions: { length: 590, width: 235, height: 239 }, maxWeightKg: 20000, isActive: true },
];

export const DEFAULT_PRICING: PricingRule = {
  type: 'slab',
  baseRatePerKg: 5,
  slabs: [
    { maxKg: 5, rate: 10 },   // $10 flat for <5kg
    { maxKg: 10, rate: 18 },  // $18 flat for 5-10kg
    { maxKg: 20, rate: 30 },  // $30 flat for 10-20kg
  ]
};