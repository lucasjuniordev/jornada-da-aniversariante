# A Jornada da Aniversariante

Jogo estilo RPG: a aventureira (Vitória) responde perguntas de sim/não e o escudeiro (Lucas) deduz o filme, o dia, a comida, o presente de aniversário e a comemoração que ela quer. Ela ganha XP, sobe de nível, desbloqueia conquistas e termina com uma carta selada. A cada missão concluída, as respostas chegam sozinhas ao escudeiro; o WhatsApp fica de reserva.

No ar em https://jornada.lucasjrdev.com · diário do escudeiro em https://jornada.lucasjrdev.com/escudeiro (pede a chave)

## Como funciona

- `public/index.html`: o jogo inteiro (motor de perguntas, interface, sons sintetizados, confete). O progresso fica salvo no navegador dela.
- `public/escudeiro.html`: página do Lucas, que lê as respostas com a chave secreta.
- `src/index.js`: Worker com `POST /api/respostas` (salva o que já foi descoberto, por jogada) e `GET /api/respostas` (lista) e `DELETE /api/respostas[?jogada=<id>]` (apaga uma jogada ou todas, para limpar os testes); os dois exigem `Authorization: Bearer <chave>`. O resto é servido direto dos assets.
- KV `RESPOSTAS` guarda as jogadas; a chave é o secret `ESCUDEIRO_CHAVE` (`npx wrangler secret put ESCUDEIRO_CHAVE`), nunca no repositório.

Som: `public/sons/fanfarra.mp3` ("Success Fanfare Trumpets", freesound_community no Pixabay), tocado só nas conquistas e no final.

## Rodar localmente

- `npx wrangler dev` com um `.dev.vars` (ignorado pelo Git) contendo `ESCUDEIRO_CHAVE=teste-local`. O KV é simulado localmente.
- No console da página, `selfTest()` deve retornar `ok` (simula respostas sinceras para cada opção e confere se o escudeiro acerta).
- `node teste100.js public/index.html` simula 100 jornadas com respostas imperfeitas e mostra a taxa de acerto por missão, mais 3 jornadas de exemplo.

## Deploy

Cloudflare Workers. O Workers Builds publica cada push na `main`; PRs ganham prévia.
