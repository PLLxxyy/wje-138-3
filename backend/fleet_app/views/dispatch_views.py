from rest_framework.decorators import api_view
from rest_framework.response import Response
from fleet_app.services.dispatch_service import create_order, list_orders, complete_order
from fleet_app.serializers.dispatch_serializer import CompleteOrderSerializer

@api_view(['GET', 'POST'])
def dispatch_orders(request):
    if request.method == 'POST':
        return Response(create_order(request.data), status=201)
    return Response(list_orders())

@api_view(['POST'])
def complete_dispatch_order(request, pk):
    serializer = CompleteOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        result = complete_order(pk, serializer.validated_data)
    except ValueError as e:
        return Response({'detail': str(e)}, status=400)
    if result is None:
        return Response({'detail': '调度单不存在'}, status=404)
    return Response(result)
