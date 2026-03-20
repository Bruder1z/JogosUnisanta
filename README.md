
# Jogos Unisanta

Plataforma web para gerenciamento, acompanhamento e interação com os Jogos da Unisanta, maior evento esportivo universitário do Estado de São Paulo.


## Sobre o Projeto

O Jogos Unisanta é um sistema desenvolvido para centralizar informações e funcionalidades relacionadas ao evento esportivo universitário.

A aplicação permite acompanhar partidas, visualizar rankings, participar de bolões e gerenciar dados por meio de um painel administrativo.
## Funcionalidades

#### Público Geral
- Calendário de jogos
- Visualização de partidas e resultados
- Portal de notícias e atualizações
- Rankings de atletas, cursos e instituições
- Simulador de palpites (bolão)

#### Área Administrativa
- Cadastro e gerenciamento de jogos
- Gestão de equipes e atletas
- Atualização de resultados em tempo real
- Controle geral dos dados do sistema


## Tecnologias Utilizadas

- React 19 + TypeScript
- Vite (build e HMR)
- Supabase (backend e autenticação)
- React Router DOM (navegação SPA)
- Lucide React (ícones)



## Estrutura de Pastas 
```plaintext
src/
├── assets/        # Arquivos estáticos
├── components/    # Componentes reutilizáveis (Admin, Match, Modals, Layout, etc.)
├── context/       # Context API (estado global)
├── pages/         # Páginas da aplicação
├── services/      # Integrações e APIs
```
## Instalação e Uso

#### Pré-requisitos
- Node.js 18 ou superior
- npm ou yarn

#### Clone o repositório
```plaintext
git clone <url-do-repo>
cd JogosUnisanta
```

#### Instale as dependências
```plaintext
npm install
```

#### Configure o ambiente
Crie um arquivo .env na raiz do projeto:
```plaintext
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

#### Executar em desenvolvimento
```plaintext
npm run dev
```
## Casos de Uso

- Eventos universitários
- Campeonatos esportivos
- Ligas amadoras
- Plataformas de bolão
- Portais esportivos

## Colaboradores

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

![Logo](https://www.serventuarios.org.br/wp-content/uploads/2022/03/unisanta.jpg)

