# Servidor de Sincronização em Tempo Real - LoveU

Este servidor permite a sincronização em tempo real de vídeos, jogos e mensagens entre múltiplos usuários.

## Requisitos

- Node.js (versão 14 ou superior)
- npm (geralmente vem com Node.js)

## Instalação

1. Navegue até o diretório do servidor:
```bash
cd server
```

2. Instale as dependências:
```bash
npm install
```

## Execução

Para iniciar o servidor:

```bash
npm start
```

O servidor irá iniciar na porta 3000 por padrão. Você verá a mensagem:
```
Server is running on port 3000
Socket.IO server ready to accept connections
```

## Como usar

### 1. Iniciar o servidor
Execute `npm start` no diretório `server/`

### 2. Abrir o site
Abra o arquivo `index.html` (na raiz do projeto) em um navegador. Você pode:
- Abrir diretamente o arquivo HTML
- Usar um servidor HTTP local (como `python -m http.server 8080` na raiz do projeto)

### 3. Criar ou entrar em uma sala

**Primeira pessoa (Host):**
1. No painel de controle do site, clique em "Criar Sala"
2. Um código de sala será gerado automaticamente (ex: "SALA-12345")
3. Compartilhe este código com outras pessoas

**Outras pessoas:**
1. Digite o código da sala no campo de entrada
2. Clique em "Entrar na Sala"
3. Você verá a lista de participantes atualizada

### 4. Testar a sincronização

**Sincronização de Vídeo:**
- Escolha entre player HTML5 (MP4) ou YouTube
- O host controla o vídeo (play, pause, seek)
- Todos os participantes veem o vídeo sincronizado
- Correção automática de drift a cada 5 segundos (>0.6s de diferença)

**Eventos de Jogo:**
- Clique nas cartas do jogo de memória
- Os movimentos são sincronizados entre todos os participantes

**Chat/Mensagens:**
- Digite mensagens no campo de chat
- Mensagens são enviadas para todos na sala

### 5. Teste com múltiplas janelas

Para testar localmente:
1. Abra o servidor (`npm start` em `server/`)
2. Abra duas ou mais janelas/abas do navegador
3. Em cada janela, abra o `index.html`
4. Na primeira janela, crie uma sala e copie o código
5. Nas outras janelas, entre na mesma sala usando o código
6. Teste play/pause/seek e veja a sincronização acontecer!

## Configuração

### Porta do servidor
Por padrão, o servidor roda na porta 3000. Para mudar:
```bash
PORT=4000 npm start
```

### Conectar de outro dispositivo na rede local
1. Descubra o IP local do computador rodando o servidor (ex: 192.168.1.100)
2. No arquivo `index.html`, atualize a URL de conexão do Socket.IO:
   ```javascript
   const socket = io('http://192.168.1.100:3000');
   ```
3. Outros dispositivos na mesma rede podem acessar usando este IP

## Eventos suportados

O servidor repassa os seguintes eventos entre clientes:

- `video-control`: play, pause, seek, time update
- `heartbeat`: sincronização de tempo do host
- `game-move`: movimentos no jogo
- `chat-message`: mensagens de chat
- `presence`: eventos de presença (join/leave)

## Troubleshooting

**Erro de conexão:**
- Verifique se o servidor está rodando
- Verifique a URL de conexão no `index.html`
- Verifique o firewall (porta 3000 deve estar aberta)

**Vídeos não sincronizam:**
- Verifique se ambos estão na mesma sala
- Verifique o console do navegador para erros
- O host deve iniciar a reprodução primeiro

**YouTube não carrega:**
- Verifique a conexão com internet
- Alguns vídeos têm restrições de incorporação
- Tente com outro vídeo ou use o player HTML5

## Próximos Passos

Este é um protótipo mínimo. Melhorias futuras podem incluir:
- Autenticação de usuários
- Persistência de salas
- Suporte a mais tipos de mídia
- Interface de chat mais elaborada
- Melhor tratamento de erros
- Deploy em produção (Heroku, Railway, etc.)
