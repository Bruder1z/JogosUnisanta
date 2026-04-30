# Jogos Unisanta — Backend

Backend Node.js com Express + RabbitMQ para o projeto Jogos Unisanta.

## Arquitetura

```
Frontend (React) → API REST (Express) → RabbitMQ → Workers → Supabase
                                      ↘ Leituras síncronas → Supabase
```

**Leituras** (GET) são síncronas: API consulta o Supabase diretamente e retorna.  
**Escritas** (POST/PUT/DELETE) são assíncronas: API publica na fila do RabbitMQ e retorna `202 Accepted`. Workers consomem as filas e executam no Supabase.

Exceções onde a escrita é síncrona (precisam retornar dados imediatamente):
- `POST /auth/login` — precisa retornar o JWT
- `POST /auth/confirm-email` — precisa retornar o JWT
- `POST /torcida/posts` — precisa retornar o ID do post criado
- `POST /torcida/posts/:id/comments` — precisa retornar o comentário criado
- `POST /mvp/vote` — verifica duplicata antes de inserir

## Pré-requisitos

- Node.js 18+
- Docker (para o RabbitMQ)

## Setup

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key   # NÃO a anon key!
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=uma-chave-secreta-longa-e-aleatoria
PORT=3001
FRONTEND_URL=http://localhost:5173
```

> ⚠️ Use a **Service Role Key** do Supabase (não a anon key). Ela bypassa o RLS e é segura apenas no backend.

### 3. Subir o RabbitMQ

```bash
docker-compose up -d
```

Acesse o painel de gerenciamento em: http://localhost:15672  
Login: `guest` / `guest`

### 4. Iniciar o servidor

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

O servidor sobe em `http://localhost:3001` com os workers embutidos.

### Rodar workers separadamente (opcional)

```bash
# Terminal 1 — API
npm start

# Terminal 2 — Workers
npm run worker
```

## Endpoints

### Auth
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | — | Login com email/senha |
| POST | `/auth/register` | — | Cadastro de novo usuário |
| POST | `/auth/confirm-email` | — | Confirmar email com código |
| POST | `/auth/resend-confirmation` | — | Reenviar código de confirmação |
| PUT | `/auth/profile` | ✅ | Atualizar perfil |
| GET | `/auth/me` | ✅ | Dados do usuário autenticado |

### Partidas
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/matches` | — | Listar todas as partidas |
| GET | `/matches/:id` | — | Buscar partida por ID |
| POST | `/matches` | Admin | Criar partida |
| PUT | `/matches/:id` | Admin | Atualizar partida |
| DELETE | `/matches/:id` | Admin | Deletar partida |
| DELETE | `/matches/scheduled` | Admin | Deletar todas as partidas agendadas |

### Cursos
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/courses` | — | Listar cursos |
| POST | `/courses` | Admin | Criar curso |
| DELETE | `/courses` | Admin | Remover curso |

### Atletas
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/athletes` | — | Listar atletas |
| POST | `/athletes` | Admin | Criar atleta |
| DELETE | `/athletes/:id` | Admin | Remover atleta |

### Ranking
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/ranking` | — | Listar ranking |
| PUT | `/ranking/:course` | Admin | Atualizar pontos |
| POST | `/ranking/reset` | Admin | Zerar ranking |
| POST | `/ranking/restore` | Admin | Restaurar ranking oficial |

### Previsões (Bolão)
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/predictions` | ✅ | Buscar previsões do usuário |
| POST | `/predictions` | ✅ | Salvar previsões |

### Atletas em Destaque
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/featured-athletes` | — | Listar atletas em destaque |
| POST | `/featured-athletes` | Admin | Criar atleta em destaque |
| DELETE | `/featured-athletes/:id` | Admin | Remover atleta em destaque |

### MVP
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/mvp/candidates` | — | Listar candidatos MVP |
| GET | `/mvp/candidates/:matchId` | — | Candidatos de uma partida |
| POST | `/mvp/candidates/ensure` | ✅ | Sincronizar candidatos |
| GET | `/mvp/votes` | — | Listar votos |
| POST | `/mvp/vote` | ✅ | Votar em candidato |

### Torcida
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/torcida/posts` | — | Listar posts |
| POST | `/torcida/posts` | ✅ | Criar post (suporta imagem) |
| DELETE | `/torcida/posts/:id` | ✅ | Deletar post |
| GET | `/torcida/posts/:postId/comments` | — | Listar comentários |
| POST | `/torcida/posts/:postId/comments` | ✅ | Criar comentário |
| DELETE | `/torcida/comments/:id` | ✅ | Deletar comentário |
| GET | `/torcida/likes` | ✅ | Likes do usuário |
| POST | `/torcida/posts/:postId/like` | ✅ | Curtir/descurtir post |
| GET | `/torcida/notifications` | ✅ | Notificações do usuário |

### Admin
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/admin/users` | SuperAdmin | Listar admins |
| POST | `/admin/promote` | SuperAdmin | Promover usuário a admin |
| POST | `/admin/demote/:id` | SuperAdmin | Rebaixar admin |

## Autenticação

O backend usa JWT. Após login ou confirmação de email, o token é retornado:

```json
{
  "status": "ok",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Envie o token no header de todas as rotas protegidas:

```
Authorization: Bearer <token>
```

## Filas RabbitMQ

Todas as filas são **duráveis** (sobrevivem a restart do RabbitMQ).

| Fila | Worker | Descrição |
|------|--------|-----------|
| `user.register` | authWorker | Envio de email de confirmação |
| `user.update` | authWorker | Atualização de perfil |
| `user.confirm_email` | authWorker | Confirmação de email |
| `user.resend_confirmation` | authWorker | Reenvio de confirmação |
| `user.promote` | authWorker | Promoção a admin |
| `user.demote` | authWorker | Rebaixamento de admin |
| `predictions.save` | predictionsWorker | Salvar previsões |
| `match.create` | matchWorker | Criar partida |
| `match.update` | matchWorker | Atualizar partida |
| `match.delete` | matchWorker | Deletar partida |
| `match.delete_scheduled` | matchWorker | Deletar partidas agendadas |
| `course.create` | courseWorker | Criar curso |
| `course.delete` | courseWorker | Deletar curso |
| `athlete.create` | athleteWorker | Criar atleta |
| `athlete.delete` | athleteWorker | Deletar atleta |
| `ranking.update` | courseWorker | Atualizar pontos |
| `ranking.reset` | courseWorker | Zerar ranking |
| `ranking.restore` | courseWorker | Restaurar ranking |
| `featured_athlete.create` | athleteWorker | Criar atleta em destaque |
| `featured_athlete.delete` | athleteWorker | Deletar atleta em destaque |
| `mvp.candidates.ensure` | mvpWorker | Sincronizar candidatos MVP |
| `mvp.vote` | mvpWorker | Atualizar contagem de votos |
| `torcida.post.delete` | torcidaWorker | Deletar post |
| `torcida.comment.delete` | torcidaWorker | Deletar comentário |
| `torcida.like.toggle` | torcidaWorker | Curtir/descurtir |
| `torcida.notification.insert` | torcidaWorker | Inserir notificação |
