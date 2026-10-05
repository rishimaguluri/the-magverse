// PlannerProjectCluster.jsx
// Groups Later-lane work items so the user never sees a flat wall of rows — either an explicit
// Project (several items sharing one outcome, created via the GROUP_TASKS/CREATE_PROJECT
// operations) or an inferred category (School/Consulting/Recruiting/Magverse/Personal/Admin,
// via plannerEngine.js's inferGroupLabel). Collapsed by default; expand to see members.

const PPC_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b' };

function PlannerProjectCluster({ title, workItems, today, defaultOpen = false, onCardProps }){
  const [open, setOpen] = useState(defaultOpen);
  const doneCount = workItems.filter(wi => wi.status === 'done').length;

  return (
    <div className="mb-2">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 10, color: PPC_T.faint, transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▸</span>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: PPC_T.mid, fontWeight: 600 }}>{title}</span>
          {doneCount > 0 && <span style={{ fontSize: 11, color: PPC_T.faint }}>{doneCount}/{workItems.length} steps</span>}
        </div>
        <span style={{ fontSize: 11, color: PPC_T.faint }}>{workItems.length}</span>
      </button>
      {open && (
        <div className="space-y-1.5 mt-2 pl-1">
          {workItems.map(wi => (
            <PlannerTaskCard key={wi.id} workItem={wi} today={today} variant="compact" {...(onCardProps ? onCardProps(wi) : {})} />
          ))}
        </div>
      )}
    </div>
  );
}
