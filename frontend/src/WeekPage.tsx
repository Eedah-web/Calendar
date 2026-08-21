import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ConfigProvider, Typography } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import svSE from 'antd/locale/sv_SE';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/sv';
import { loadTasks, type Task, type TaskMap } from './store';
import { useIsMobile } from './useIsMobile';
import Logo from './Logo';
import SidePanel from './SidePanel';

dayjs.extend(isoWeek);
dayjs.locale('sv');

const { Title, Text } = Typography;

const WEEKDAY_LABELS = ['må', 'ti', 'on', 'to', 'fr', 'lö', 'sö'];

export default function WeekPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [taskMap] = useState<TaskMap>(loadTasks);

  const monday = dayjs(date).startOf('isoWeek');
  const days = Array.from({ length: 7 }, (_, i) => monday.add(i, 'day'));
  const weekNumber = monday.isoWeek();
  const todayIso = dayjs().format('YYYY-MM-DD');

  return (
    <ConfigProvider locale={svSE}>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
          padding: isMobile ? '14px 16px' : '16px 220px 16px 32px',
          boxShadow: '0 2px 12px rgba(22,119,255,.25)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ borderColor: 'rgba(255,255,255,.5)', color: '#fff', background: 'rgba(255,255,255,.15)' }}>
            Tillbaka
          </Button>
          <Title level={isMobile ? 5 : 3} style={{ margin: 0, color: '#fff' }}>
            Vecka {weekNumber}
          </Title>
          {!isMobile && (
            <Text style={{ color: 'rgba(255,255,255,.85)' }}>
              {monday.format('D MMM')} – {monday.add(6, 'day').format('D MMM YYYY')}
            </Text>
          )}
          <Logo variant="red" size="sm" scale={isMobile ? 0.55 : 0.95} style={{ marginLeft: isMobile ? 8 : 24 }} />
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
                Vecka {dayjs().isoWeek()}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, textTransform: 'capitalize' }}>
                {dayjs().format('dddd D MMMM YYYY')}
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
          {/* Grid - same look as the month calendar's cells, just one row */}
          <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 8, padding: isMobile ? 10 : 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} style={{ padding: '0 0 8px', color: 'rgba(0,0,0,.88)', fontSize: 13 }}>
                  {label}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {days.map((d) => {
                const iso = d.format('YYYY-MM-DD');
                const list = taskMap[iso] ?? [];
                const total = list.length;
                const rows = [
                  { count: list.filter((t: Task) => t.status === 'active').length,   label: 'Active',   color: '#1677ff' },
                  { count: list.filter((t: Task) => t.status === 'onhold').length,   label: 'On hold',  color: '#fa8c16' },
                  { count: list.filter((t: Task) => t.status === 'complete').length, label: 'Complete', color: '#52c41a' },
                  { count: list.filter((t: Task) => !t.status).length,               label: '–',        color: '#bfbfbf' },
                ].filter((r) => r.count > 0);
                const hasNotes = list.some((t: Task) => (t.notes?.length ?? 0) > 0);
                const isToday = iso === todayIso;

                return (
                  <div
                    key={iso}
                    onClick={() => navigate(`/day/${iso}`)}
                    style={{
                      border: '1px solid #f0f0f0', marginLeft: -1, marginTop: -1,
                      minHeight: isMobile ? 70 : 140, padding: '4px 8px', cursor: 'pointer',
                      background: isToday ? '#e6f4ff' : undefined,
                    }}
                  >
                    <span style={{ display: 'inline-block', fontSize: isMobile ? 13 : 14, fontWeight: isToday ? 700 : 400 }}>
                      {d.format('D')}
                    </span>

                    {total > 0 && (
                      <div style={{ position: 'relative', paddingBottom: hasNotes ? 16 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2 }}>
                          {rows.map((r) => (
                            <span key={r.label} style={{ fontSize: 10, color: r.color, fontWeight: 700, lineHeight: '14px', whiteSpace: 'nowrap' }}>
                              {r.count}/{total} {r.label}
                            </span>
                          ))}
                        </div>
                        {hasNotes && (
                          <span style={{ position: 'absolute', bottom: 0, right: 0, color: '#1677ff', fontSize: 12 }}>
                            <FileTextOutlined />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          <SidePanel isMobile={isMobile} />
        </div>
      </div>
    </ConfigProvider>
  );
}
