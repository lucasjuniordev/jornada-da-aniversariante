// 100 jornadas simuladas com respostas imperfeitas. Uso: node teste100.js <index.html>
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const engine = html.split('<script>')[1].split('// ---- interface ----')[0];
const ctx = {};
new Function('ctx', 'console', engine + '; ctx.MODS=MODS; ctx.newState=newState; ctx.nextQ=nextQ; ctx.answer=answer; ctx.ranked=ranked; ctx.shouldGuess=shouldGuess; ctx.reject=reject; ctx.MAX_WRONG=MAX_WRONG; ctx.selfTest=selfTest;')(ctx, console);
const { MODS, newState, nextQ, answer, ranked, shouldGuess, reject, MAX_WRONG } = ctx;

let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// Resposta de uma pessoa real: quase sempre certa, às vezes em dúvida, raramente erra.
function resp(has) {
  const r = rnd();
  const v = r < .70 ? 1 : r < .88 ? .75 : r < .96 ? .5 : 0; // 4% erra feio
  return has ? v : 1 - v;
}
const LABEL = { 1:'Sim', .75:'Provavelmente', .5:'Não sei', .25:'Acho que não', 0:'Não' };

const stats = {}; const amostras = [];
for (let j = 0; j < 100; j++) {
  const result = {}; const log = [];
  for (const m of MODS) {
    const st = newState(m);
    if (m.key === 'dia') m.cands.forEach((c, i) => { if (result.filme?.s?.[c.dt] === '') st.w[i] = 0; });
    const vivos = m.cands.map((c, i) => i).filter(i => st.w[i] > 0);
    const ti = vivos[Math.floor(rnd() * vivos.length)], target = m.cands[ti];
    let found = false, lista = false;
    for (let g = 0; g < 80 && !found; g++) {
      if (st.wrong >= MAX_WRONG || !ranked(m, st).length) { lista = true; break; }
      if (shouldGuess(m, st)) { const gi = ranked(m, st)[0].i; log.push(`  palpite: ${m.cands[gi].n} → ${gi === ti ? 'ACERTOU' : 'não'}`); if (gi === ti) found = true; else reject(st, gi); }
      else { const q = nextQ(m, st), a = resp(target.tags.has(m.qs[q][1])); log.push(`  ${m.qs[q][0]} → ${LABEL[a]}`); answer(m, st, q, a); }
    }
    result[m.key] = target;
    const s = stats[m.key] ??= { ok:0, lista:0, perg:0, erros:0, primeira:0 };
    if (found) s.ok++; else s.lista++;
    if (found && st.wrong === 0) s.primeira++;
    s.perg += st.n; s.erros += st.wrong;
    log.unshift(`[${m.label}] alvo: ${target.n}`);
    // sanidade: dia escolhido precisa ter sessão possível do filme
    if (m.key === 'dia' && result.filme.s?.[target.dt] === '') throw new Error('dia sem sessão foi oferecido');
  }
  if (j < 3) amostras.push(log.join('\n'));
}
console.log('selfTest (respostas perfeitas):', ctx.selfTest());
console.log('\nmissão       acertou  1º palpite  caiu na lista  média perguntas  média palpites errados');
for (const [k, s] of Object.entries(stats))
  console.log(`${k.padEnd(12)} ${String(s.ok).padStart(5)}% ${String(s.primeira).padStart(9)}% ${String(s.lista).padStart(11)}% ${(s.perg / 100).toFixed(1).padStart(14)} ${(s.erros / 100).toFixed(2).padStart(20)}`);
console.log('\n=== 3 jornadas de exemplo ===\n' + amostras.join('\n\n'));
