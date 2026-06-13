import { DispatchStatus } from './enums';
export type VehicleSnapshot = { mileage: number; fuelConsumption: number; status: string };
export type DispatchOrder = { id: number; orderNo: string; vehicleId: number; driverId: number; origin: string; destination: string; planDepartAt: string; planArriveAt: string; actualDepartAt?: string; actualArriveAt?: string; actualMileage: number; cargo: string; weight: number; freight: number; status: DispatchStatus; creatorId: number; note?: string; vehicleBefore?: VehicleSnapshot; vehicleAfter?: VehicleSnapshot };
