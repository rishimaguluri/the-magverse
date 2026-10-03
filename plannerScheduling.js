// plannerScheduling.js
// Deterministic calendar math — the piece that genuinely did not exist anywhere in this app
// before (the only prior art was a pairwise overlap checker for voice-added events). AI never
// does this arithmetic; it only proposes items/sessions/durations (Part 56). Loaded after
// plannerEngine.js, before plannerValidation.js.

// Does a calendar event (data.events[] shape) occur on a given 'YYYY-MM-DD' date? Handles
// exactDate (absolute, highest priority), then recurrence-based day-of-week matching —
// extends the narrower day-matching already used ad hoc in DailyInsightsSubtab to also cover
// exactDate and the 'custom'+customDays combination documented in EventModal.
function eventOccursOnDate(ev, dateStr){
  if(!ev || ev.when?.hour === undefined) return false;
  if(ev.when.exactDate) return ev.when.exactDate === dateStr;
  const dow = (new Date(dateStr + 'T12:00:00').getDay() + 6) % 7; // Monday=0 .. Sunday=6
  const r = ev.recurrence, d = ev.when.day;
  if(!r || r === 'weekly') return d === dow;
  if(r === 'daily') return true;
  if(r === 'weekdays') return dow >= 0 && dow <= 4;
  if(r === 'mwf') return [0, 2, 4].includes(dow);
  if(r === 'custom') return Array.isArray(ev.customDays) && ev.customDays.includes(dow);
  return false;
}

function hourToISO(dateStr, hourDecimal){
  const h = Math.floor(hourDecimal), m = Math.round((hourDecimal - h) * 60);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// Returns free {start,end} windows (decimal hours) within [fromHour,toHour) on dateStr, after
// subtracting every calendar event that occurs that day (merged if they overlap each other).
function computeAvailableWindows(events, dateStr, fromHour, toHour){
  const busy = (events || [])
    .filter(ev => eventOccursOnDate(ev, dateStr))
    .map(ev => ({
      start: Math.max(fromHour, ev.when.hour || 0),
      end: Math.min(toHour, ev.when.endHour != null ? ev.when.endHour : (ev.when.hour || 0) + 1),
    }))
    .filter(b => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const merged = [];
  busy.forEach(b => {
    const last = merged[merged.length - 1];
    if(last && b.start <= last.end) last.end = Math.max(last.end, b.end);
    else merged.push({ ...b });
  });

  const windows = [];
  let cursor = fromHour;
  merged.forEach(b => {
    if(b.start > cursor) windows.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  });
  if(cursor < toHour) windows.push({ start: cursor, end: toHour });
  return windows.filter(w => w.end - w.start > 0.05);
}

function windowsTotalMinutes(windows){
  return Math.round((windows || []).reduce((s, w) => s + (w.end - w.start), 0) * 60);
}

function computeWorkload(sessions){
  return (sessions || [])
    .filter(ws => ws.status === 'planned' || ws.status === 'active' || ws.status === 'paused')
    .reduce((s, ws) => s + (ws.plannedMinutes || 0), 0);
}

function detectOvercommitment(availableMinutes, plannedMinutes){
  return { overcommitted: plannedMinutes > availableMinutes, deltaMinutes: plannedMinutes - availableMinutes };
}

// Greedily places sessions (already ordered by the caller — e.g. NOW-bucket priority order)
// into the given free windows, respecting a small buffer between sessions. Sessions that don't
// fit anywhere are returned unplaced (left sequenced-but-not-timed, per Part 74) rather than
// forced in — the product should allow empty space, not fill every minute (Part 91).
function scheduleSessionsIntoWindows(sessions, windows, dateStr, bufferMinutes){
  const buf = (bufferMinutes || 10) / 60;
  const win = (windows || []).map(w => ({ ...w }));
  const placed = [];
  const unplaced = [];
  let wi = 0;

  (sessions || []).forEach(session => {
    const neededHours = (session.plannedMinutes || 30) / 60;
    while(wi < win.length && (win[wi].end - win[wi].start) < neededHours) wi++;
    if(wi >= win.length){ unplaced.push(session); return; }
    const startH = win[wi].start;
    const endH = startH + neededHours;
    placed.push({ ...session, scheduledStart: hourToISO(dateStr, startH), scheduledEnd: hourToISO(dateStr, endH) });
    win[wi].start = endH + buf;
    if(win[wi].start >= win[wi].end) wi++;
  });

  return { placed, unplaced };
}
