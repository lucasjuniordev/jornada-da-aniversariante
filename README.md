# A Jornada da Aniversariante

Jogo estilo RPG, de uma página só: a aventureira responde perguntas de sim/não e o "escudeiro" deduz o filme, o dia, a comida, o presente de aniversário e a comemoração que ela quer. Ganha XP, sobe de nível, desbloqueia conquistas e no final manda o inventário pelo WhatsApp.

No ar em https://jornada.lucasjrdev.com

## Rodar localmente

Abra `public/index.html` no navegador. No console, `selfTest()` deve retornar `ok` (simula respostas sinceras para cada opção e confere se o escudeiro acerta).

## Deploy

Cloudflare Workers (assets estáticos em `public/`). O Workers Builds publica cada push na `main`; PRs ganham prévia.
