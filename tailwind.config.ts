import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink:'#0A1628', gold:'#D4AF37', mist:'#F6F8FB', emerald:'#059669', crimson:'#DC2626' }, fontFamily:{sans:['var(--font-inter)','Arial'], body:['var(--font-plex)','Arial']} } }, plugins:[] };
export default config;
