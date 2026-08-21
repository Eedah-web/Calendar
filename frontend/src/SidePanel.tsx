import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal, Space, Tag, Typography } from 'antd';
import {
  DeleteOutlined, EditOutlined, InboxOutlined, OrderedListOutlined, PlusOutlined, TeamOutlined,
} from '@ant-design/icons';
import {
  TAG_COLORS, loadArchive, loadPersons, loadPresets, loadTasks, saveTasks,
  savePersons, savePresets, type ArchivedNote,
} from './store';

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

const { Title, Text } = Typography;

export default function SidePanel({ isMobile }: { isMobile: boolean }) {
  const navigate = useNavigate();

  const [persons, setPersons] = useState<string[]>(loadPersons);
  const [presets, setPresets] = useState<string[]>(loadPresets);
  const [archive, setArchive] = useState<ArchivedNote[]>([]);

  /* user modal */
  const [usersOpen, setUsersOpen] = useState(false);
  const [newName,   setNewName]   = useState('');
  const [editIdx,   setEditIdx]   = useState<number | null>(null);
  const [editName,  setEditName]  = useState('');

  /* presets modal */
  const [presetsOpen,    setPresetsOpen]    = useState(false);
  const [newPreset,      setNewPreset]      = useState('');
  const [editPresetIdx,  setEditPresetIdx]  = useState<number | null>(null);
  const [editPresetName, setEditPresetName] = useState('');

  useEffect(() => { setArchive(loadArchive()); }, []);
  useEffect(() => { savePersons(persons); }, [persons]);
  useEffect(() => { savePresets(presets); }, [presets]);

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
      saveTasks(updated);
    }
    setEditIdx(null);
  };

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
    <>
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
    </>
  );
}
