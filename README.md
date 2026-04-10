
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
## Demonstração

Aplicação disponível em produção:

- 🌐 https://jogos-unisanta.vercel.app

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

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/DevGuivieiraa">
        <img src="https://github.com/DevGuivieiraa.png" width="80" height="80" style="border-radius:50%;" /><br>
        <sub><b>Guilherme Vieira</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Bruder1z">
        <img src="https://github.com/Bruder1z.png" width="80" height="80" style="border-radius:50%;" /><br>
        <sub><b>Lucas Bruder</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/MatheusCardoso013">
        <img src="https://github.com/MatheusCardoso013.png" width="80" height="80" style="border-radius:50%;" /><br>
        <sub><b>Matheus Cardoso</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/PatrickBucanero">
        <img src="https://github.com/PatrickBucanero.png" width="80" height="80" style="border-radius:50%;" /><br>
        <sub><b>Patrick Santos</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/figuedro">
        <img src="https://github.com/figuedro.png" width="80" height="80" style="border-radius:50%;" /><br>
        <sub><b>João Pedro Unger</b></sub>
      </a>
    </td>
  </tr>
</table>

## Status

Projeto acadêmico em desenvolvimento. Novas funcionalidades estão sendo adicionadas.

