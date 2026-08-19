import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = body?.current ?? {};
    const alternative = body?.alternative ?? {};
    const peopleDelta = Number(alternative?.people ?? 15) - Number(current?.people ?? 15);
    const complianceDelta = Number(alternative?.compliance ?? 10) - Number(current?.compliance ?? 10);
    return NextResponse.json({
      differences: [
        { metric: 'Adoption', delta: Math.round(peopleDelta * 0.8), explanation: 'People investment changes enablement capacity.' },
        { metric: 'Risk exposure', delta: Math.round(-(complianceDelta * 0.65)), explanation: 'Compliance investment changes the risk buffer.' },
        { metric: 'ROI', delta: Math.round((peopleDelta > 0 ? peopleDelta * 0.18 : peopleDelta * 0.08) * 10) / 10, explanation: 'Adoption and governance influence value realization.' },
      ],
      recommendation: peopleDelta > 0 && complianceDelta >= 0 ? 'The alternative is more resilient: it protects adoption while keeping governance funded.' : 'The current allocation is more balanced for the next quarter; test the alternative after data readiness improves.',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid what-if request.' }, { status: 400 });
  }
}
