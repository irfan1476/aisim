export function calculateBCGScore(state: any) {
  const people = Math.min(100, (state.alloc?.people || 0) * 2 + ((state.alloc?.people || 0) > 20 ? 10 : 0) + ((state.adoption || 0) > 60 ? 10 : 0));
  const process = (state.selected || []).some((id: string) => ['energy', 'supply', 'maintenance'].includes(id)) ? 70 : 30;
  const tech = Math.min(100, (((state.alloc?.infra || 0) + (state.alloc?.data || 0)) / 80) * 100 + ((state.data || 0) > 70 ? 10 : 0));
  const model = Math.min(100, Number(state.roi || 0) / 2);
  const alignment = people * .4 + process * .3 + tech * .2 + model * .1;
  return alignment > 80 ? 5 : alignment > 60 ? 3 : alignment > 40 ? 1 : 0;
}
export function bcgProfile(state: any) {
  const people = state.alloc?.people || 0; const tech = (state.alloc?.infra || 0) + (state.alloc?.data || 0) + (state.alloc?.mlops || 0); const process = (state.alloc?.compliance || 0) + (state.alloc?.innovation || 0);
  return { people, tech, process, score: calculateBCGScore(state) };
}
