_VEHICLES = [
    {
        'id': 1,
        'plateNo': '沪A-7821',
        'type': '冷链车',
        'brandModel': '东风天锦 KR',
        'purchaseDate': '2023-03-12',
        'insuranceExpireDate': '2026-09-30',
        'inspectionExpireDate': '2026-11-20',
        'status': 'OnTrip',
        'mileage': 88210,
        'tankCapacity': 380,
        'fuelConsumption': 24.6
    },
    {
        'id': 2,
        'plateNo': '苏E-5520',
        'type': '重卡',
        'brandModel': '解放 J6P',
        'purchaseDate': '2021-08-06',
        'insuranceExpireDate': '2026-07-15',
        'inspectionExpireDate': '2026-08-22',
        'status': 'Available',
        'mileage': 210430,
        'tankCapacity': 520,
        'fuelConsumption': 31.2
    },
]

def list_vehicles():
    return list(_VEHICLES)

def get_vehicle(vehicle_id):
    for v in _VEHICLES:
        if v['id'] == vehicle_id:
            return v
    return None

def get_vehicle_detail(vehicle_id):
    vehicle = get_vehicle(vehicle_id)
    if vehicle is None:
        return None
    return dict(vehicle)

def update_vehicle_mileage_and_fuel(vehicle_id, new_mileage, new_fuel):
    for i, v in enumerate(_VEHICLES):
        if v['id'] == vehicle_id:
            _VEHICLES[i]['mileage'] = new_mileage
            _VEHICLES[i]['fuelConsumption'] = new_fuel
            if new_mileage > 0:
                _VEHICLES[i]['status'] = 'Available'
            return _VEHICLES[i]
    return None
