import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Calendar,
  Checkbox,
  ConfigProvider,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import svSE from 'antd/locale/sv_SE';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/sv';
import { loadPersons, loadTasks, savePersons, saveTasks, TAG_COLORS, tagColor, uid, type Task, type TaskMap } from './store';

dayjs.locale('sv');

const { Title, Text } = Typography;

export default function App() {
  const [taskMap,  setTaskMap]  = useState<TaskMap>(loadTasks);
  const [persons,  setPersons]  = useState<string[]>(loadPersons);
  const [calDate,  setCalDate]  = useState<Dayjs>(dayjs());

  /* day modal */
  const [modalDate, setModalDate] = useState<Dayjs | null>(null);
  const [newText,   setNewText]   = useState('');
  const [newPerson, setNewPerson] = useState<string | undefined>();
  const [editId,    setEditId]    = useState<string | null>(null);
  const [editText,  setEditText]  = useState('');

  /* persons panel */
  const [newPersonName,  setNewPersonName]  = useState('');
  const [filterPerson,   setFilterPerson]   = useState<string | undefined>();
  const [editPersonIdx,  setEditPersonIdx]  = useState<number | null>(null);
  const [editPersonName, setEditPersonName] = useState('');

  /* ── persistence ── */
  useEffect(() => { saveTasks(taskMap); }, [taskMap]);
  useEffect(() => { savePersons(persons); }, [persons]);

  /* ── task helpers ── */
  const iso      = modalDate?.format('YYYY-MM-DD') ?? '';
  const dayTasks = taskMap[iso] ?? [];
  const doneCount = dayTasks.filter((t) => t.done).length;

  const mutateTasks = (fn: (prev: Task[]) => Task[]) =>
    setTaskMap((m) => {
      const next = fn(m[iso] ?? []);
      if (!next.length) { const c = { ...m }; delete c[iso]; return c; }
      return { ...m, [iso]: next };
    });

  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    mutateTasks((p) => [...p, { id: uid(), text, done: false, person: newPerson }]);
    setNewText('');
  };

  const toggleTask  = (id: string) =>
    mutateTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTask  = (id: string) =>
    mutateTasks((p) => p.filter((t) => t.id !== id));

  const saveTaskEdit = (id: string) => {
    const text = editText.trim();
    if (text) mutateTasks((p) => p.map((t) => (t.id === id ? { ...t, text } : t)));
    setEditId(null);
  };

  const clearDone = () => mutateTasks((p) => p.filter((t) => !t.done));

  /* ── person helpers ── */
  const addPerson = () => {
    const name = newPersonName.trim();
    if (!name || persons.includes(name)) return;
    setPersons((p) => [...p, name]);
    setNewPersonName('');
  };

  const savePersonEdit = (idx: number) => {
    const name = editPersonName.trim();
    if (name && !persons.includes(name)) {
      const old = persons[idx];
      setPersons((p) => p.map((x, i) => (i === idx ? name : x)));
      // rename in tasks too
      setTaskMap((m) => {
        const next = { ...m };
        for (const key of Object.keys(next)) {
          next[key] = next[key].map((t) => t.person === old ? { ...t, person: name } : t);
        }
        return next;
      });
    }
    setEditPersonIdx(null);
  };

  const removePerson = (name: string) => {
    setPersons((p) => p.filter((x) => x !== name));
    if (filterPerson === name) setFilterPerson(undefined);
  };

  /* ── calendar badge ── */
  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type !== 'date') return info.originNode;
    let list = taskMap[current.format('YYYY-MM-DD')] ?? [];
    if (filterPerson) list = list.filter((t) => t.person === filterPerson);
    if (!list.length) return null;
    const counts = {
      active:   list.filter((t: Task) => t.status === 'active').length,
      onhold:   list.filter((t: Task) => t.status === 'onhold').length,
      complete: list.filter((t: Task) => t.status === 'complete').length,
      none:     list.filter((t: Task) => !t.status).length,
    };
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
        {counts.active   > 0 && <Badge count={counts.active}   color="#1677ff" size="small" title="Active" />}
        {counts.onhold   > 0 && <Badge count={counts.onhold}   color="#fa8c16" size="small" title="On hold" />}
        {counts.complete > 0 && <Badge count={counts.complete} color="#52c41a" size="small" title="Complete" />}
        {counts.none     > 0 && <Badge count={counts.none}     color="#d9d9d9" size="small" title="Ingen status" />}
      </div>
    );
  };

  const openDay = (d: Dayjs) => {
    setCalDate(d);
    setModalDate(d);
    setNewText('');
    setNewPerson(filterPerson);
    setEditId(null);
  };

  /* ── render ── */
  return (
    <ConfigProvider locale={svSE}>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

        {/* Header */}
        <div style={{
          background: '#13c2c2', padding: '14px 32px',
          borderBottom: '1px solid #0fa8a8',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>Kalender</Title>
          <Text style={{ color: 'rgba(255,255,255,.75)' }}>Hantera uppgifter dag för dag</Text>
        </div>

        {/* Date banner */}
        <div style={{ maxWidth: 1200, margin: '24px auto 0', padding: '0 24px' }}>
          <div style={{
            background: '#1677ff', borderRadius: 8, padding: '20px 28px',
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

        {/* Two-column layout */}
        <div style={{
          maxWidth: 1200, margin: '24px auto', padding: '0 24px',
          display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'stretch',
        }}>

          {/* Calendar */}
          <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <Calendar
              value={calDate}
              cellRender={cellRender}
              onSelect={(d, info) => { if (info.source === 'date') openDay(d); }}
            />
          </div>

          {/* Users panel */}
          <div style={{
            background: '#fff', borderRadius: 8, padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <Title level={5} style={{ marginBottom: 16 }}>Användare</Title>

            {/* Add person */}
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="Nytt namn..."
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onPressEnter={addPerson}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addPerson}
                disabled={!newPersonName.trim()}
              >
                Lägg till
              </Button>
            </Space.Compact>

            {/* Filter dropdown */}
            {persons.length > 0 && (
              <Select
                placeholder="Filtrera kalender per person"
                options={persons.map((p) => ({ label: p, value: p }))}
                value={filterPerson}
                onChange={setFilterPerson}
                allowClear
                style={{ width: '100%', marginBottom: 16 }}
              />
            )}

            {/* Person list */}
            <Space direction="vertical" style={{ width: '100%', overflowY: 'auto', flex: 1 }}>
              {persons.length === 0 && (
                <Text type="secondary">Inga användare tillagda ännu.</Text>
              )}
              {persons.map((name, i) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 6,
                  background: '#fafafa', border: '1px solid #f0f0f0',
                }}>
                  {editPersonIdx === i ? (
                    <>
                      <Input
                        size="small"
                        value={editPersonName}
                        autoFocus
                        onChange={(e) => setEditPersonName(e.target.value)}
                        onPressEnter={() => savePersonEdit(i)}
                        onBlur={() => savePersonEdit(i)}
                        onKeyDown={(e) => e.key === 'Escape' && setEditPersonIdx(null)}
                        style={{ flex: 1 }}
                      />
                      <Button size="small" type="text" danger icon={<DeleteOutlined />}
                        onClick={() => removePerson(name)} />
                    </>
                  ) : (
                    <>
                      <Tag
                        color={TAG_COLORS[i % TAG_COLORS.length]}
                        onClick={() => { setEditPersonIdx(i); setEditPersonName(name); }}
                        style={{
                          flex: 1, margin: 0, padding: '5px 10px', fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {name} <EditOutlined style={{ marginLeft: 4, opacity: 0.6, fontSize: 11 }} />
                      </Tag>
                      <Button size="small" type="text" danger icon={<DeleteOutlined />}
                        onClick={() => removePerson(name)} />
                    </>
                  )}
                </div>
              ))}
            </Space>
          </div>
        </div>

        {/* Day modal */}
        <Modal
          open={modalDate !== null}
          title={
            <span style={{ textTransform: 'capitalize', fontSize: 16 }}>
              {modalDate?.format('dddd D MMMM YYYY')}
            </span>
          }
          onCancel={() => setModalDate(null)}
          footer={null}
          width={540}
          destroyOnClose
        >
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Select
              placeholder="Person (valfri)"
              options={persons.map((p) => ({ label: p, value: p }))}
              value={newPerson}
              onChange={setNewPerson}
              style={{ width: 160 }}
              allowClear
            />
            <Input
              placeholder="Ny uppgift..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onPressEnter={addTask}
              autoFocus
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addTask}
              disabled={!newText.trim()}
            >
              Lägg till
            </Button>
          </Space.Compact>

          <Space direction="vertical" style={{ width: '100%' }}>
            {dayTasks.length === 0 && (
              <Text type="secondary">Inga uppgifter för den här dagen.</Text>
            )}
            {dayTasks.map((task) => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 6,
                background: '#fafafa', border: '1px solid #f0f0f0',
                opacity: task.done ? 0.55 : 1,
              }}>
                <Checkbox checked={task.done} onChange={() => toggleTask(task.id)} />

                {task.person && (
                  <Tag color={tagColor(task.person, persons)} style={{ margin: 0 }}>
                    {task.person}
                  </Tag>
                )}

                {editId === task.id ? (
                  <Input
                    size="small"
                    value={editText}
                    autoFocus
                    onChange={(e) => setEditText(e.target.value)}
                    onPressEnter={() => saveTaskEdit(task.id)}
                    onBlur={() => saveTaskEdit(task.id)}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span style={{
                    flex: 1, fontSize: 14,
                    textDecoration: task.done ? 'line-through' : 'none',
                    color: task.done ? '#bbb' : 'inherit',
                  }}>
                    {task.text}
                  </span>
                )}

                {!task.done && editId !== task.id && (
                  <Button size="small" type="text" icon={<EditOutlined />}
                    onClick={() => { setEditId(task.id); setEditText(task.text); }} />
                )}
                <Button size="small" type="text" danger icon={<DeleteOutlined />}
                  onClick={() => removeTask(task.id)} />
              </div>
            ))}
          </Space>

          {doneCount > 0 && (
            <Button danger ghost size="small" style={{ marginTop: 12 }} onClick={clearDone}>
              Rensa klara ({doneCount})
            </Button>
          )}
        </Modal>

      </div>
    </ConfigProvider>
  );
}
