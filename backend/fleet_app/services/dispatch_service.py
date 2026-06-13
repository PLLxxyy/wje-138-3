from datetime import datetime
from fleet_app.services.vehicle_service import get_vehicle, update_vehicle_mileage_and_fuel
from fleet_app.services.fuel_analytics_service import list_fuel_records

_ORDERS = [
    {
        'id': 1,
        'orderNo': 'DSP-20260612-0001',
        'vehicleId': 1,
        'driverId': 1,
        'origin': '上海青浦仓',
        'destination': '杭州萧山仓',
        'planDepartAt': '2026-06-12 09:00',
        'planArriveAt': '2026-06-12 13:30',
        'actualDepartAt': '2026-06-12 09:15',
        'actualArriveAt': None,
        'actualMileage': 0,
        'cargo': '冷链食品',
        'weight': 8200,
        'freight': 7200,
        'status': 'InProgress',
        'creatorId': 1,
        'note': '优先发车'
    },
    {
        'id': 2,
        'orderNo': 'DSP-20260612-0002',
        'vehicleId': 2,
        'driverId': 2,
        'origin': '苏州园区',
        'destination': '宁波北仑',
        'planDepartAt': '2026-06-12 14:00',
        'planArriveAt': '2026-06-12 20:30',
        'actualDepartAt': None,
        'actualArriveAt': None,
        'actualMileage': 0,
        'cargo': '建筑材料',
        'weight': 16000,
        'freight': 9800,
        'status': 'Assigned',
        'creatorId': 1,
        'note': ''
    },
]

_NEXT_ID = 3

def list_orders():
    return list(_ORDERS)

def create_order(payload):
    global _NEXT_ID
    order = {
        'id': _NEXT_ID,
        'orderNo': payload.get('orderNo', f'DSP-{datetime.now().strftime("%Y%m%d")}-{_NEXT_ID:04d}'),
        'vehicleId': payload.get('vehicleId'),
        'driverId': payload.get('driverId'),
        'origin': payload.get('origin', ''),
        'destination': payload.get('destination', ''),
        'planDepartAt': payload.get('planDepartAt'),
        'planArriveAt': payload.get('planArriveAt'),
        'actualDepartAt': None,
        'actualArriveAt': None,
        'actualMileage': 0,
        'cargo': payload.get('cargo', ''),
        'weight': payload.get('weight', 0),
        'freight': payload.get('freight', 0),
        'status': payload.get('status', 'Pending'),
        'creatorId': payload.get('creatorId', 1),
        'note': payload.get('note', '')
    }
    _ORDERS.append(order)
    _NEXT_ID += 1
    return order

def _recalc_fuel_consumption(vehicle_id, current_fuel):
    records = [r for r in list_fuel_records() if r['vehicleId'] == vehicle_id]
    records.sort(key=lambda r: r['date'])
    if len(records) >= 2:
        total_liters = 0.0
        total_mileage_delta = 0
        for i in range(1, len(records)):
            delta = records[i]['mileage'] - records[i - 1]['mileage']
            if delta > 0:
                total_liters += records[i]['liters']
                total_mileage_delta += delta
        if total_mileage_delta > 0:
            return round(total_liters / total_mileage_delta * 100, 1)
    return current_fuel

def complete_order(order_id, payload):
    actual_mileage = int(payload.get('actualMileage', 0))
    if actual_mileage <= 0:
        raise ValueError('实际里程必须大于 0')
    for i, o in enumerate(_ORDERS):
        if o['id'] == order_id:
            if o['status'] == 'Completed':
                raise ValueError('该调度单已完成')
            o['status'] = 'Completed'
            o['actualMileage'] = actual_mileage
            o['actualArriveAt'] = payload.get('actualArriveAt') or datetime.now().strftime('%Y-%m-%d %H:%M')
            if not o.get('actualDepartAt'):
                o['actualDepartAt'] = o['planDepartAt']
            vehicle = get_vehicle(o['vehicleId'])
            if vehicle is not None:
                new_mileage = vehicle['mileage'] + actual_mileage
                new_fuel = _recalc_fuel_consumption(o['vehicleId'], vehicle['fuelConsumption'])
                update_vehicle_mileage_and_fuel(o['vehicleId'], new_mileage, new_fuel)
            return _ORDERS[i]
    return None

def get_order(order_id):
    for o in _ORDERS:
        if o['id'] == order_id:
            return o
    return None
