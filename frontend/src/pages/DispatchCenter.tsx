import { useEffect, useState } from 'react';
import { Button, Card, InputNumber, Modal, Select, Table, message } from 'antd';
import { dispatchApi } from '../api/dispatch';
import type { DispatchOrder } from '../types';
import { DispatchStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Timeline } from '../components/common/Timeline';
import { PageShell } from './PageShell';

export function DispatchCenter() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [completeTarget, setCompleteTarget] = useState<DispatchOrder | null>(null);
  const [actualMileage, setActualMileage] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchOrders = () => { dispatchApi.list().then(setOrders).catch(() => setOrders([])); };
  useEffect(fetchOrders, []);

  const handleComplete = async () => {
    if (!completeTarget || !actualMileage || actualMileage <= 0) {
      message.warning('请输入有效的实际里程');
      return;
    }
    setCompleting(true);
    try {
      await dispatchApi.complete(completeTarget.id, { actualMileage });
      message.success('调度单已完成，车辆里程与油耗已更新');
      setCompleteTarget(null);
      setActualMileage(null);
      fetchOrders();
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
        { title: '操作', render: (_: unknown, r: DispatchOrder) => r.status === DispatchStatus.InProgress ? <Button size="small" type="link" onClick={() => { setCompleteTarget(r); setActualMileage(null); }}>完成运输</Button> : null }
      ]} pagination={false} /></Card>
      <Card title="运输时间线"><Timeline items={['创建调度单', '指派车辆与司机', '开始运输', '完成运输']} /></Card>
    </div>
    <Modal title="完成运输 — 填写实际里程" open={!!completeTarget} onOk={handleComplete} confirmLoading={completing} onCancel={() => { setCompleteTarget(null); setActualMileage(null); }} okText="确认完成">
      <p>调度单：<strong>{completeTarget?.orderNo}</strong></p>
      <p>路线：{completeTarget?.origin} → {completeTarget?.destination}</p>
      <div style={{ marginTop: 16 }}>
        <span>实际里程(km)：</span>
        <InputNumber min={1} style={{ width: 200 }} value={actualMileage} onChange={(v: number | null) => setActualMileage(v)} placeholder="请输入本趟实际里程" />
      </div>
      <p style={{ marginTop: 12, color: '#888', fontSize: 12 }}>提交后车辆总里程与油耗效率将自动更新</p>
    </Modal>
  </PageShell>;
}
