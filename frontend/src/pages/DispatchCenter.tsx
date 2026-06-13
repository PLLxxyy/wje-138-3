import { useEffect, useState } from 'react';
import { Button, Card, InputNumber, Modal, Select, Table, message } from 'antd';
import { dispatchApi } from '../api/dispatch';
import { vehicleApi } from '../api/vehicle';
import type { DispatchOrder, Vehicle } from '../types';
import { DispatchStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Timeline } from '../components/common/Timeline';
import { PageShell } from './PageShell';

export function DispatchCenter() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [completeTarget, setCompleteTarget] = useState<DispatchOrder | null>(null);
  const [actualMileage, setActualMileage] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [vehicleBefore, setVehicleBefore] = useState<Vehicle | null>(null);
  const [vehicleAfter, setVehicleAfter] = useState<Vehicle | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ mileageDelta: number; fuelDelta: number; fuelChanged: boolean; statusChanged: boolean; mileageMatch: boolean } | null>(null);

  const fetchOrders = () => { dispatchApi.list().then(setOrders).catch(() => setOrders([])); };
  useEffect(fetchOrders, []);

  const openCompleteModal = async (order: DispatchOrder) => {
    setCompleteTarget(order);
    setActualMileage(null);
    setVehicleBefore(null);
    setVehicleAfter(null);
    setVerifyResult(null);
    try {
      const v = await vehicleApi.get(order.vehicleId);
      setVehicleBefore(v);
    } catch { /* ignore */ }
  };

  const closeModal = () => {
    setCompleteTarget(null);
    setActualMileage(null);
    setVehicleBefore(null);
    setVehicleAfter(null);
    setVerifyResult(null);
    if (verifyResult) fetchOrders();
  };

  const handleComplete = async () => {
    if (verifyResult) {
      closeModal();
      return;
    }
    if (!completeTarget || !actualMileage || actualMileage <= 0) {
      message.warning('请输入有效的实际里程');
      return;
    }
    setCompleting(true);
    try {
      const result = await dispatchApi.complete(completeTarget.id, { actualMileage });
      let afterVehicle: Vehicle | null = null;
      try {
        afterVehicle = await vehicleApi.get(completeTarget.vehicleId);
        setVehicleAfter(afterVehicle);
      } catch { /* ignore */ }
      if (vehicleBefore && afterVehicle) {
        const mileageDelta = afterVehicle.mileage - vehicleBefore.mileage;
        const fuelDelta = +(afterVehicle.fuelConsumption - vehicleBefore.fuelConsumption).toFixed(1);
        const fuelChanged = fuelDelta !== 0;
        const statusChanged = afterVehicle.status !== vehicleBefore.status;
        const mileageMatch = mileageDelta === actualMileage;
        setVerifyResult({ mileageDelta, fuelDelta, fuelChanged, statusChanged, mileageMatch });
        if (mileageMatch) {
          message.success(`车辆里程已更新 +${mileageDelta}km，油耗效率${fuelChanged ? `变化 ${fuelDelta > 0 ? '+' : ''}${fuelDelta} L/100km` : '无变化'}`);
        } else {
          message.warning(`里程更新不符：期望 +${actualMileage}km，实际 +${mileageDelta}km，请检查`);
        }
      } else if (result.vehicleBefore && result.vehicleAfter) {
        const vb = result.vehicleBefore;
        const va = result.vehicleAfter;
        const mileageDelta = va.mileage - vb.mileage;
        const fuelDelta = +(va.fuelConsumption - vb.fuelConsumption).toFixed(1);
        const fuelChanged = fuelDelta !== 0;
        const mileageMatch = mileageDelta === actualMileage;
        setVerifyResult({ mileageDelta, fuelDelta, fuelChanged, statusChanged: va.status !== vb.status, mileageMatch });
        if (mileageMatch) {
          message.success(`车辆里程已更新 +${mileageDelta}km，油耗效率${fuelChanged ? `变化 ${fuelDelta > 0 ? '+' : ''}${fuelDelta} L/100km` : '无变化'}`);
        }
      } else {
        message.success('调度单已完成');
        closeModal();
      }
    } catch {
      message.error('完成调度单失败');
    } finally {
      setCompleting(false);
    }
  };

  return <PageShell title="调度中心">
    <div className="grid grid-2">
      <Card title="调度单"><Select defaultValue="all" options={[{ value: 'all', label: '全部状态' }]} /><Button type="primary" style={{ marginLeft: 12 }}>创建调度单</Button><Table rowKey="id" dataSource={orders} columns={[
        { title: '单号', dataIndex: 'orderNo' },
        { title: '路线', render: (_: unknown, r: DispatchOrder) => `${r.origin} → ${r.destination}` },
        { title: '实际里程(km)', dataIndex: 'actualMileage', render: (v: number) => v > 0 ? v.toLocaleString() : '-' },
        { title: '状态', render: (_: unknown, r: DispatchOrder) => <StatusBadge status={r.status} /> },
        { title: '操作', render: (_: unknown, r: DispatchOrder) => r.status === DispatchStatus.InProgress ? <Button size="small" type="link" onClick={() => openCompleteModal(r)}>完成运输</Button> : null }
      ]} pagination={false} /></Card>
      <Card title="运输时间线"><Timeline items={['创建调度单', '指派车辆与司机', '开始运输', '完成运输']} /></Card>
    </div>
    <Modal title="完成运输 — 填写实际里程" open={!!completeTarget} onOk={handleComplete} confirmLoading={completing} onCancel={closeModal} okText={verifyResult ? '关闭' : '确认完成'} cancelButtonProps={verifyResult ? { style: { display: 'none' } } : undefined} width={560}>
      <p>调度单：<strong>{completeTarget?.orderNo}</strong></p>
      <p>路线：{completeTarget?.origin} → {completeTarget?.destination}</p>
      {vehicleBefore && <p>当前车辆：{vehicleBefore.plateNo} | 总里程 <strong>{vehicleBefore.mileage.toLocaleString()} km</strong> | 油耗 <strong>{vehicleBefore.fuelConsumption} L/100km</strong> | 状态 <StatusBadge status={vehicleBefore.status} /></p>}
      <div style={{ marginTop: 16 }}>
        <span>实际里程(km)：</span>
        <InputNumber min={1} style={{ width: 200 }} value={actualMileage} onChange={(v: number | null) => setActualMileage(v)} placeholder="请输入本趟实际里程" />
      </div>
      {vehicleBefore && actualMileage && actualMileage > 0 && <p style={{ marginTop: 8, color: '#1677ff' }}>预计更新：总里程 {vehicleBefore.mileage.toLocaleString()} → {(vehicleBefore.mileage + actualMileage).toLocaleString()} km</p>}
      {vehicleAfter && verifyResult && <div style={{ marginTop: 12, padding: 12, background: verifyResult.mileageMatch ? '#f6ffed' : '#fff2f0', border: `1px solid ${verifyResult.mileageMatch ? '#b7eb8f' : '#ffccc7'}`, borderRadius: 6 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>接口验证：车辆数据{verifyResult.mileageMatch ? '已正确更新' : '更新异常'}</p>
        <p style={{ margin: '4px 0 0' }}>里程变更：{vehicleBefore?.mileage.toLocaleString()} → {vehicleAfter.mileage.toLocaleString()} km（+{verifyResult.mileageDelta} km）{verifyResult.mileageMatch ? <span style={{ color: '#52c41a' }}>✓ 与输入一致</span> : <span style={{ color: '#ff4d4f' }}>✗ 与输入 {actualMileage} km 不符</span>}</p>
        <p style={{ margin: '4px 0 0' }}>油耗效率：{vehicleBefore?.fuelConsumption} → {vehicleAfter.fuelConsumption} L/100km{verifyResult.fuelChanged ? `（变化 ${verifyResult.fuelDelta > 0 ? '+' : ''}${verifyResult.fuelDelta}）` : '（无变化）'}</p>
        <p style={{ margin: '4px 0 0' }}>车辆状态：{vehicleBefore?.status} → {vehicleAfter.status}{verifyResult.statusChanged ? '（已变更）' : ''}</p>
      </div>}
      {!vehicleAfter && <p style={{ marginTop: 12, color: '#888', fontSize: 12 }}>提交后车辆总里程与油耗效率将自动更新</p>}
    </Modal>
  </PageShell>;
}
