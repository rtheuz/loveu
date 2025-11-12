# loveu realtime prototype (Socket.IO)

Este servidor é um protótipo mínimo para testar sincronização em tempo real entre navegadores (salas, video sync, chat, eventos de jogo).

## Requisitos
- Node.js 16+ (ou compatível)
- npm

## Instalação e execução
1. Abra um terminal na pasta `server/`
2. Instale dependências:
   ```
   npm install
   ```
3. Inicie o servidor:
   ```
   npm start
   ```
   O servidor escutará por padrão em `http://localhost:3000`.

## Testando localmente
1. Inicie o servidor (`npm start`) em uma máquina acessível.
2. Abra a página `index.html` modificada (a qual inclui o client Socket.IO) em duas janelas/guests.
   - Recomendo servir os arquivos estáticos via `npx serve` ou `python -m http.server` para evitar problemas de CORS/iframe:
     ```
     npx serve .
     # ou
     python -m http.server 8080
     ```
3. Em ambas as janelas:
   - Digite o mesmo código de sala (p.ex.: `sala1`) e um nome, clique em `Entrar`.
   - Carregue um MP4 ou cole um link do YouTube na seção 'Shared Player'.
   - O host (primeiro a entrar) controla o tempo: play/pause/seek emitirão eventos para os outros.
   - Para testes de jogo, use os botões de game-move (ou o Jogo da Velha/TicTacToe se estiver disponível).
   - Teste chat: enviar mensagens deve aparecer para todos na sala.

## Observações
- Este é apenas um protótipo: não há autenticação, persistência, segurança ou escala.
- Para ambientes de produção, adicione autenticação, validação de salas, limites por IP, TLS e políticas CORS adequadas.