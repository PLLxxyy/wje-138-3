import { request } from '../utils/request';
import { apiPaths } from '../constants/apiPaths';
import type { Vehicle } from '../types';
export const vehicleApi = {
  list: <T>() => request<T[]>(apiPaths.vehicles),
  get: (id: number) => request<Vehicle>(`${apiPaths.vehicles}${id}/`)
};
