import type { Project } from "./project-types";

/**
 * Candidate projects (data-model.md seed). All are DRAFTS: descriptions come from the public
 * repositories (README / manifests read on 2026-10-10) and still need the owner's fact-check,
 * contribution details and approval. Images are original concept art from the design package,
 * not screenshots of the real projects — alt texts say so.
 */
export const projects: readonly Project[] = [
  {
    slug: "dr-manaus",
    title: "Dr-Manaus",
    status: "draft",
    categories: ["3d", "web"],
    summary: {
      pt: "Universo procedural e exploração espacial no navegador, com renderização 3D em Three.js.",
      en: "A procedural universe and space exploration in the browser, rendered in 3D with Three.js.",
      es: "Universo procedural y exploración espacial en el navegador, con renderizado 3D en Three.js.",
    },
    tech: ["TypeScript", "Three.js", "glTF Transform", "Vite"],
    image: {
      src: "/art/hero/orb-dark.svg",
      width: 820,
      height: 760,
      fit: "contain",
      alt: {
        pt: "Arte conceitual de um planeta procedural com órbitas (ilustração, não captura do projeto).",
        en: "Concept art of a procedural planet with orbits (illustration, not a project screenshot).",
        es: "Arte conceptual de un planeta procedural con órbitas (ilustración, no captura del proyecto).",
      },
    },
    repository: { href: "https://github.com/PauloSoaf/Dr-Manaus", verifiedAt: "2026-10-10" },
    notes: "Stack conferida em package.json (three, @gltf-transform). Confirmar escopo e contribuição.",
  },
  {
    slug: "chess-in-react",
    title: "ChessInReact",
    status: "draft",
    categories: ["games", "3d", "web"],
    summary: {
      pt: "Jogo de xadrez em React com lógica de partida interativa e elementos 3D via React Three Fiber.",
      en: "A chess game built in React, with interactive game logic and 3D elements via React Three Fiber.",
      es: "Juego de ajedrez en React con lógica de partida interactiva y elementos 3D mediante React Three Fiber.",
    },
    tech: ["React", "TypeScript", "React Three Fiber", "Three.js", "Ant Design"],
    image: {
      src: "/art/projects/chess.svg",
      width: 700,
      height: 480,
      alt: {
        pt: "Ilustração conceitual de um tabuleiro de xadrez (arte do portfólio, não captura do jogo).",
        en: "Concept illustration of a chessboard (portfolio artwork, not a game screenshot).",
        es: "Ilustración conceptual de un tablero de ajedrez (arte del portafolio, no captura del juego).",
      },
    },
    repository: { href: "https://github.com/PauloSoaf/ChessInReact", verifiedAt: "2026-10-10" },
    notes: "Descrição do repo: 'Chess game in React Js'. Dependências: @react-three/fiber, drei, antd.",
  },
  {
    slug: "iot-devices-manager",
    title: "IoT Devices Manager",
    status: "draft",
    categories: ["fullstack"],
    summary: {
      pt: "Gestão de dispositivos IoT com visualização de dados em tempo real: API Django REST, WebSockets e front-end Angular.",
      en: "IoT device management with real-time data visualization: Django REST API, WebSockets and an Angular front end.",
      es: "Gestión de dispositivos IoT con visualización de datos en tiempo real: API Django REST, WebSockets y front-end Angular.",
    },
    tech: ["Angular", "Django REST Framework", "Django Channels", "PostgreSQL", "Redis", "Docker"],
    image: {
      src: "/art/projects/iot.svg",
      width: 700,
      height: 480,
      alt: {
        pt: "Ilustração conceitual de um painel de telemetria (arte do portfólio, não captura do sistema).",
        en: "Concept illustration of a telemetry dashboard (portfolio artwork, not a system screenshot).",
        es: "Ilustración conceptual de un panel de telemetría (arte del portafolio, no captura del sistema).",
      },
    },
    repository: { href: "https://github.com/PauloSoaf/IoT-devices-manager", verifiedAt: "2026-10-10" },
    notes:
      "README: Django + DRF, JWT, Channels, PostgreSQL, Redis; Angular 16; Docker. O README cita um vídeo de demonstração no Google Drive — NÃO verificado, NÃO publicado.",
  },
  {
    slug: "gol-na-hora",
    title: "Gol na Hora",
    status: "draft",
    categories: ["academic", "web"],
    summary: {
      pt: "Protótipo acadêmico que simula microapostas ao vivo para torcedores no estádio; dados apenas locais (localStorage), sem backend real.",
      en: "Academic prototype that simulates live micro-bets for fans in the stadium; local-only data (localStorage), no real backend.",
      es: "Prototipo académico que simula microapuestas en vivo para aficionados en el estadio; datos solo locales (localStorage), sin backend real.",
    },
    tech: ["React", "TypeScript", "React Router", "Tailwind CSS", "Vite"],
    repository: { href: "https://github.com/PauloSoaf/gol-na-hora", verifiedAt: "2026-10-10" },
    teamCredits: ["Samuel Monteiro Gomes"],
    notes:
      "README: protótipo da disciplina de Engenharia de Software, feito em dupla. Nunca apresentar como serviço de apostas operacional. Confirmar crédito com o colaborador.",
  },
  {
    slug: "game-hub",
    title: "Game Hub",
    status: "draft",
    categories: ["games", "fullstack"],
    summary: {
      pt: "Plataforma online para jogar e conversar com amigos, organizada em monorepo com API NestJS em tempo real (Socket.IO).",
      en: "Online platform to play games and chat with friends, organized as a monorepo with a real-time NestJS API (Socket.IO).",
      es: "Plataforma en línea para jugar y conversar con amigos, organizada en monorepo con una API NestJS en tiempo real (Socket.IO).",
    },
    tech: ["TypeScript", "NestJS", "Socket.IO", "Redis", "Prisma", "Turborepo"],
    repository: { href: "https://github.com/PauloSoaf/game-hub", verifiedAt: "2026-10-10" },
    notes: "Marcado 'a revisar' no data-model. Stack de apps/api/package.json; apps/web não inspecionado.",
  },
];
