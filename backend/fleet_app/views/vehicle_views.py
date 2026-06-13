from rest_framework.decorators import api_view
from rest_framework.response import Response
from fleet_app.services.vehicle_service import list_vehicles, get_vehicle_detail

@api_view(['GET'])
def vehicles(request):
    return Response(list_vehicles())

@api_view(['GET'])
def vehicle_detail(request, pk):
    vehicle = get_vehicle_detail(pk)
    if vehicle is None:
        return Response({'detail': '车辆不存在'}, status=404)
    return Response(vehicle)
