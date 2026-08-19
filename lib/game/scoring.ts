export function calculateBCGScore(state: any) {
  const people = (state.alloc?.people || 0) / 100;
  return people >= 0.7 ? 5 : people >= 0.6 ? 3 : 0;
}
export function bcgProfile(state: any) {
  const people = state.alloc?.people || 0; const tech = (state.alloc?.infra || 0) + (state.alloc?.data || 0) + (state.alloc?.mlops || 0); const process = (state.alloc?.compliance || 0) + (state.alloc?.innovation || 0);
  return { people, tech, process, score: calculateBCGScore(state) };
}
