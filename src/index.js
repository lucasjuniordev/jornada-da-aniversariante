// API das respostas: a jornada envia o que a Vitória já descobriu; o Lucas lê na página /escudeiro com a chave secreta.
// Todo o resto (a página, imagens, vídeo) vem dos assets em ./public.
const MAX_BYTES = 8 * 1024;
const CAMPOS = ['filme', 'dia', 'comida', 'presente', 'festa'];

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/respostas') {
      if (req.method === 'POST') return salvar(req, env);
      if (req.method === 'GET') return listar(req, env);
      if (req.method === 'DELETE') return apagar(req, env);
      return json({ erro: 'método não permitido' }, 405);
    }
    return env.ASSETS.fetch(req);
  },
};

async function salvar(req, env) {
  const txt = await req.text();
  if (txt.length > MAX_BYTES) return json({ erro: 'grande demais' }, 413);
  let d;
  try { d = JSON.parse(txt); } catch { return json({ erro: 'json inválido' }, 400); }
  if (typeof d?.jogada !== 'string' || !/^[\w-]{8,64}$/.test(d.jogada) || typeof d.respostas !== 'object' || !d.respostas)
    return json({ erro: 'formato inválido' }, 400);

  // guarda só os campos conhecidos, como texto curto
  const respostas = {};
  for (const k of CAMPOS) {
    const r = d.respostas[k];
    if (!r || typeof r !== 'object') continue;
    respostas[k] = Object.fromEntries(['n', 'c', 'd', 'dica', 'sessao']
      .filter(c => typeof r[c] === 'string' && r[c]).map(c => [c, r[c].slice(0, 300)]));
  }
  const chave = `jogada:${d.jogada}`;
  const antes = await env.RESPOSTAS.get(chave, 'json');
  const agora = new Date().toISOString();
  await env.RESPOSTAS.put(chave, JSON.stringify({
    jogada: d.jogada, inicio: antes?.inicio ?? agora, atualizado: agora,
    nivel: Number(d.nivel) || 0, xp: Number(d.xp) || 0, completa: d.completa === true, respostas,
  }));
  return json({ ok: true });
}

async function autorizado(req, env) {
  const chave = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return !!env.ESCUDEIRO_CHAVE && iguais(chave, env.ESCUDEIRO_CHAVE);
}

async function listar(req, env) {
  if (!(await autorizado(req, env))) return json({ erro: 'chave errada' }, 401);
  const { keys } = await env.RESPOSTAS.list({ prefix: 'jogada:' });
  const itens = (await Promise.all(keys.map(k => env.RESPOSTAS.get(k.name, 'json')))).filter(Boolean);
  return json(itens.sort((a, b) => b.atualizado.localeCompare(a.atualizado)));
}

// DELETE /api/respostas?jogada=<id> apaga uma jogada; sem ?jogada apaga todas (para limpar os testes)
async function apagar(req, env) {
  if (!(await autorizado(req, env))) return json({ erro: 'chave errada' }, 401);
  const jogada = new URL(req.url).searchParams.get('jogada');
  if (jogada) {
    if (!/^[\w-]{8,64}$/.test(jogada)) return json({ erro: 'jogada inválida' }, 400);
    await env.RESPOSTAS.delete(`jogada:${jogada}`);
    return json({ ok: true, apagadas: 1 });
  }
  const { keys } = await env.RESPOSTAS.list({ prefix: 'jogada:' });
  await Promise.all(keys.map(k => env.RESPOSTAS.delete(k.name)));
  return json({ ok: true, apagadas: keys.length });
}

// comparação em tempo constante (via hash) para não vazar a chave por tempo de resposta
async function iguais(a, b) {
  const h = s => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  const [x, y] = await Promise.all([h(a), h(b)]);
  return crypto.subtle.timingSafeEqual(x, y);
}

const json = (d, status = 200) => new Response(JSON.stringify(d), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
