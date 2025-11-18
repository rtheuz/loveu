# Firebase Setup Instructions

## Aplicar Regras de Segurança do Firestore

As regras de segurança do Firestore foram criadas no arquivo `firestore.rules`. Para aplicá-las ao seu projeto Firebase, siga um dos métodos abaixo:

### Método 1: Firebase Console (Interface Web)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **loveu-6f63c**
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras** (Rules)
5. Copie o conteúdo do arquivo `firestore.rules` e cole no editor
6. Clique em **Publicar** (Publish)

### Método 2: Firebase CLI

Se você tem o Firebase CLI instalado:

```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Fazer login
firebase login

# Inicializar o projeto (apenas se ainda não foi inicializado)
firebase init firestore

# Aplicar as regras
firebase deploy --only firestore:rules
```

## O que as regras fazem?

As regras configuradas permitem:

- ✅ **Leitura pública** para as coleções `timeline`, `messages` e `photos`
- ✅ **Escrita autenticada** (apenas usuários autenticados, incluindo anônimos) para estas coleções
- ❌ **Bloqueio** de acesso a outras coleções não especificadas

## Autenticação Anônima

O projeto já está configurado para usar autenticação anônima do Firebase. Isso significa que:

- Os usuários são automaticamente autenticados anonimamente ao carregar a página
- Isso permite que eles adicionem mensagens e eventos na timeline
- A autenticação anônima é gerenciada automaticamente pelo código em `firebase-cloudinary-sync.js`

## Verificação

Após aplicar as regras:

1. Abra a aplicação no navegador
2. Tente adicionar uma mensagem ou evento na timeline
3. Verifique o console do navegador (F12) para confirmar que não há erros de permissão
4. Os erros `FirebaseError: Missing or insufficient permissions` devem desaparecer

## Suporte

Se você encontrar problemas:

- Verifique se a autenticação anônima está habilitada no Firebase Console (Authentication > Sign-in method > Anonymous)
- Confirme que as regras foram aplicadas corretamente
- Verifique o console do navegador para mensagens de erro detalhadas
