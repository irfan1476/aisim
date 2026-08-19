import { NextResponse } from 'next/server';
import OpenAI from 'openai';
export async function POST(request:Request){
  const {gameState,userQuestion,persona}=await request.json();
  const fallback=`As ${persona||'your advisor'}, I see ROI at ${gameState?.roi??0}% and adoption at ${gameState?.adoption??0}%. Tie the next decision to a measurable operating outcome, and protect the capability around the model. What trade-off are you most prepared to defend?`;
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({response:fallback,suggestedActions:['Review people allocation','Check risk exposure']});
  try{const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const result=await client.chat.completions.create({model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:Number(process.env.OPENAI_TEMPERATURE||.7),max_tokens:Number(process.env.OPENAI_MAX_TOKENS||500),messages:[{role:'system',content:`You are the ${persona} board advisor in an executive AI investment simulation. Be concise, actionable, and reference these metrics: ${JSON.stringify(gameState)}.`},{role:'user',content:userQuestion||'Give me a strategic read on this quarter.'}]});return NextResponse.json({response:result.choices[0]?.message?.content||fallback,suggestedActions:[]});}catch{return NextResponse.json({response:fallback,suggestedActions:[]});}
}
