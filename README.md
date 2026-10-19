# Torre de Prontera

Aplicativo React + Vite para acompanhar a disponibilidade da Torre por personagem de Ragnarok.

## Como funciona

- Cadastre personagens com nome e ícone de classe do jogo. O seletor mantém transclasses e evoluções, removendo classes iniciais e segundas classes não-transcendentes.
- Use **Fiz minha torre hoje** para registrar a torre e iniciar a recarga de três dias.
- A disponibilidade retorna às 04:00, considerando o reset diário do jogo. Registros feitos antes das 04:00 contam para o ciclo anterior.
- O countdown atualiza em tempo real. Personagens, registros e preferência de tema ficam salvos no armazenamento local do navegador.
- Os ícones de grupo (25×25) ficam em `src/assets/jobs` e são empacotados com o app, sem depender de conexão com a Wiki durante o uso. A fonte é a [categoria Imagens de Classes do bROWiki](https://browiki.org/wiki/Categoria:Imagens_de_Classes). Se uma imagem não estiver disponível, aparece a inicial do personagem.

## Desenvolvimento

```sh
npm install
npm run dev
```

## Supabase

- O `.env` deve definir `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. O Vite injeta apenas esses dois valores públicos no app; `SUPABASE_SECRET_KEY` nunca é usado no navegador.
- No Supabase, execute `supabase/migrations/20261019000000_create_tower_characters.sql` pelo SQL Editor para criar a tabela e as políticas RLS.
- Ative o provedor Email em **Authentication > Providers**. Se a confirmação de e-mail estiver ativa, confirme o link antes de entrar.
- A tabela `tower_characters` restringe leitura e escrita ao usuário autenticado. Senhas são geridas pelo Supabase Auth e não são armazenadas na tabela.
- Se houver personagens no armazenamento local deste navegador e a conta ainda estiver sem personagens, o app oferece importá-los após o login.

## Verificações

```sh
npm test
npm run lint
npm run build
```
