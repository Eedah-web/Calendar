import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ConfigProvider,
  Radio, Select, Typography,
} from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import svSE from 'antd/locale/sv_SE';
import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/sv';

dayjs.extend(isoWeek);
import { loadTasks, type Task, type TaskMap } from './store';
import { useIsMobile } from './useIsMobile';
import Logo from './Logo';
import SidePanel from './SidePanel';

dayjs.locale('sv');

const { Title, Text } = Typography;

export default function CalendarPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [taskMap, setTaskMap] = useState<TaskMap>({});
  const [calDate, setCalDate] = useState<Dayjs>(dayjs());
  const [calMode, setCalMode] = useState<'month' | 'year'>('month');

  useEffect(() => {
    setTaskMap(loadTasks());
  }, []);

  /* ── day cell content (used by our own month grid) ── */
  const renderDayContent = (current: Dayjs) => {
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
  };

  /* ── month-grid weeks: Monday-Sunday rows covering the viewed month, with lead-in/
     trail-out days from the neighbouring months (like a normal month calendar) ── */
  const monthGridWeeks = (() => {
    const gridStart = calDate.startOf('month').startOf('isoWeek');
    const gridEnd = calDate.endOf('month').endOf('isoWeek');
    const weeksCount = Math.round(gridEnd.diff(gridStart, 'day') / 7) + 1;
    return Array.from({ length: weeksCount }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => gridStart.add(w * 7 + d, 'day')),
    );
  })();

  const yearOptions = Array.from({ length: 11 }, (_, i) => dayjs().year() - 5 + i)
    .map((y) => ({ value: y, label: y }));
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i, label: dayjs().month(i).format('MMM') }));

  /* ── year-view cell (only used when calMode === 'year') ── */
  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
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
          <Title level={3} style={{ margin: 0, color: '#fff' }}>Kalender</Title>
          {!isMobile && <Text style={{ color: 'rgba(255,255,255,.85)' }}>Hantera uppgifter dag för dag</Text>}
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
          {/* Calendar */}
          <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 8, padding: isMobile ? 10 : 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <style>{`
              .cal-day-cell:hover { background: #fafafa; }
              .cal-week-cell:hover { background: #d9f7be; }
            `}</style>

            {/* Year/month pickers + Månad/År toggle */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <Select
                value={calDate.year()}
                options={yearOptions}
                onChange={(y) => setCalDate(calDate.year(y).date(1))}
                style={{ width: 90 }}
              />
              {calMode === 'month' && (
                <Select
                  value={calDate.month()}
                  options={monthOptions}
                  onChange={(m) => setCalDate(calDate.month(m).date(1))}
                  style={{ width: 80 }}
                />
              )}
              <Radio.Group value={calMode} onChange={(e) => setCalMode(e.target.value)} optionType="button" buttonStyle="solid">
                <Radio.Button value="month">Månad</Radio.Button>
                <Radio.Button value="year">År</Radio.Button>
              </Radio.Group>
            </div>

            {calMode === 'year' ? (
              <Calendar
                value={calDate}
                mode="year"
                cellRender={cellRender}
                headerRender={() => null}
                onSelect={(d) => { setCalDate(d); setCalMode('month'); }}
              />
            ) : (
              <div>
                {/* weekday header row (leading blank cell for the week column) */}
                <div style={{ display: 'grid', gridTemplateColumns: `${isMobile ? 32 : 48}px repeat(7, 1fr)` }}>
                  <div />
                  {['må', 'ti', 'on', 'to', 'fr', 'lö', 'sö'].map((label) => (
                    <div key={label} style={{ padding: '0 0 8px', color: 'rgba(0,0,0,.88)', fontSize: 13 }}>
                      {label}
                    </div>
                  ))}
                </div>

                {monthGridWeeks.map((week) => {
                  const monday = week[0];
                  return (
                    <div key={monday.format('YYYY-MM-DD')} style={{ display: 'grid', gridTemplateColumns: `${isMobile ? 32 : 48}px repeat(7, 1fr)` }}>
                      <div
                        className="cal-week-cell"
                        onClick={() => navigate(`/week/${monday.format('YYYY-MM-DD')}`)}
                        title={`Visa vecka ${monday.isoWeek()}`}
                        style={{
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4,
                          fontSize: 11, fontWeight: 700, color: '#237804', cursor: 'pointer',
                          background: '#f6ffed', borderRight: '1px solid #b7eb8f', borderTop: '2px solid #f0f0f0',
                        }}
                      >
                        {monday.isoWeek()}
                      </div>
                      {week.map((day) => {
                        const iso = day.format('YYYY-MM-DD');
                        const inMonth = day.month() === calDate.month();
                        const isToday = iso === dayjs().format('YYYY-MM-DD');
                        return (
                          <div
                            key={iso}
                            className="cal-day-cell"
                            onClick={() => navigate(`/day/${iso}`)}
                            style={{
                              minHeight: isMobile ? 56 : 120, padding: '4px 8px', cursor: 'pointer',
                              border: '1px solid #f0f0f0', marginLeft: -1, marginTop: -1,
                              background: isToday ? '#e6f4ff' : undefined,
                            }}
                          >
                            <span style={{
                              display: 'inline-block', fontSize: isMobile ? 13 : 14,
                              color: inMonth ? 'rgba(0,0,0,.88)' : 'rgba(0,0,0,.25)',
                              fontWeight: isToday ? 700 : 400,
                            }}>
                              {day.format('D')}
                            </span>
                            {inMonth && renderDayContent(day)}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <SidePanel isMobile={isMobile} />
        </div>
      </div>
    </ConfigProvider>
  );
}
