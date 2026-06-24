import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Crown, Calendar } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
//  BIW BRAND TOKENS — Brand Color Palette v1.0 (Clinical Clean system)
// ─────────────────────────────────────────────────────────────

const C = {
  bg:            '#F8F6F2',  // Clinical Pearl — primary content background
  surface:       '#FDFCFA',  // Surgical White — card surface
  divider:       '#E8EAEC',  // Mist Silver
  border:        '#D8DCDF',  // deepened Mist Silver for legibility
  textPrimary:   '#1F2A33',  // Midnight Slate
  textBody:      '#3E5260',  // Slate Clinical
  textMuted:     '#7A8A95',  // Steel Mist deepened
  silver:        '#8FA8B8',  // Surgical Silver — clinical accent
  silverSoft:    '#B8C0C7',  // Steel Mist
  gold:          '#C9A961',  // Heritage Gold — logo lockup only
  goldDeep:      '#9A7E3D',
  coral:         '#D4836B',  // Trust Coral — CTAs only
  coralSoft:     '#F0D5C9',
  sage:          '#6E8870',  // Healing Sage — semantic "good"
  sageSoft:      '#C8D2C9',
  clay:          '#B0654E',  // muted clay for warnings
  claySoft:      '#F2DCD3',
  nude:          '#E8D9CA',
};

// ─────────────────────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────────────────────

const BRANCHES = [
  { id: 'gulshan',   name: 'Gulshan Flagship', city: 'Dhaka', rooms: 8 },
  { id: 'dhanmondi', name: 'Dhanmondi',         city: 'Dhaka', rooms: 6 },
  { id: 'banani',    name: 'Banani',            city: 'Dhaka', rooms: 5 },
  { id: 'uttara',    name: 'Uttara',            city: 'Dhaka', rooms: 4 },
];

const THERAPISTS = [
  { id: 't1', name: 'Nusrat A.',  role: 'Senior Aesthetician', load: 6, capacity: 7, status: 'busy' },
  { id: 't2', name: 'Farzana K.', role: 'Dermatology Tech',    load: 5, capacity: 7, status: 'busy' },
  { id: 't3', name: 'Riya H.',    role: 'Hair & Scalp',         load: 3, capacity: 6, status: 'available' },
  { id: 't4', name: 'Tasneem R.', role: 'Body Therapist',       load: 7, capacity: 7, status: 'overbooked' },
  { id: 't5', name: 'Mahin S.',   role: 'Aesthetician',         load: 2, capacity: 6, status: 'idle' },
  { id: 't6', name: 'Sabina I.',  role: 'Nail & Extremity',     load: 4, capacity: 6, status: 'busy' },
];

const NOW_HOUR = 14;
const NOW_MIN = 23;

const TODAY_BOOKINGS = [
  { id: 'b1',  time: '09:00', client: 'Anaya R.',     service: 'Hydrafacial MD',  therapist: 'Nusrat A.',  room: 'Suite 1',     status: 'completed',     tier: 'elite',    revenue: 8500 },
  { id: 'b2',  time: '09:30', client: 'Farah Z.',     service: 'Scalp Therapy',   therapist: 'Riya H.',    room: 'Suite 4',     status: 'completed',     tier: 'premium',  revenue: 4200 },
  { id: 'b3',  time: '10:00', client: 'Mehjabin K.',  service: 'Chemical Peel',   therapist: 'Farzana K.', room: 'Clinical 2',  status: 'completed',     tier: 'walk-in',  revenue: 6800 },
  { id: 'b4',  time: '10:30', client: 'Sumaiya P.',   service: 'Body Contouring', therapist: 'Tasneem R.', room: 'Body Suite',  status: 'completed',     tier: 'elite',    revenue: 12500 },
  { id: 'b5',  time: '11:00', client: 'Nadia I.',     service: 'Hydrafacial MD',  therapist: 'Nusrat A.',  room: 'Suite 1',     status: 'completed',     tier: 'premium',  revenue: 8500 },
  { id: 'b6',  time: '12:00', client: 'Rifat A.',     service: 'Manicure Lux',    therapist: 'Sabina I.',  room: 'Nail Bar',    status: 'completed',     tier: 'basic',    revenue: 2400 },
  { id: 'b7',  time: '13:00', client: 'Tahmina L.',   service: 'Microneedling',   therapist: 'Farzana K.', room: 'Clinical 2',  status: 'completed',     tier: 'elite',    revenue: 9800 },
  { id: 'b8',  time: '13:30', client: 'Sadia M.',     service: 'Express Facial',  therapist: 'Mahin S.',   room: 'Suite 3',     status: 'completed',     tier: 'walk-in',  revenue: 3200 },
  { id: 'b9',  time: '14:00', client: 'Rina B.',      service: 'Hydrafacial MD',  therapist: 'Nusrat A.',  room: 'Suite 1',     status: 'in-progress',   tier: 'premium',  revenue: 8500, lateMin: 12 },
  { id: 'b10', time: '14:00', client: 'Zara F.',      service: 'Body Wrap',       therapist: 'Tasneem R.', room: 'Body Suite',  status: 'in-progress',   tier: 'elite',    revenue: 11000 },
  { id: 'b11', time: '14:00', client: 'Priya S.',     service: 'Hair Treatment',  therapist: 'Riya H.',    room: 'Suite 4',     status: 'in-progress',   tier: 'premium',  revenue: 5500 },
  { id: 'b12', time: '14:30', client: 'Maliha C.',    service: 'Chemical Peel',   therapist: 'Farzana K.', room: 'Clinical 2',  status: 'starting-soon', tier: 'elite',    revenue: 6800, vipNote: 'Founding member' },
  { id: 'b13', time: '15:00', client: 'Tania B.',     service: 'Express Facial',  therapist: 'Mahin S.',   room: 'Suite 3',     status: 'upcoming',      tier: 'walk-in',  revenue: 3200 },
  { id: 'b14', time: '15:00', client: 'Anjuman D.',   service: 'Microneedling',   therapist: 'Tasneem R.', room: 'Body Suite',  status: 'upcoming',      tier: 'premium',  revenue: 9800, conflict: true },
  { id: 'b15', time: '15:30', client: 'Sharmin K.',   service: 'Manicure + Pedi', therapist: 'Sabina I.',  room: 'Nail Bar',    status: 'upcoming',      tier: 'basic',    revenue: 3800 },
  { id: 'b16', time: '16:00', client: 'Lubna R.',     service: 'Hydrafacial MD',  therapist: 'Nusrat A.',  room: 'Suite 1',     status: 'upcoming',      tier: 'elite',    revenue: 8500 },
  { id: 'b17', time: '16:00', client: 'Reshma A.',    service: 'Scalp Therapy',   therapist: 'Riya H.',    room: 'Suite 4',     status: 'upcoming',      tier: 'premium',  revenue: 4200 },
  { id: 'b18', time: '17:00', client: 'Mim K.',       service: 'Chemical Peel',   therapist: 'Farzana K.', room: 'Clinical 2',  status: 'upcoming',      tier: 'elite',    revenue: 6800 },
  { id: 'b19', time: '17:30', client: 'Tabassum H.',  service: 'Body Wrap',       therapist: 'Tasneem R.', room: 'Body Suite',  status: 'upcoming',      tier: 'premium',  revenue: 11000 },
  { id: 'b20', time: '18:00', client: 'Fariha N.',    service: 'Express Facial',  therapist: 'Mahin S.',   room: 'Suite 3',     status: 'upcoming',      tier: 'walk-in',  revenue: 3200 },
];

const ALERTS = [
  { id: 'a1', severity: 'high',   msg: 'Rina B. — 12 min late for Hydrafacial (Suite 1)',         time: 'now',      action: 'Contact' },
  { id: 'a2', severity: 'high',   msg: 'Tasneem R. has 2 overlapping bookings at 15:00',          time: '37m',      action: 'Reassign' },
  { id: 'a3', severity: 'medium', msg: 'Maliha C. (Founding Elite) arriving 14:30 — flag VIP',    time: '7m',       action: 'Brief team' },
  { id: 'a4', severity: 'low',    msg: 'Suite 3 idle 13:30–14:30 — could fit walk-in',            time: '23m',      action: 'Promote' },
  { id: 'a5', severity: 'medium', msg: 'No bookings 16:00–18:00 in Nail Bar',                     time: '1h 37m',   action: 'Push offer' },
];

const ROOMS = [
  { id: 'r1', name: 'Suite 1',       type: 'Facial' },
  { id: 'r2', name: 'Clinical 2',    type: 'Medical' },
  { id: 'r3', name: 'Suite 3',       type: 'Facial' },
  { id: 'r4', name: 'Suite 4',       type: 'Hair' },
  { id: 'r5', name: 'Body Suite',    type: 'Body' },
  { id: 'r6', name: 'Nail Bar',      type: 'Extremity' },
  { id: 'r7', name: 'Consult Room',  type: 'Consult' },
  { id: 'r8', name: 'Recovery',      type: 'Recovery' },
];

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const generateHeatmap = () => {
  const map = {};
  ROOMS.forEach((r) => {
    map[r.id] = {};
    HOURS.forEach((h) => {
      let intensity = 0;
      if (h < NOW_HOUR) {
        intensity = Math.random() > 0.25 ? 0.6 + Math.random() * 0.4 : Math.random() * 0.4;
      } else if (h === NOW_HOUR) {
        intensity = ['r1', 'r4', 'r5'].includes(r.id) ? 1 : 0.2;
      } else if (h <= 17) {
        intensity = Math.random() > 0.35 ? 0.7 + Math.random() * 0.3 : Math.random() * 0.5;
      } else {
        intensity = Math.random() * 0.6;
      }
      map[r.id][h] = intensity;
    });
  });
  return map;
};
const HEATMAP = generateHeatmap();

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const formatBDT = (n) => `৳${n.toLocaleString('en-IN')}`;

const tierStyle = (tier) => {
  const map = {
    elite:    { bg: 'rgba(201, 169, 97, 0.12)',  border: C.gold,        text: C.goldDeep,  label: 'ELITE' },
    premium:  { bg: 'rgba(143, 168, 184, 0.14)', border: C.silver,      text: '#5A7889',   label: 'PREMIUM' },
    basic:    { bg: 'rgba(184, 192, 199, 0.18)', border: C.silverSoft,  text: C.textBody,  label: 'BASIC' },
    'walk-in':{ bg: 'transparent',                border: C.border,      text: C.textMuted, label: 'WALK-IN' },
  };
  return map[tier] || map['walk-in'];
};

const statusStyle = (status) => {
  const map = {
    completed:      { fg: C.sage,      bg: 'rgba(110, 136, 112, 0.10)', label: 'Completed' },
    'in-progress':  { fg: C.silver,    bg: 'rgba(143, 168, 184, 0.18)', label: 'In Service' },
    'starting-soon':{ fg: C.coral,     bg: 'rgba(212, 131, 107, 0.12)', label: 'Starting Soon' },
    upcoming:       { fg: C.textMuted, bg: 'rgba(122, 138, 149, 0.08)', label: 'Upcoming' },
  };
  return map[status] || map.upcoming;
};

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function BIWDashboard() {
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [date] = useState(new Date());
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const metrics = useMemo(() => {
    const completed = TODAY_BOOKINGS.filter((b) => b.status === 'completed');
    const inProgress = TODAY_BOOKINGS.filter((b) => b.status === 'in-progress');
    const upcoming = TODAY_BOOKINGS.filter((b) => b.status === 'upcoming' || b.status === 'starting-soon');
    const realizedRev = completed.reduce((s, b) => s + b.revenue, 0);
    const projectedRev = TODAY_BOOKINGS.reduce((s, b) => s + b.revenue, 0);
    const targetRev = 165000;
    const eliteCount = TODAY_BOOKINGS.filter((b) => b.tier === 'elite').length;
    return {
      completed: completed.length,
      inProgress: inProgress.length,
      upcoming: upcoming.length,
      total: TODAY_BOOKINGS.length,
      realizedRev,
      projectedRev,
      targetRev,
      pctTarget: Math.round((projectedRev / targetRev) * 100),
      eliteCount,
    };
  }, []);

  return (
    <div style={S.root}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logo}>
            <div style={S.logoMark}>BI</div>
            <div>
              <div style={S.logoName}>BEAUTY INTELLIGENT WELLNESS</div>
              <div style={S.logoSub}>Operations · Live</div>
            </div>
          </div>
        </div>

        <div style={S.headerRight}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setBranchOpen(!branchOpen)} style={S.branchBtn}>
              <span style={{ color: C.textMuted, fontSize: '10px', letterSpacing: '0.18em', marginRight: '12px', fontWeight: 500 }}>BRANCH</span>
              <span style={{ fontWeight: 500, color: C.textPrimary }}>{branch.name}</span>
              <ChevronDown size={14} style={{ marginLeft: '14px', color: C.textMuted, transform: branchOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {branchOpen && (
              <div style={S.branchDropdown}>
                {BRANCHES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setBranch(b); setBranchOpen(false); }}
                    style={{ ...S.branchOption, ...(b.id === branch.id ? S.branchOptionActive : {}) }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: C.textPrimary }}>{b.name}</div>
                      <div style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.12em', marginTop: '3px' }}>{b.city.toUpperCase()} · {b.rooms} ROOMS</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={S.dateBox}>
            <Calendar size={13} style={{ color: C.textMuted }} />
            <span style={{ fontSize: '12px', letterSpacing: '0.05em', color: C.textBody, fontWeight: 500 }}>
              {date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
            </span>
          </div>

          <div style={S.liveBox}>
            <div style={{ ...S.livePulse, opacity: pulse % 2 === 0 ? 1 : 0.35 }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600, color: C.textPrimary }}>
              LIVE · {String(NOW_HOUR).padStart(2, '0')}:{String(NOW_MIN).padStart(2, '0')}
            </span>
          </div>
        </div>
      </header>

      <main style={S.main}>

        {/* TOP ROW — Glance layer */}
        <section style={S.glanceRow}>
          <div style={S.glanceCard}>
            <div style={S.glanceLabel}>TODAY · PROJECTED REVENUE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
              <RevenueRing pct={metrics.pctTarget} />
              <div>
                <div style={S.bigNumber}>{formatBDT(metrics.projectedRev)}</div>
                <div style={{ fontSize: '11px', color: C.textMuted, letterSpacing: '0.08em', marginTop: '8px', fontWeight: 500 }}>
                  TARGET · {formatBDT(metrics.targetRev)}
                </div>
                <div style={{ fontSize: '11px', color: C.sage, letterSpacing: '0.08em', marginTop: '4px', fontWeight: 500 }}>
                  REALIZED · {formatBDT(metrics.realizedRev)}
                </div>
              </div>
            </div>
          </div>

          <div style={S.glanceCard}>
            <div style={S.glanceLabel}>SERVICE FLOW · NOW</div>
            <div style={S.flowGrid}>
              <FlowStat n={metrics.completed} label="DONE"    color={C.sage} />
              <div style={S.flowDivider} />
              <FlowStat n={metrics.inProgress} label="LIVE"   color={C.silver} pulsing />
              <div style={S.flowDivider} />
              <FlowStat n={metrics.upcoming}   label="QUEUED" color={C.textMuted} />
            </div>
          </div>

          <div style={S.glanceCard}>
            <div style={S.glanceLabel}>ELITE PRESENCE · TODAY</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginTop: '16px' }}>
              <Crown size={22} style={{ color: C.gold }} />
              <div style={S.bigNumber}>{metrics.eliteCount}</div>
              <div style={{ fontSize: '11px', color: C.textMuted, letterSpacing: '0.08em', fontWeight: 500 }}>
                OF {metrics.total} BOOKINGS
              </div>
            </div>
            <div style={{ marginTop: '14px', fontSize: '11px', color: C.coral, letterSpacing: '0.04em', fontWeight: 500 }}>
              ↗ 1 founding member arriving 14:30
            </div>
          </div>

          <div style={S.glanceCard}>
            <div style={S.glanceLabel}>SUBSCRIPTION PULSE</div>
            <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 400, color: C.sage, fontFamily: '"DM Serif Display", serif' }}>+3</div>
                <div style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.12em', marginTop: '4px', fontWeight: 500 }}>NEW</div>
              </div>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 400, color: C.clay, fontFamily: '"DM Serif Display", serif' }}>−1</div>
                <div style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.12em', marginTop: '4px', fontWeight: 500 }}>CHURN</div>
              </div>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 400, color: C.textPrimary, fontFamily: '"DM Serif Display", serif' }}>247</div>
                <div style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.12em', marginTop: '4px', fontWeight: 500 }}>ACTIVE</div>
              </div>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW — Heatmap + Alerts */}
        <section style={S.midRow}>
          <div style={S.bigCard}>
            <div style={S.cardHeader}>
              <div>
                <div style={S.cardTitle}>Room Utilization · Today</div>
                <div style={S.cardSub}>Live occupancy across all suites — your real revenue ceiling</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '10px', letterSpacing: '0.12em', color: C.textMuted, fontWeight: 500 }}>
                <span>IDLE</span>
                <div style={S.heatLegend}>
                  {[0.15, 0.35, 0.55, 0.75, 0.95].map((v, i) => (
                    <div key={i} style={{ width: '14px', height: '8px', background: `rgba(143, 168, 184, ${v})` }} />
                  ))}
                </div>
                <span>FULL</span>
              </div>
            </div>

            <div style={S.heatmapContainer}>
              <div style={S.heatmapRow}>
                <div style={S.heatmapRoomCell} />
                {HOURS.map((h) => (
                  <div key={h} style={{ ...S.heatmapHourCell, ...(h === NOW_HOUR ? S.heatmapHourNow : {}) }}>
                    {String(h).padStart(2, '0')}
                  </div>
                ))}
              </div>
              {ROOMS.map((room) => (
                <div key={room.id} style={S.heatmapRow}>
                  <div style={S.heatmapRoomCell}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: C.textPrimary }}>{room.name}</div>
                    <div style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.12em', marginTop: '2px', fontWeight: 500 }}>{room.type.toUpperCase()}</div>
                  </div>
                  {HOURS.map((h) => {
                    const v = HEATMAP[room.id][h];
                    const isNow = h === NOW_HOUR;
                    const isPast = h < NOW_HOUR;
                    return (
                      <div
                        key={h}
                        style={{
                          ...S.heatmapCell,
                          background: isPast
                            ? `rgba(110, 136, 112, ${v * 0.55})`
                            : `rgba(143, 168, 184, ${v * 0.95})`,
                          border: isNow ? `1.5px solid ${C.coral}` : `1px solid ${C.border}`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.divider}`, fontSize: '11px', color: C.textBody, display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
              <span>Avg utilization today: <span style={{ color: C.silver, fontWeight: 600 }}>71%</span></span>
              <span>Idle room-hours: <span style={{ color: C.clay, fontWeight: 600 }}>9.5</span> · Lost potential: <span style={{ color: C.clay, fontWeight: 600 }}>{formatBDT(47500)}</span></span>
            </div>
          </div>

          <div style={{ ...S.bigCard, padding: 0 }}>
            <div style={{ ...S.cardHeader, padding: '22px 24px 16px', marginBottom: 0 }}>
              <div>
                <div style={S.cardTitle}>Attention</div>
                <div style={S.cardSub}>What needs you, ranked</div>
              </div>
              <div style={S.alertBadge}>
                <span style={{ color: C.clay, fontWeight: 700 }}>{ALERTS.filter((a) => a.severity === 'high').length}</span>
                <span style={{ color: C.textMuted }}> · {ALERTS.length}</span>
              </div>
            </div>
            <div style={S.alertList}>
              {ALERTS.map((a) => (
                <AlertRow key={a.id} alert={a} />
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM ROW — Therapists + Schedule */}
        <section style={S.botRow}>
          <div style={S.bigCard}>
            <div style={S.cardHeader}>
              <div>
                <div style={S.cardTitle}>Therapist Load</div>
                <div style={S.cardSub}>Real-time capacity — drag bookings to rebalance</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {THERAPISTS.map((t) => (
                <TherapistRow key={t.id} t={t} />
              ))}
            </div>
          </div>

          <div style={{ ...S.bigCard, gridColumn: 'span 2' }}>
            <div style={S.cardHeader}>
              <div>
                <div style={S.cardTitle}>Today's Schedule</div>
                <div style={S.cardSub}>{branch.name} · {TODAY_BOOKINGS.length} bookings</div>
              </div>
              <div style={{ display: 'flex', gap: '14px', fontSize: '10px', letterSpacing: '0.12em', color: C.textMuted, fontWeight: 500 }}>
                <LegendDot color={C.sage}      label="DONE" />
                <LegendDot color={C.silver}    label="LIVE" pulsing />
                <LegendDot color={C.coral}     label="SOON" />
                <LegendDot color={C.textMuted} label="QUEUED" />
              </div>
            </div>
            <div style={S.scheduleHeader}>
              <span style={{ width: '60px' }}>TIME</span>
              <span style={{ width: '90px' }}>TIER</span>
              <span style={{ flex: 1 }}>CLIENT</span>
              <span style={{ flex: 1 }}>SERVICE</span>
              <span style={{ width: '100px' }}>THERAPIST</span>
              <span style={{ width: '90px' }}>ROOM</span>
              <span style={{ width: '110px', textAlign: 'right' }}>STATUS</span>
            </div>
            <div style={S.scheduleList}>
              {TODAY_BOOKINGS.map((b) => (
                <BookingRow key={b.id} b={b} pulse={pulse} />
              ))}
            </div>
          </div>
        </section>

        <footer style={S.footer}>
          <div style={{ fontSize: '10px', letterSpacing: '0.22em', color: C.textMuted, fontWeight: 500 }}>
            BIW · CLINICAL CLEAN · OPS DASHBOARD V0.2
          </div>
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textMuted, fontWeight: 500 }}>
            Last sync · 12s ago
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function RevenueRing({ pct }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(pct, 100) / 100) * c;
  return (
    <div style={{ position: 'relative', width: '82px', height: '82px', flexShrink: 0 }}>
      <svg width="82" height="82" viewBox="0 0 82 82" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="41" cy="41" r={r} fill="none" stroke={C.divider} strokeWidth="3" />
        <circle
          cx="41" cy="41" r={r}
          fill="none"
          stroke={C.silver}
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontSize: '22px', fontWeight: 400, color: C.textPrimary, letterSpacing: '-0.02em', fontFamily: '"DM Serif Display", serif' }}>
          {pct}<span style={{ fontSize: '11px', color: C.textMuted, fontFamily: 'Inter, sans-serif' }}>%</span>
        </div>
      </div>
    </div>
  );
}

function FlowStat({ n, label, color, pulsing }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
      <div style={{
        fontSize: '34px',
        fontWeight: 400,
        color,
        letterSpacing: '-0.03em',
        fontFamily: '"DM Serif Display", serif',
        position: 'relative',
        display: 'inline-block',
        lineHeight: 1,
      }}>
        {n}
        {pulsing && (
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '-14px',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 10px ${color}`,
            animation: 'biwPulse 1.4s ease-in-out infinite',
          }} />
        )}
      </div>
      <div style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.18em', marginTop: '6px', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function LegendDot({ color, label, pulsing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: color,
        boxShadow: pulsing ? `0 0 8px ${color}` : 'none',
        animation: pulsing ? 'biwPulse 1.4s ease-in-out infinite' : 'none',
      }} />
      <span>{label}</span>
    </div>
  );
}

function AlertRow({ alert }) {
  const colors = {
    high:   { dot: C.clay,   text: C.clay,    border: C.clay,    bg: C.claySoft  },
    medium: { dot: C.coral,  text: '#9C5A45', border: C.coral,   bg: C.coralSoft },
    low:    { dot: C.silver, text: '#5A7889', border: C.silver,  bg: 'rgba(143, 168, 184, 0.15)' },
  };
  const c = colors[alert.severity];
  return (
    <div style={{
      padding: '16px 24px',
      borderTop: `1px solid ${C.divider}`,
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: c.dot,
        marginTop: '6px',
        flexShrink: 0,
        boxShadow: alert.severity === 'high' ? `0 0 10px ${c.dot}` : 'none',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: C.textPrimary, fontWeight: 500 }}>{alert.msg}</div>
        <div style={{ display: 'flex', gap: '14px', marginTop: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.12em', fontWeight: 600 }}>{alert.time.toUpperCase()}</span>
          <button style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            color: c.text,
            padding: '4px 11px',
            fontSize: '10px',
            letterSpacing: '0.12em',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
          }}>{alert.action.toUpperCase()}</button>
        </div>
      </div>
    </div>
  );
}

function TherapistRow({ t }) {
  const pct = (t.load / t.capacity) * 100;
  const colors = {
    overbooked: C.clay,
    busy:       C.silver,
    available:  C.sage,
    idle:       C.silverSoft,
  };
  const c = colors[t.status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px 0' }}>
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: C.bg,
        border: `1.5px solid ${C.silver}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        letterSpacing: '0.04em',
        color: C.textPrimary,
        flexShrink: 0,
        fontWeight: 600,
      }}>
        {t.name.split(' ').map((p) => p[0]).join('')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: C.textPrimary }}>{t.name}</span>
            <span style={{ fontSize: '10.5px', color: C.textMuted, letterSpacing: '0.04em', marginLeft: '10px', fontWeight: 500 }}>{t.role}</span>
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '0.06em', color: c, fontWeight: 700 }}>
            {t.load}/{t.capacity}
          </div>
        </div>
        <div style={{ height: '4px', background: C.divider, position: 'relative', overflow: 'hidden', borderRadius: '2px' }}>
          <div style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            background: c,
            transition: 'width 0.6s ease-out',
            boxShadow: t.status === 'overbooked' ? `0 0 6px ${C.clay}` : 'none',
          }} />
        </div>
      </div>
    </div>
  );
}

function BookingRow({ b, pulse }) {
  const tier = tierStyle(b.tier);
  const stat = statusStyle(b.status);
  const isLive = b.status === 'in-progress';
  const hasIssue = b.lateMin || b.conflict;
  const isElite = b.tier === 'elite';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 0',
      borderBottom: `1px solid ${C.divider}`,
      fontSize: '12.5px',
      position: 'relative',
      background: isElite ? 'rgba(201, 169, 97, 0.025)' : 'transparent',
      paddingLeft: isElite ? '12px' : '0',
      borderLeft: isElite ? `2px solid ${C.gold}` : '2px solid transparent',
    }}>
      <div style={{ width: '60px', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: '13px', color: stat.fg, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
        {b.time}
        {isLive && (
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: C.silver,
            marginLeft: '7px',
            boxShadow: `0 0 8px ${C.silver}`,
            opacity: pulse % 2 === 0 ? 1 : 0.4,
          }} />
        )}
      </div>

      <div style={{ width: '90px' }}>
        <span style={{
          fontSize: '9px',
          letterSpacing: '0.18em',
          padding: '4px 8px',
          background: tier.bg,
          border: `1px solid ${tier.border}`,
          color: tier.text,
          fontWeight: 700,
        }}>
          {tier.label}
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.textPrimary, fontWeight: 500 }}>
        {b.client}
        {b.vipNote && <div style={{ fontSize: '9.5px', color: C.goldDeep, letterSpacing: '0.06em', marginTop: '3px', fontWeight: 600 }}>★ {b.vipNote.toUpperCase()}</div>}
      </div>

      <div style={{ flex: 1, color: C.textBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.service}</div>

      <div style={{ width: '100px', color: C.textBody, fontSize: '11.5px' }}>{b.therapist}</div>

      <div style={{ width: '90px', color: C.textMuted, fontSize: '11px', letterSpacing: '0.03em', fontWeight: 500 }}>{b.room}</div>

      <div style={{ width: '110px', textAlign: 'right', position: 'relative' }}>
        <span style={{
          fontSize: '10px',
          letterSpacing: '0.12em',
          color: stat.fg,
          padding: '4px 9px',
          background: stat.bg,
          fontWeight: 700,
        }}>
          {stat.label.toUpperCase()}
        </span>
        {hasIssue && (
          <div style={{ position: 'absolute', right: 0, top: '26px', fontSize: '9.5px', color: C.clay, letterSpacing: '0.06em', fontWeight: 700 }}>
            {b.lateMin && `${b.lateMin}M LATE`}
            {b.conflict && 'CONFLICT'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────

const S = {
  root: {
    minHeight: '100vh',
    background: C.bg,
    color: C.textPrimary,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    position: 'relative',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    background: 'rgba(248, 246, 242, 0.92)',
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${C.border}`,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '24px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  logo: { display: 'flex', alignItems: 'center', gap: '14px' },
  logoMark: {
    width: '40px',
    height: '40px',
    border: `1.5px solid ${C.gold}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    letterSpacing: '0.06em',
    color: C.goldDeep,
    fontFamily: '"DM Serif Display", "Cormorant Garamond", serif',
    fontWeight: 500,
    background: 'rgba(201, 169, 97, 0.04)',
  },
  logoName: { fontSize: '11px', letterSpacing: '0.26em', fontWeight: 600, color: C.textPrimary },
  logoSub:  { fontSize: '9.5px', letterSpacing: '0.22em', color: C.textMuted, marginTop: '3px', fontWeight: 500 },
  branchBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '11px 18px',
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.textPrimary,
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
  },
  branchDropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: C.surface,
    border: `1px solid ${C.border}`,
    minWidth: '270px',
    zIndex: 200,
    boxShadow: '0 12px 36px rgba(31, 42, 51, 0.10)',
  },
  branchOption: {
    width: '100%',
    padding: '14px 18px',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${C.divider}`,
    color: C.textPrimary,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '12px',
  },
  branchOptionActive: { background: 'rgba(143, 168, 184, 0.08)' },
  dateBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '11px 16px',
    background: C.surface,
    border: `1px solid ${C.border}`,
  },
  liveBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '11px 16px',
    background: 'rgba(143, 168, 184, 0.10)',
    border: `1px solid ${C.silver}`,
  },
  livePulse: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: C.silver,
    boxShadow: `0 0 12px ${C.silver}`,
    transition: 'opacity 0.4s',
  },
  main: {
    padding: '28px 32px 60px',
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  glanceRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  glanceCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    padding: '22px 24px',
    minHeight: '136px',
  },
  glanceLabel: {
    fontSize: '10px',
    letterSpacing: '0.22em',
    color: C.textMuted,
    fontWeight: 600,
  },
  bigNumber: {
    fontSize: '30px',
    fontWeight: 400,
    color: C.textPrimary,
    letterSpacing: '-0.025em',
    fontFamily: '"DM Serif Display", "Cormorant Garamond", serif',
    lineHeight: 1.1,
  },
  flowGrid: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '16px',
    gap: '8px',
  },
  flowDivider: {
    width: '1px',
    height: '40px',
    background: C.divider,
  },
  midRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '16px',
  },
  botRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '16px',
  },
  bigCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    gap: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontFamily: '"DM Serif Display", "Cormorant Garamond", serif',
    fontWeight: 400,
    color: C.textPrimary,
    letterSpacing: '0.005em',
  },
  cardSub: {
    fontSize: '11.5px',
    color: C.textMuted,
    letterSpacing: '0.02em',
    marginTop: '4px',
    fontWeight: 500,
  },
  heatLegend: { display: 'flex', gap: '2px' },
  alertBadge: {
    fontSize: '11px',
    letterSpacing: '0.1em',
    padding: '5px 11px',
    background: C.claySoft,
    border: `1px solid ${C.clay}`,
    fontWeight: 600,
  },
  alertList: { display: 'flex', flexDirection: 'column' },
  heatmapContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  heatmapRow: {
    display: 'grid',
    gridTemplateColumns: '120px repeat(11, 1fr)',
    gap: '4px',
  },
  heatmapRoomCell: {
    padding: '6px 12px 6px 0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  heatmapHourCell: {
    fontSize: '10px',
    color: C.textMuted,
    letterSpacing: '0.12em',
    textAlign: 'center',
    padding: '4px 0',
    fontWeight: 600,
  },
  heatmapHourNow: {
    color: C.coral,
    fontWeight: 700,
  },
  heatmapCell: {
    height: '34px',
    transition: 'all 0.3s',
  },
  scheduleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '0 0 12px',
    borderBottom: `1px solid ${C.border}`,
    fontSize: '9.5px',
    letterSpacing: '0.18em',
    color: C.textMuted,
    fontWeight: 700,
  },
  scheduleList: {
    maxHeight: '500px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  footer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: `1px solid ${C.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

// Inject keyframes & web fonts
if (typeof document !== 'undefined' && !document.getElementById('biw-dashboard-styles')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(link);

  const styleSheet = document.createElement('style');
  styleSheet.id = 'biw-dashboard-styles';
  styleSheet.textContent = `
    @keyframes biwPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.82); }
    }
    *::-webkit-scrollbar { width: 6px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: ${C.silverSoft}; border-radius: 3px; }
    *::-webkit-scrollbar-thumb:hover { background: ${C.silver}; }
  `;
  document.head.appendChild(styleSheet);
}
