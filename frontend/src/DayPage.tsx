import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App, Button, Checkbox, ConfigProvider, Input,
  Select, Space, Table, Tag, Tooltip, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, CopyOutlined, DeleteOutlined, EditOutlined,
  FileTextOutlined, InboxOutlined, InfoCircleOutlined, LeftOutlined, PlusOutlined, RightOutlined, SendOutlined,
} from '@ant-design/icons';
import svSE from 'antd/locale/sv_SE';
import dayjs from 'dayjs';
import 'dayjs/locale/sv';
import {
  TASKS_KEY, loadArchive, loadPersons, loadPresets, loadTasks, saveArchive, saveTasks, tagColor, uid,
  type ArchivedNote, type Note, type Task, type TaskMap,
} from './store';
import { useIsMobile } from './useIsMobile';

dayjs.locale('sv');

const { Title, Text } = Typography;

const STATUS_OPTS = [
  { value: 'active',   label: 'Active',   color: 'blue',   dot: '#1677ff' },
  { value: 'onhold',   label: 'On hold',  color: 'orange', dot: '#fa8c16' },
  { value: 'complete', label: 'Complete', color: 'green',  dot: '#52c41a' },
] as const;

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

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { modal, message } = App.useApp();
  const isMobile = useIsMobile();

  const [taskMap,    setTaskMap]    = useState<TaskMap>(loadTasks);
  const [persons]                   = useState<string[]>(loadPersons);
  const [presets]                   = useState<string[]>(loadPresets);
  const [newText,    setNewText]    = useState('');
  const [newPerson,  setNewPerson]  = useState<string | undefined>();
  const [newFrom,    setNewFrom]    = useState<string | undefined>();
  const [newTo,      setNewTo]      = useState<string | undefined>();
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editText,   setEditText]   = useState('');
  const [notesOpen,    setNotesOpen]    = useState<string | null>(null);
  const [newNote,      setNewNote]      = useState('');
  const [editNoteId,   setEditNoteId]   = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>();

  const iso   = date ?? '';
  const label = dayjs(iso).locale('sv').format('dddd D MMMM YYYY');

  const goToDay = (delta: number) =>
    navigate(`/day/${dayjs(iso).add(delta, 'day').format('YYYY-MM-DD')}`);

  const copyAllToNextDay = () => {
    if (!tasks.length) { message.info('Inga uppgifter att kopiera'); return; }
    const target = dayjs(iso).add(1, 'day').format('YYYY-MM-DD');
    const existing = taskMap[target] ?? [];
    const toAdd = tasks
      .filter((t) => !existing.some((e) => e.text === t.text && e.person === t.person && e.timeFrom === t.timeFrom))
      .map((t) => ({
        id: uid(), text: t.text, done: false,
        person: t.person, timeFrom: t.timeFrom, timeTo: t.timeTo, status: t.status,
      }));
    if (!toAdd.length) { message.info('Uppgifterna finns redan på nästa dag'); return; }
    setTaskMap((m) => ({ ...m, [target]: [...(m[target] ?? []), ...toAdd] }));
    message.success(`${toAdd.length} uppgift${toAdd.length > 1 ? 'er' : ''} kopierade till ${dayjs(target).locale('sv').format('dddd D MMM')}`);
  };

  useEffect(() => { saveTasks(taskMap); }, [taskMap]);
  useEffect(() => {
    const sync = (e: StorageEvent) => { if (e.key === TASKS_KEY) setTaskMap(loadTasks()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const tasks = taskMap[iso] ?? [];

  const mutateTasks = (fn: (prev: Task[]) => Task[]) =>
    setTaskMap((m) => {
      const next = fn(m[iso] ?? []);
      if (!next.length) { const c = { ...m }; delete c[iso]; return c; }
      return { ...m, [iso]: next };
    });

  const nextWorkday = (isoDate: string): string => {
    let next = dayjs(isoDate).add(1, 'day');
    while (next.day() === 0 || next.day() === 6) next = next.add(1, 'day');
    return next.format('YYYY-MM-DD');
  };

  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    mutateTasks((p) => [...p, {
      id: uid(), text, done: false,
      person: newPerson, timeFrom: newFrom, timeTo: newTo,
      status: 'active',
    }]);
    setNewText('');
    setNewPerson(undefined);
    setNewFrom(undefined);
    setNewTo(undefined);
    setSelectedPreset(undefined);
  };

  const forwardTask = (task: Task) => {
    const target = nextWorkday(iso);
    const targetTasks = taskMap[target] ?? [];
    const alreadyExists = targetTasks.some(
      (t) => t.text === task.text && t.person === task.person && t.timeFrom === task.timeFrom,
    );
    if (alreadyExists) {
      message.error(`Uppgiften finns redan på ${dayjs(target).format('dddd D MMM')}`);
      return;
    }
    const carried: Task = {
      id: uid(), text: task.text, done: false,
      person: task.person, timeFrom: task.timeFrom, timeTo: task.timeTo,
      status: task.status,
    };
    setTaskMap((m) => ({ ...m, [target]: [...(m[target] ?? []), carried] }));
    message.success(`Uppgiften skickades till ${dayjs(target).format('dddd D MMM')}`);
  };

  const removeTask = (id: string) => {
    const task = (taskMap[iso] ?? []).find((t) => t.id === id);
    if (task && (task.notes?.length ?? 0) > 0) {
      modal.confirm({
        title: 'Uppgiften har noteringar',
        content: 'Vill du arkivera noteringar innan du raderar uppgiften?',
        okText: 'Arkivera och radera',
        cancelText: 'Radera utan att spara',
        onOk: () => {
          const entries: ArchivedNote[] = (task.notes ?? []).map((n) => ({
            id: uid(), taskText: task.text, taskPerson: task.person,
            date: iso, note: n, archivedAt: new Date().toISOString(),
          }));
          saveArchive([...loadArchive(), ...entries]);
          mutateTasks((p) => p.filter((t) => t.id !== id));
          if (notesOpen === id) setNotesOpen(null);
        },
        onCancel: () => {
          mutateTasks((p) => p.filter((t) => t.id !== id));
          if (notesOpen === id) setNotesOpen(null);
        },
      });
    } else {
      mutateTasks((p) => p.filter((t) => t.id !== id));
      if (notesOpen === id) setNotesOpen(null);
    }
  };

  const saveEdit = (id: string) => {
    const text = editText.trim();
    if (text) mutateTasks((p) => p.map((t) => (t.id === id ? { ...t, text } : t)));
    setEditId(null);
  };

  const updateStatus = (id: string, status: Task['status']) =>
    mutateTasks((p) => p.map((t) => t.id === id ? { ...t, status } : t));

  const addNote = (taskId: string) => {
    const text = newNote.trim();
    if (!text) return;
    const note: Note = { id: uid(), text, createdAt: new Date().toISOString() };
    mutateTasks((p) => p.map((t) =>
      t.id === taskId ? { ...t, notes: [...(t.notes ?? []), note] } : t
    ));
    setNewNote('');
  };

  const deleteNote = (taskId: string, noteId: string) =>
    mutateTasks((p) => p.map((t) =>
      t.id === taskId ? { ...t, notes: (t.notes ?? []).filter((n) => n.id !== noteId) } : t
    ));

  const archiveSelectedNotes = (task: Task) => {
    const toArchive = (task.notes ?? []).filter((n) => selectedNotes.has(n.id));
    if (!toArchive.length) return;
    const newEntries = toArchive.map((n) => ({ id: uid(), taskText: task.text, taskPerson: task.person, date: iso, note: n, archivedAt: new Date().toISOString() }));
    saveArchive([...loadArchive(), ...newEntries]);
    const ids = new Set(toArchive.map((n) => n.id));
    mutateTasks((p) => p.map((t) => t.id === task.id ? { ...t, notes: (t.notes ?? []).filter((n) => !ids.has(n.id)) } : t));
    setSelectedNotes(new Set());
    message.success(`${toArchive.length} notering${toArchive.length > 1 ? 'ar' : ''} arkiverad${toArchive.length > 1 ? 'e' : ''}`);
  };

  const saveNoteEdit = (taskId: string, noteId: string) => {
    const text = editNoteText.trim();
    if (text) mutateTasks((p) => p.map((t) =>
      t.id === taskId
        ? { ...t, notes: (t.notes ?? []).map((n) => n.id === noteId ? { ...n, text } : n) }
        : t
    ));
    setEditNoteId(null);
  };

  const withTime    = [...tasks.filter((t) => t.timeFrom)].sort((a, b) =>
    (a.timeFrom! > b.timeFrom! ? 1 : -1)
  );
  const withoutTime = tasks.filter((t) => !t.timeFrom);

  const timeLabel = (task: Task) => {
    if (!task.timeFrom) return '—';
    return task.timeTo ? `${task.timeFrom} – ${task.timeTo}` : task.timeFrom;
  };

  const tableData = [...withTime, ...withoutTime];

  const tableComponents = {};

  const statusOpt = (task: Task) => STATUS_OPTS.find((s) => s.value === task.status);

  const STATUS_ORDER: Record<string, number> = { active: 0, onhold: 1, complete: 2 };

  const columns = [
    {
      title: 'Tid',
      key: 'time',
      width: 130,
      sorter: (a: Task, b: Task) => (a.timeFrom ?? '99:99').localeCompare(b.timeFrom ?? '99:99'),

      render: (_: unknown, task: Task) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {statusOpt(task) && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: statusOpt(task)!.dot, display: 'inline-block',
            }} />
          )}
          <div style={{
            fontSize: 12, fontWeight: 700,
            color: task.timeFrom ? '#1677ff' : '#c0c0c0',
            background: task.timeFrom ? '#e6f4ff' : '#f7f7f7',
            borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap' as const,
          }}>
            {timeLabel(task)}
          </div>
        </div>
      ),
    },
    {
      title: 'Person',
      key: 'person',
      width: 130,
      sorter: (a: Task, b: Task) => (a.person ?? '').localeCompare(b.person ?? '', 'sv'),

      render: (_: unknown, task: Task) => {
        if (!task.person) return null;
        const c = tagColor(task.person, persons);
        const pill = COLOR_PILL[c] ?? { bg: '#8c8c8c', fg: '#fff' };
        return (
          <span style={{
            background: pill.bg, color: pill.fg,
            padding: '2px 10px', borderRadius: 12,
            fontSize: 12, fontWeight: 600,
            display: 'inline-block', whiteSpace: 'nowrap',
          }}>
            {task.person}
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      sorter: (a: Task, b: Task) => (STATUS_ORDER[a.status ?? ''] ?? 3) - (STATUS_ORDER[b.status ?? ''] ?? 3),

      render: (_: unknown, task: Task) => (
        <Select
          size="small"
          placeholder="—"
          value={task.status}
          onChange={(val) => updateStatus(task.id, val as Task['status'])}
          style={{ width: '100%' }}
          allowClear
          options={STATUS_OPTS.map((s) => ({
            value: s.value,
            label: <Tag color={s.color} style={{ margin: 0 }}>{s.label}</Tag>,
          }))}
        />
      ),
    },
    {
      title: 'Uppgift',
      key: 'text',

      render: (_: unknown, task: Task) => editId === task.id
        ? (
          <Input
            size="small" value={editText} autoFocus style={{ width: '100%' }}
            onChange={(e) => setEditText(e.target.value)}
            onPressEnter={() => saveEdit(task.id)}
            onBlur={() => saveEdit(task.id)}
            onKeyDown={(e) => e.key === 'Escape' && setEditId(null)}
          />
        ) : (
          <span
            onClick={() => { setEditId(task.id); setEditText(task.text); }}
            style={{
              fontSize: 14, fontWeight: 500, cursor: 'text',
              textDecoration: task.status === 'complete' ? 'line-through' : 'none',
              color: task.status === 'complete' ? '#bbb' : '#222',
            }}
          >
            {task.text || <span style={{ color: '#ccc', fontStyle: 'italic' }}>—</span>}
          </span>
        ),
    },
    {
      title: '',
      key: 'forward',
      width: 64,

      render: (_: unknown, task: Task) => task.status !== 'complete' && (
        <Space size={4}>
          <Tooltip title={`Flytta till ${nextWorkday(iso)}`}>
            <Button
              size="small" type="text"
              icon={<SendOutlined style={{ color: '#13c2c2' }} />}
              onClick={() => forwardTask(task)}
            />
          </Tooltip>
          <Tooltip title="Noteringar skickas inte med till nästa dag">
            <InfoCircleOutlined style={{ color: '#bbb', fontSize: 12, cursor: 'default' }} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 96,

      render: (_: unknown, task: Task) => {
        const isNotesOpen = notesOpen === task.id;
        return (
          <Space size={2}>
            <Tooltip title="Noteringar">
              <Button
                size="small" type={isNotesOpen ? 'primary' : 'text'}
                icon={<FileTextOutlined />}
                onClick={() => { setNotesOpen(isNotesOpen ? null : task.id); setNewNote(''); setEditNoteId(null); }}
                style={!isNotesOpen ? { color: (task.notes?.length ?? 0) > 0 ? '#1677ff' : '#bbb' } : {}}
              />
            </Tooltip>
            <Button size="small" type="text" danger icon={<DeleteOutlined />}
              onClick={() => removeTask(task.id)} />
          </Space>
        );
      },
    },
  ];

  return (
    <ConfigProvider locale={svSE}>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

        {/* Header */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
          padding: isMobile ? '12px 16px' : '16px 32px',
          boxShadow: '0 2px 12px rgba(22,119,255,.25)',
          display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16,
          flexWrap: 'wrap',
        }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ borderColor: 'rgba(255,255,255,.5)', color: '#fff', background: 'rgba(255,255,255,.15)' }}>
            Tillbaka
          </Button>

          <div style={{
            ...(isMobile
              ? { width: '100%', justifyContent: 'center' }
              : { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }),
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Button
              shape="circle"
              icon={<LeftOutlined />}
              onClick={() => goToDay(-1)}
              title="Föregående dag"
              style={{ borderColor: 'rgba(255,255,255,.5)', color: '#fff', background: 'rgba(255,255,255,.15)' }}
            />
            <Title level={isMobile ? 5 : 4} style={{ margin: 0, textTransform: 'capitalize', color: '#fff', minWidth: isMobile ? 0 : 230, textAlign: 'center' }}>{label}</Title>
            <Button
              shape="circle"
              icon={<RightOutlined />}
              onClick={() => goToDay(1)}
              title="Nästa dag"
              style={{ borderColor: 'rgba(255,255,255,.5)', color: '#fff', background: 'rgba(255,255,255,.15)' }}
            />
          </div>
        </div>

        <div style={{ margin: isMobile ? 16 : 32, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '400px 1fr', gap: isMobile ? 16 : 24, alignItems: 'start' }}>

          {/* Add task */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: '24px 28px',
            boxShadow: '0 2px 8px rgba(0,0,0,.08)',
            borderTop: '3px solid #1677ff',
          }}>
            <Title level={5} style={{ marginBottom: 20, color: '#1677ff' }}>
              + Lägg till uppgift
            </Title>

            {/* Row 1: Person + Time */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#222', marginBottom: 6, fontWeight: 600 }}>PERSON</div>
                <Select
                  placeholder="Välj person..."
                  options={persons.map((p) => ({ label: p, value: p }))}
                  value={newPerson}
                  onChange={setNewPerson}
                  style={{ width: '100%' }}
                  allowClear
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#222', marginBottom: 6, fontWeight: 600 }}>TID</div>
                <Select
                  placeholder="Välj tid..."
                  options={[
                    { label: '6.30 – 8.30', value: '06:30-08:30' },
                    { label: '9.00 – 11.00', value: '09:00-11:00' },
                    { label: '11.15 – 13.15', value: '11:15-13:15' },
                    { label: '13.30 – 15.30', value: '13:30-15:30' },
                  ]}
                  value={newFrom && newTo ? `${newFrom}-${newTo}` : undefined}
                  onChange={(val: string | undefined) => {
                    if (!val) { setNewFrom(undefined); setNewTo(undefined); return; }
                    const [from, to] = val.split('-');
                    setNewFrom(from);
                    setNewTo(to);
                  }}
                  style={{ width: '100%' }}
                  allowClear
                />
              </div>
            </div>

            {/* Row 2: Task */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#222', marginBottom: 6, fontWeight: 600 }}>UPPGIFT</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {presets.length > 0 && (
                  <Select
                    placeholder="Förinställd..."
                    options={presets.map((p) => ({ label: p, value: p }))}
                    style={{ width: 200, flexShrink: 0 }}
                    value={selectedPreset}
                    onChange={(val: string) => {
                      setSelectedPreset(val);
                      setNewText(val);
                    }}
                    allowClear
                    onClear={() => { setSelectedPreset(undefined); setNewText(''); }}
                  />
                )}
                <Input
                  placeholder={selectedPreset ? 'Redigera eller lägg till direkt...' : 'Skriv uppgift...'}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onPressEnter={addTask}
                  style={{ flex: 1 }}
                  autoFocus
                />
              </div>
            </div>

            {/* Add button */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addTask}
              disabled={!newText.trim() && !newPerson && !newFrom}
              size="large"
              block
              style={{ borderRadius: 8 }}
            >
              Lägg till
            </Button>
          </div>

          {/* Schedule */}
          <div style={{
            background: '#fff', borderRadius: 8, padding: isMobile ? 14 : 24,
            boxShadow: '0 1px 3px rgba(0,0,0,.06)', minWidth: 0,
          }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Title level={5} style={{ margin: 0 }}>
                Schema &mdash; {tasks.length === 0 ? 'inga uppgifter' : `${tasks.length} uppgifter`}
              </Title>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={copyAllToNextDay}
                disabled={tasks.length === 0}
                style={{ marginLeft: 'auto' }}
              >
                Kopiera alla till nästa dag
              </Button>
            </div>

            <Table
              dataSource={tableData}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={isMobile ? { x: 'max-content' } : undefined}
              components={tableComponents}
              locale={{ emptyText: <Text type="secondary">Inga uppgifter för den här dagen. Lägg till en ovan.</Text> }}
              onRow={(task) => ({
                style: { opacity: task.status === 'complete' ? 0.55 : 1, transition: 'opacity .15s' },
              })}
            />
          </div>

        </div>

        {/* Notes sidebar – fixed, slides in from the right */}
        {(() => {
          const task = tasks.find((t) => t.id === notesOpen);
          return (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setNotesOpen(null)}
                style={{
                  position: 'fixed', inset: 0,
                  zIndex: 199,
                  display: notesOpen ? 'block' : 'none',
                }}
              />
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: isMobile ? '100%' : 520, maxWidth: '100%',
              background: '#fff',
              boxShadow: notesOpen ? '-4px 0 24px rgba(0,0,0,.12)' : 'none',
              transform: notesOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform .25s ease, box-shadow .25s ease',
              display: 'flex', flexDirection: 'column',
              zIndex: 200,
            }}>
              {task && (
                <>
                  {/* Sidebar header */}
                  <div style={{
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #f0f0f0',
                    background: '#f8faff',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#1677ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          Noteringar
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#222', marginBottom: 4 }}>{task.text}</div>
                        {task.person && (
                          <Tag color={tagColor(task.person, persons)} style={{ fontSize: 11 }}>
                            {task.person}
                          </Tag>
                        )}
                      </div>
                      <Button type="text" size="small" onClick={() => setNotesOpen(null)}
                        style={{ fontSize: 18, color: '#aaa', marginTop: -4 }}>×</Button>
                    </div>
                  </div>

                  {/* Note list */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(task.notes ?? []).length === 0 && (
                      <div style={{ color: '#bbb', fontSize: 13, textAlign: 'center', marginTop: 32 }}>
                        Inga noteringar ännu
                      </div>
                    )}
                    {(task.notes ?? []).map((note) => {
                      const ts = new Date(note.createdAt);
                      const timeStr = ts.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
                      const dateStr = ts.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
                      const isEditing = editNoteId === note.id;
                      return (
                        <div key={note.id} style={{
                          background: selectedNotes.has(note.id) ? '#f0f7ff' : '#f8faff',
                          borderRadius: 8,
                          border: `1px solid ${isEditing ? '#1677ff' : selectedNotes.has(note.id) ? '#91caff' : '#e6f4ff'}`,
                          padding: '10px 14px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Checkbox
                                checked={selectedNotes.has(note.id)}
                                onChange={(e) => setSelectedNotes((s) => {
                                  const n = new Set(s);
                                  e.target.checked ? n.add(note.id) : n.delete(note.id);
                                  return n;
                                })}
                              />
                              <span style={{ fontSize: 11, color: '#1677ff', fontWeight: 600 }}>
                                {timeStr} · {dateStr}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 2 }}>
                              {!isEditing && (
                                <Button size="small" type="text" icon={<EditOutlined />}
                                  onClick={() => { setEditNoteId(note.id); setEditNoteText(note.text); }} />
                              )}
                              <Button size="small" type="text" danger icon={<DeleteOutlined />}
                                onClick={() => deleteNote(task.id, note.id)} />
                            </div>
                          </div>
                          {isEditing ? (
                            <div>
                              <Input.TextArea
                                autoFocus
                                rows={3}
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) saveNoteEdit(task.id, note.id);
                                  if (e.key === 'Escape') setEditNoteId(null);
                                }}
                                style={{ resize: 'none', fontSize: 14, borderColor: '#1677ff', marginBottom: 6 }}
                              />
                              <div style={{ display: 'flex', gap: 6 }}>
                                <Button size="small" type="primary" onClick={() => saveNoteEdit(task.id, note.id)}>
                                  Spara
                                </Button>
                                <Button size="small" onClick={() => setEditNoteId(null)}>
                                  Avbryt
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{ fontSize: 14, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.5, cursor: 'text' }}
                              onClick={() => { setEditNoteId(note.id); setEditNoteText(note.text); }}
                            >
                              {note.text}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Batch archiving */}
                  {(task.notes ?? []).length > 0 && (
                    <div style={{ padding: '8px 20px', borderTop: '1px solid #f0f0f0', background: '#fafcff', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Checkbox
                        indeterminate={selectedNotes.size > 0 && selectedNotes.size < (task.notes ?? []).length}
                        checked={selectedNotes.size === (task.notes ?? []).length && (task.notes ?? []).length > 0}
                        onChange={(e) => setSelectedNotes(e.target.checked ? new Set((task.notes ?? []).map((n) => n.id)) : new Set())}
                      >
                        <span style={{ fontSize: 12, color: '#888' }}>Markera alla</span>
                      </Checkbox>
                      {selectedNotes.size > 0 && (
                        <Button size="small" type="primary" icon={<InboxOutlined />}
                          onClick={() => archiveSelectedNotes(task)} style={{ marginLeft: 'auto' }}>
                          Arkivera markerade ({selectedNotes.size})
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Add new note */}
                  <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Ny notering
                    </div>
                    <Input.TextArea
                      rows={3}
                      value={newNote}
                      placeholder="Skriv en notering..."
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addNote(task.id); }}
                      style={{ resize: 'none', marginBottom: 8, borderColor: '#d0e4ff' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        type="primary" icon={<PlusOutlined />}
                        disabled={!newNote.trim()}
                        onClick={() => addNote(task.id)}
                        style={{ flex: 1 }}
                      >
                        Spara notering
                      </Button>
                      {newNote.trim() && (
                        <Button onClick={() => setNewNote('')}>Rensa</Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            </>
          );
        })()}

      </div>
    </ConfigProvider>
  );
}
