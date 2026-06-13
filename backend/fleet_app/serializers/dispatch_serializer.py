from rest_framework import serializers
from fleet_app import models

class DispatchSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    orderNo = serializers.CharField(source='order_no', max_length=40, required=False)
    vehicleId = serializers.IntegerField(source='vehicle_id', required=False, allow_null=True)
    driverId = serializers.IntegerField(source='driver_id', required=False, allow_null=True)
    origin = serializers.CharField(max_length=120, required=False)
    destination = serializers.CharField(max_length=120, required=False)
    planDepartAt = serializers.DateTimeField(source='plan_depart_at', required=False, allow_null=True)
    planArriveAt = serializers.DateTimeField(source='plan_arrive_at', required=False, allow_null=True)
    actualDepartAt = serializers.DateTimeField(source='actual_depart_at', required=False, allow_null=True)
    actualArriveAt = serializers.DateTimeField(source='actual_arrive_at', required=False, allow_null=True)
    actualMileage = serializers.IntegerField(source='actual_mileage', required=False, default=0)
    cargo = serializers.CharField(max_length=160, required=False)
    weight = serializers.FloatField(required=False, default=0)
    freight = serializers.FloatField(required=False, default=0)
    status = serializers.CharField(max_length=24, required=False)
    creatorId = serializers.IntegerField(source='creator_id', required=False, default=1)
    note = serializers.CharField(required=False, allow_blank=True)

class CompleteOrderSerializer(serializers.Serializer):
    actualMileage = serializers.IntegerField(min_value=1)
    actualArriveAt = serializers.DateTimeField(required=False, allow_null=True)
