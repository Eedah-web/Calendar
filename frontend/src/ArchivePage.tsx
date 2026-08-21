import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  App, Badge, Button, Checkbox, ConfigProvider, DatePicker, Input, Modal,
  Space, Table, Tabs, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, CalendarOutlined, DeleteOutlined, EditOutlined, InboxOutlined } from '@ant-design/icons';
import svSE from 'antd/locale/sv_SE';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/sv';
import { loadArchive, loadTasks, saveArchive, saveTasks, tagColor, uid, type ArchivedNote, type Task, type TaskMap } from './store';
import { useIsMobile } from './useIsMobile';
import Logo from './Logo';

dayjs.locale('sv');

const { Title } = Typography;
const { RangePicker } = DatePicker;

const COLOR_PILL: Record<string, { bg: string; fg: string }> = {
  blue:    { bg: '#1677ff', fg: '#fff' },
  green:   { bg: '#52c41a', fg: '#fff' },
  volcano: { bg: '#fa541c', fg: '#fff' },
  orange:  { bg: '#fa8c16', fg: '#fff' },
  purple:  { bg: '#722ed1', fg: '#fff' },
  cyan:    { bg: '#13c2c2', fg: '#fff' },
  magenta: { bg: '#eb2f96', fg: '#fff' },
  gold:    { bg: '#d48806', fg: '#fff' },
};

function PersonPill({ name }: { name?: string }) {
  if (!name) return null;
  const c = tagColor(name);
  const pill = COLOR_PILL[c] ?? { bg: '#8c8c8c', fg: '#fff' };
  return (
    <span style={{ background: pill.bg, color: pill.fg, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-block', whiteSpace: 'normal', maxWidth: '100%', lineHeight: 1.4, wordBreak: 'break-word' }}>
      {name}
    </span>
  );
}

/* ── Tab 1: Archive ── */
function ArchiveTab() {
  const isMobile = useIsMobile();
  const [archive,    setArchive]    = useState<ArchivedNote[]>(loadArchive);
  const [search,     setSearch]     = useState('');
  const [dateRange,  setDateRange]  = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [detailTask, setDetailTask] = useState<{ text: string; person?: string } | null>(null);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editText,   setEditText]   = useState('');

  const saveEdit = (id: string) => {
    const text = editText.trim();
    if (text) {
      const updated = archive.map((a) => a.id === id ? { ...a, note: { ...a.note, text } } : a);
      setArchive(updated); saveArchive(updated);
    }
    setEditId(null);
  };

  const deleteEntry = (id: string) => {
    const updated = archive.filter((a) => a.id !== id);
    setArchive(updated); saveArchive(updated);
  };

  const [from, to] = dateRange;
  const q = search.toLowerCase();

  const grouped = new Map<string, { key: string; taskText: string; taskPerson?: string; entries: ArchivedNote[] }>();
  for (const a of archive) {
    const inRange = (!from || !to) || (a.date >= from.format('YYYY-MM-DD') && a.date <= to.format('YYYY-MM-DD'));
    if (!inRange) continue;
    if (q && !a.taskText.toLowerCase().includes(q) && !(a.taskPerson ?? '').toLowerCase().includes(q)) continue;
    const gk = `${a.taskText}\x00${a.taskPerson ?? ''}`;
    if (!grouped.has(gk)) grouped.set(gk, { key: gk, taskText: a.taskText, taskPerson: a.taskPerson, entries: [] });
    grouped.get(gk)!.entries.push(a);
  }
  const rows = [...grouped.values()].sort((a, b) => a.taskText.localeCompare(b.taskText, 'sv'));

  type Row = typeof rows[0];
  const cols: ColumnsType<Row> = [
    {
      title: 'Uppgift', dataIndex: 'taskText', key: 'taskText',
      sorter: (a, b) => a.taskText.localeCompare(b.taskText, 'sv'),
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Person', dataIndex: 'taskPerson', key: 'taskPerson', width: 150,
      sorter: (a, b) => (a.taskPerson ?? '').localeCompare(b.taskPerson ?? '', 'sv'),
      render: (p?: string) => <PersonPill name={p} />,
    },
    {
      title: 'Noteringar', dataIndex: 'entries', key: 'count', width: 120, align: 'center' as const,
      render: (entries: ArchivedNote[]) => <Badge count={entries.length} color="#1677ff" />,
      sorter: (a: Row, b: Row) => a.entries.length - b.entries.length,
    },
    {
      title: '', key: 'action', width: 100,
      render: (_: unknown, row: Row) => (
        <Button size="small" type="link" onClick={() => { setDetailTask({ text: row.taskText, person: row.taskPerson }); setEditId(null); }}>
          Öppna →
        </Button>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <Input placeholder="Sök på uppgift eller person..." value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 280 }} />
        <RangePicker value={[from, to]} onChange={(vals) => setDateRange(vals ? [vals[0], vals[1]] : [null, null])} format="YYYY-MM-DD" placeholder={['Fr.o.m.', 'T.o.m.']} allowEmpty={[true, true]} />
      </div>
      <Table
        dataSource={rows} columns={cols} rowKey="key" size="small"
        pagination={false}
        scroll={{ x: isMobile ? 'max-content' : undefined, y: 'calc(100vh - 380px)' }}
        locale={{ emptyText: archive.length === 0 ? 'Inga arkiverade noteringar ännu.' : 'Inga träffar.' }}
        onRow={(row) => ({ onClick: () => { setDetailTask({ text: row.taskText, person: row.taskPerson }); setEditId(null); }, style: { cursor: 'pointer' } })}
      />

      {detailTask && (() => {
        const entries = archive.filter((a) => a.taskText === detailTask.text && (a.taskPerson ?? '') === (detailTask.person ?? '')).sort((a, b) => b.note.createdAt.localeCompare(a.note.createdAt));
        const byDate = new Map<string, ArchivedNote[]>();
        for (const a of entries) { if (!byDate.has(a.date)) byDate.set(a.date, []); byDate.get(a.date)!.push(a); }
        const sortedDates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));
        return (
          <Modal title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><InboxOutlined />{detailTask.text}{detailTask.person && <PersonPill name={detailTask.person} />}</span>}
            open onCancel={() => { setDetailTask(null); setEditId(null); }} footer={null} width={620}>
            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={20}>
                {sortedDates.map((date) => (
                  <div key={date}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1677ff', textTransform: 'capitalize', marginBottom: 8, borderBottom: '1px solid #e6f4ff', paddingBottom: 4 }}>
                      {dayjs(date).format('dddd D MMMM YYYY')}
                    </div>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {byDate.get(date)!.map((a) => {
                        const timeStr = new Date(a.note.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
                        const isEditing = editId === a.id;
                        return (
                          <div key={a.id} style={{ background: '#f8faff', borderRadius: 8, border: `1px solid ${isEditing ? '#1677ff' : '#e6f4ff'}`, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: '#1677ff', fontWeight: 600 }}>{timeStr}</span>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {!isEditing && <Button size="small" type="text" icon={<EditOutlined />} onClick={() => { setEditId(a.id); setEditText(a.note.text); }} />}
                                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => deleteEntry(a.id)} />
                              </div>
                            </div>
                            {isEditing ? (
                              <div>
                                <Input.TextArea autoFocus rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setEditId(null); }} style={{ resize: 'none', borderColor: '#1677ff', marginBottom: 6 }} />
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <Button size="small" type="primary" onClick={() => saveEdit(a.id)}>Spara</Button>
                                  <Button size="small" onClick={() => setEditId(null)}>Avbryt</Button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 14, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.5, cursor: 'text' }} onClick={() => { setEditId(a.id); setEditText(a.note.text); }}>
                                {a.note.text}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Space>
                  </div>
                ))}
              </Space>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}

/* ── Tab 2: Per day ── */
function PerDagTab({ initialDate, initialTo }: { initialDate: string; initialTo: string }) {
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const [taskMap, setTaskMap] = useState<TaskMap>(loadTasks);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs(initialDate), dayjs(initialTo)]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [from, to] = range;
  const fromStr = from.format('YYYY-MM-DD');
  const toStr   = to.format('YYYY-MM-DD');

  type NoteRow = { key: string; date: string; person?: string; taskText: string; noteText: string; time: string; noteCreatedAt: string };
  const rows: NoteRow[] = [];
  let cursor = from.clone();
  while (cursor.format('YYYY-MM-DD') <= toStr) {
    const dateStr = cursor.format('YYYY-MM-DD');
    for (const task of (taskMap[dateStr] ?? []) as Task[]) {
      for (const note of task.notes ?? []) {
        rows.push({ key: note.id, date: dateStr, person: task.person, taskText: task.text, noteText: note.text, time: new Date(note.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }), noteCreatedAt: note.createdAt });
      }
    }
    cursor = cursor.add(1, 'day');
  }

  const multiDay = fromStr !== toStr;
  const allKeys = rows.map((r) => r.key);
  const allChecked = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someChecked = allKeys.some((k) => selected.has(k));

  const archiveSelected = () => {
    const toMove = rows.filter((r) => selected.has(r.key));
    if (!toMove.length) return;
    // Save to archive
    const newEntries = toMove.map((r) => ({ id: uid(), taskText: r.taskText, taskPerson: r.person, date: r.date, note: { id: r.key, text: r.noteText, createdAt: r.noteCreatedAt }, archivedAt: new Date().toISOString() }));
    saveArchive([...loadArchive(), ...newEntries]);
    // Remove from taskMap
    const removedIds = new Set(toMove.map((r) => r.key));
    setTaskMap((prev) => {
      const next = { ...prev };
      for (const dateKey of Object.keys(next)) {
        next[dateKey] = next[dateKey].map((t) => ({ ...t, notes: (t.notes ?? []).filter((n) => !removedIds.has(n.id)) }));
      }
      saveTasks(next);
      return next;
    });
    setSelected(new Set());
    message.success(`${toMove.length} notering${toMove.length > 1 ? 'ar' : ''} arkiverad${toMove.length > 1 ? 'e' : ''}`);
  };

  const cols: ColumnsType<NoteRow> = [
    {
      key: 'select', width: 40,
      title: (
        <Checkbox
          indeterminate={someChecked && !allChecked}
          checked={allChecked}
          onChange={(e) => setSelected(e.target.checked ? new Set(allKeys) : new Set())}
        />
      ),
      render: (_: unknown, row: NoteRow) => (
        <Checkbox checked={selected.has(row.key)} onChange={(e) => setSelected((s) => { const n = new Set(s); e.target.checked ? n.add(row.key) : n.delete(row.key); return n; })} />
      ),
    },
    ...(multiDay ? [{
      title: 'Datum', dataIndex: 'date', key: 'date', width: 110,
      sorter: (a: NoteRow, b: NoteRow) => a.date.localeCompare(b.date),
      render: (d: string) => <span style={{ fontSize: 12, color: '#1677ff', fontWeight: 600, textTransform: 'capitalize' as const }}>{dayjs(d).format('D MMM')}</span>,
    }] : []),
    { title: 'Person', dataIndex: 'person', key: 'person', width: 140, sorter: (a: NoteRow, b: NoteRow) => (a.person ?? '').localeCompare(b.person ?? '', 'sv'), render: (p?: string) => <PersonPill name={p} /> },
    { title: 'Uppgift', dataIndex: 'taskText', key: 'taskText', width: 180 },
    { title: 'Notering', dataIndex: 'noteText', key: 'noteText' },
    { title: 'Tid', dataIndex: 'time', key: 'time', width: 55 },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <RangePicker value={[from, to]} onChange={(vals) => { if (vals?.[0] && vals?.[1]) { setRange([vals[0], vals[1]]); setSelected(new Set()); } }} format="YYYY-MM-DD" allowEmpty={[false, false]} />
        {!multiDay && <span style={{ color: '#888', fontSize: 13, textTransform: 'capitalize' }}>{from.format('dddd D MMMM YYYY')}</span>}
        {rows.length > 0 && (
          <Button type="primary" icon={<InboxOutlined />} size="small" disabled={selected.size === 0} onClick={archiveSelected} style={{ marginLeft: 'auto' }}>
            Arkivera ({selected.size})
          </Button>
        )}
      </div>
      <Table
        dataSource={rows} columns={cols} rowKey="key" size="small"
        pagination={false}
        scroll={{ x: isMobile ? 'max-content' : undefined, y: 'calc(100vh - 380px)' }}
        locale={{ emptyText: 'Inga noteringar för det här intervallet.' }}
        rowClassName={(r) => selected.has(r.key) ? 'row-selected' : ''}
      />
    </>
  );
}

/* ── Page shell ── */
export default function ArchivePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab   = searchParams.get('tab')  ?? 'arkiv';
  const initialDate = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD');
  const initialTo   = searchParams.get('to')   ?? initialDate;

  return (
    <ConfigProvider locale={svSE}>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)', padding: isMobile ? '12px 16px' : '16px 220px 16px 32px', boxShadow: '0 2px 12px rgba(22,119,255,.25)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff' }} />
          <InboxOutlined style={{ color: '#fff', fontSize: 18 }} />
          <Title level={3} style={{ margin: 0, color: '#fff' }}>Arkiv</Title>
          <Logo variant="red" size="sm" scale={isMobile ? 0.55 : 0.95} style={{ marginLeft: isMobile ? 8 : 24 }} />
        </div>
        <div style={{ maxWidth: 980, margin: isMobile ? '16px auto' : '32px auto', padding: isMobile ? '0 12px' : '0 24px' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: isMobile ? 14 : 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', key); return next; })}
              items={[
                { key: 'arkiv', label: <><InboxOutlined /> Arkiv</>,         children: <ArchiveTab /> },
                { key: 'dag',   label: <><CalendarOutlined /> Per datum</>,  children: <PerDagTab initialDate={initialDate} initialTo={initialTo} /> },
              ]}
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
