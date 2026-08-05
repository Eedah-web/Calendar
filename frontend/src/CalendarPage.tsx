import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Calendar, ConfigProvider,
  Input, Modal, Space, Tag, Typography,
} from 'antd';
import {
  DeleteOutlined, EditOutlined, FileTextOutlined, InboxOutlined, OrderedListOutlined, PlusOutlined, TeamOutlined,
} from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import svSE from 'antd/locale/sv_SE';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/sv';
import {
  TAG_COLORS, loadArchive, loadPersons, loadPresets, loadTasks,
  savePersons, savePresets, type ArchivedNote, type Task, type TaskMap,
} from './store';
import { useIsMobile } from './useIsMobile';

const COLOR_BG: Record<string, string> = {
  blue:    '#bae0ff',
  green:   '#d9f7be',
  volcano: '#ffbb96',
  orange:  '#ffd591',
  purple:  '#d3adf7',
  cyan:    '#87e8de',
  magenta: '#ffadd2',
  gold:    '#ffe58f',
};

dayjs.locale('sv');

const { Title, Text } = Typography;

export default function CalendarPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [taskMap,      setTaskMap]      = useState<TaskMap>({});
  const [persons,      setPersons]      = useState<string[]>(loadPersons);
  const [presets,      setPresets]      = useState<string[]>(loadPresets);
  const [calDate,      setCalDate]      = useState<Dayjs>(dayjs());
  const [calMode,      setCalMode]      = useState<'month' | 'year'>('month');

  /* user modal */
  const [usersOpen,  setUsersOpen]  = useState(false);
  const [newName,    setNewName]    = useState('');
  const [editIdx,    setEditIdx]    = useState<number | null>(null);
  const [editName,   setEditName]   = useState('');

  /* presets modal */
  const [presetsOpen,    setPresetsOpen]    = useState(false);
  const [newPreset,      setNewPreset]      = useState('');
  const [editPresetIdx,  setEditPresetIdx]  = useState<number | null>(null);
  const [editPresetName, setEditPresetName] = useState('');

  /* archive count for button label */
  const [archive, setArchive] = useState<ArchivedNote[]>([]);

  useEffect(() => {
    setTaskMap(loadTasks());
    setArchive(loadArchive());
  }, []);

  useEffect(() => { savePersons(persons); }, [persons]);
  useEffect(() => { savePresets(presets); }, [presets]);

  /* ── person helpers ── */
  const addPerson = () => {
    const name = newName.trim();
    if (!name || persons.includes(name)) return;
    setPersons((p) => [...p, name]);
    setNewName('');
  };

  const savePerson = (idx: number) => {
    const name = editName.trim();
    if (name && !persons.includes(name)) {
      const old = persons[idx];
      setPersons((p) => p.map((x, i) => (i === idx ? name : x)));
      const updated = loadTasks();
      for (const key of Object.keys(updated))
        updated[key] = updated[key].map((t) => t.person === old ? { ...t, person: name } : t);
      import('./store').then(({ saveTasks }) => saveTasks(updated));
      setTaskMap(updated);
    }
    setEditIdx(null);
  };

  /* ── preset helpers ── */
  const addPreset = () => {
    const v = newPreset.trim();
    if (!v || presets.includes(v)) return;
    setPresets((p) => [...p, v]);
    setNewPreset('');
  };

  const savePreset = (idx: number) => {
    const v = editPresetName.trim();
    if (v && !presets.some((x, i) => i !== idx && x === v))
      setPresets((p) => p.map((x, i) => (i === idx ? v : x)));
    setEditPresetIdx(null);
  };


  /* ── calendar cell ── */
  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') {
      const iso = current.format('YYYY-MM-DD');
      const list = taskMap[iso] ?? [];
      if (!list.length) return null;
      const total = list.length;
      const rows = [
        { count: list.filter((t: Task) => t.status === 'active').length,   label: 'Active',   color: '#1677ff' },
        { count: list.filter((t: Task) => t.status === 'onhold').length,   label: 'On hold',  color: '#fa8c16' },
        { count: list.filter((t: Task) => t.status === 'complete').length, label: 'Complete', color: '#52c41a' },
        { count: list.filter((t: Task) => !t.status).length,               label: '–',        color: '#bfbfbf' },
      ].filter((r) => r.count > 0);
      const hasNotes = list.some((t: Task) => (t.notes?.length ?? 0) > 0);

      // Mobile: compact "colored dot + count" instead of text that does not fit in the narrow
      // cells. The count is visible immediately (no hover needed); tap the day for full info.
      if (isMobile) {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 5px', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
            {rows.map((r) => (
              <span key={r.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, color: r.color, fontWeight: 700, lineHeight: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                {r.count}
              </span>
            ))}
            {hasNotes && <FileTextOutlined style={{ fontSize: 10, color: '#1677ff' }} />}
          </div>
        );
      }

      return (
        <div style={{ position: 'relative', paddingBottom: hasNotes ? 16 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2 }}>
            {rows.map((r) => (
              <span key={r.label} style={{ fontSize: 10, color: r.color, fontWeight: 700, lineHeight: '14px', whiteSpace: 'nowrap' }}>
                {r.count}/{total} {r.label}
              </span>
            ))}
          </div>
          {hasNotes && (
            <span
              onClick={(e) => { e.stopPropagation(); navigate(`/archive?tab=dag&date=${iso}`); }}
              style={{ position: 'absolute', bottom: 0, right: 0, color: '#1677ff', fontSize: 12, cursor: 'pointer', lineHeight: 1 }}
            >
              <FileTextOutlined />
            </span>
          )}
        </div>
      );
    }

    if (info.type === 'month') {
      const daysInMonth = current.daysInMonth();
      let allTasks: Task[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = current.date(d).format('YYYY-MM-DD');
        allTasks = [...allTasks, ...(taskMap[dateStr] ?? [])];
      }
      if (!allTasks.length) return null;
      const total = allTasks.length;
      const monthRows = [
        { count: allTasks.filter((t: Task) => t.status === 'active').length,   label: 'Active',   color: '#1677ff' },
        { count: allTasks.filter((t: Task) => t.status === 'onhold').length,   label: 'On hold',  color: '#fa8c16' },
        { count: allTasks.filter((t: Task) => t.status === 'complete').length, label: 'Complete', color: '#52c41a' },
        { count: allTasks.filter((t: Task) => !t.status).length,               label: '–',        color: '#bfbfbf' },
      ].filter((r) => r.count > 0);
      const hasNotes = allTasks.some((t: Task) => (t.notes?.length ?? 0) > 0);
      const fromDate = current.startOf('month').format('YYYY-MM-DD');
      const toDate   = current.endOf('month').format('YYYY-MM-DD');
      return (
        <div style={{ position: 'relative', paddingBottom: hasNotes ? 16 : 0, minHeight: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2 }}>
            {monthRows.map((r) => (
              <span key={r.label} style={{ fontSize: 10, color: r.color, fontWeight: 700, lineHeight: '14px', whiteSpace: 'nowrap' }}>
                {r.count}/{total} {r.label}
              </span>
            ))}
          </div>
          {hasNotes && (
            <span
              onClick={(e) => { e.stopPropagation(); navigate(`/archive?tab=dag&date=${fromDate}&to=${toDate}`); }}
              style={{ position: 'absolute', bottom: 0, right: 0, color: '#1677ff', fontSize: 12, cursor: 'pointer', lineHeight: 1 }}
            >
              <FileTextOutlined />
            </span>
          )}
        </div>
      );
    }

    return info.originNode;
  };

  /* ── shared list item renderer ── */
  const renderPersonItem = (name: string, i: number) => {
    const colorName = TAG_COLORS[i % TAG_COLORS.length];
    const bg = COLOR_BG[colorName] ?? '#fafafa';
    return (<div key={name} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 8px', borderRadius: 6,
      background: bg, border: `1px solid ${bg}`,
    }}>
      {editIdx === i ? (
        <>
          <Input
            size="small" value={editName} autoFocus style={{ flex: 1 }}
            onChange={(e) => setEditName(e.target.value)}
            onPressEnter={() => savePerson(i)}
            onBlur={() => savePerson(i)}
            onKeyDown={(e) => e.key === 'Escape' && setEditIdx(null)}
          />
          <Button size="small" type="text" danger icon={<DeleteOutlined />}
            onClick={() => { setPersons((p) => p.filter((x) => x !== name)); setEditIdx(null); }} />
        </>
      ) : (
        <>
          <Tag
            color={TAG_COLORS[i % TAG_COLORS.length]}
            onClick={() => { setEditIdx(i); setEditName(name); }}
            style={{ flex: 1, margin: 0, padding: '5px 10px', fontSize: 13, cursor: 'pointer' }}
          >
            {name} <EditOutlined style={{ marginLeft: 4, opacity: 0.5, fontSize: 11 }} />
          </Tag>
          <Button size="small" type="text" danger icon={<DeleteOutlined />}
            onClick={() => setPersons((p) => p.filter((x) => x !== name))} />
        </>
      )}
    </div>
    );
  };

  const renderPresetItem = (name: string, i: number) => (
    <div key={i} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 8px', borderRadius: 6,
      background: '#fafafa', border: '1px solid #f0f0f0',
    }}>
      {editPresetIdx === i ? (
        <>
          <Input
            size="small" value={editPresetName} autoFocus style={{ flex: 1 }}
            onChange={(e) => setEditPresetName(e.target.value)}
            onPressEnter={() => savePreset(i)}
            onBlur={() => savePreset(i)}
            onKeyDown={(e) => e.key === 'Escape' && setEditPresetIdx(null)}
          />
          <Button size="small" type="text" danger icon={<DeleteOutlined />}
            onClick={() => { setPresets((p) => p.filter((_, j) => j !== i)); setEditPresetIdx(null); }} />
        </>
      ) : (
        <>
          <Tag
            color={TAG_COLORS[i % TAG_COLORS.length]}
            onClick={() => { setEditPresetIdx(i); setEditPresetName(name); }}
            style={{ flex: 1, margin: 0, padding: '5px 10px', fontSize: 13, cursor: 'pointer' }}
          >
            {name} <EditOutlined style={{ marginLeft: 4, opacity: 0.5, fontSize: 11 }} />
          </Tag>
          <Button size="small" type="text" danger icon={<DeleteOutlined />}
            onClick={() => setPresets((p) => p.filter((_, j) => j !== i))} />
        </>
      )}
    </div>
  );

  return (
    <ConfigProvider locale={svSE}>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
          padding: isMobile ? '14px 16px' : '16px 32px',
          boxShadow: '0 2px 12px rgba(22,119,255,.25)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>Kalender</Title>
          {!isMobile && <Text style={{ color: 'rgba(255,255,255,.85)' }}>Hantera uppgifter dag för dag</Text>}
        </div>

        {/* Date banner */}
        <div style={{ maxWidth: 1200, margin: '24px auto 0', padding: isMobile ? '0 12px' : '0 24px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)', borderRadius: 12, padding: '20px 28px',
            boxShadow: '0 8px 24px rgba(22,119,255,.22)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff',
          }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {dayjs().format('MMMM YYYY')}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, textTransform: 'capitalize' }}>
                {dayjs().format('dddd D MMMM')}
              </div>
            </div>
            <div style={{ fontSize: 64, fontWeight: 800, opacity: 0.12, lineHeight: 1 }}>
              {dayjs().format('D')}
            </div>
          </div>
        </div>

        {/* Layout */}
        <div style={{
          maxWidth: 1200, margin: isMobile ? '16px auto' : '24px auto', padding: isMobile ? '0 12px' : '0 24px',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 16 : 24, alignItems: 'stretch',
        }}>
          {/* Calendar */}
          <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 8, padding: isMobile ? 10 : 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <Calendar
              value={calDate}
              mode={calMode}
              cellRender={cellRender}
              onPanelChange={(date, mode) => { setCalDate(date); setCalMode(mode); }}
              onSelect={(d, info) => {
                const src = (info as { source?: string }).source;
                if (calMode === 'year') {
                  // Any cell click in year view → switch to month view for that month
                  setCalDate(d);
                  setCalMode('month');
                } else {
                  // Month view: guard against panel selector triggers, navigate on day click
                  if (src !== 'year' && src !== 'month') {
                    setCalDate(d);
                    navigate(`/day/${d.format('YYYY-MM-DD')}`);
                  }
                }
              }}
            />
          </div>

          {/* Side panel */}
          <div style={{
            width: isMobile ? '100%' : 260, flexShrink: 0,
            background: '#fff', borderRadius: 8, padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <Title level={5} style={{ margin: 0 }}>Inställningar</Title>

            <Button
              block type="primary"
              icon={<TeamOutlined />}
              onClick={() => { setEditIdx(null); setUsersOpen(true); }}
            >
              Hantera användare {persons.length > 0 && `(${persons.length})`}
            </Button>

            <Button
              block type="primary"
              icon={<OrderedListOutlined />}
              onClick={() => { setEditPresetIdx(null); setPresetsOpen(true); }}
            >
              Förinställda uppgifter {presets.length > 0 && `(${presets.length})`}
            </Button>

            <Button
              block type="primary"
              icon={<InboxOutlined />}
              onClick={() => navigate('/archive')}
            >
              Arkiv {archive.length > 0 && `(${archive.length})`}
            </Button>
          </div>
        </div>

        {/* ── Modal: Users ── */}
        <Modal
          title={<><TeamOutlined /> Hantera användare</>}
          open={usersOpen}
          onCancel={() => { setUsersOpen(false); setEditIdx(null); }}
          footer={null}
          width={520}
          styles={{ body: { maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 } }}
          destroyOnClose
        >
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Input
              placeholder="Nytt namn..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPressEnter={addPerson}
              autoFocus
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={addPerson} disabled={!newName.trim()}>
              Lägg till
            </Button>
          </Space.Compact>

          <div style={{ overflowY: 'auto' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {persons.length === 0
                ? <Text type="secondary">Inga användare tillagda ännu.</Text>
                : persons.map(renderPersonItem)}
            </Space>
          </div>
        </Modal>

        {/* ── Modal: Preset tasks ── */}
        <Modal
          title={<><OrderedListOutlined /> Förinställda uppgifter</>}
          open={presetsOpen}
          onCancel={() => { setPresetsOpen(false); setEditPresetIdx(null); }}
          footer={null}
          width={520}
          styles={{ body: { maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 } }}
          destroyOnClose
        >
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Input
              placeholder="Ny uppgift..."
              value={newPreset}
              onChange={(e) => setNewPreset(e.target.value)}
              onPressEnter={addPreset}
              autoFocus
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={addPreset} disabled={!newPreset.trim()}>
              Lägg till
            </Button>
          </Space.Compact>

          <div style={{ overflowY: 'auto' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {presets.length === 0
                ? <Text type="secondary">Inga förinställda uppgifter ännu.</Text>
                : presets.map(renderPresetItem)}
            </Space>
          </div>
        </Modal>



      </div>
    </ConfigProvider>
  );
}
