# ADR-001: Next App Router com progressive enhancement

Status: Proposed. Contexto: site comercial que precisa ranquear, abrir rápido e manter navegação útil com WebGL/JS indisponíveis.

Decisão: Next App Router, conteúdo predominantemente renderizado no servidor/estático, client islands somente em hero, carrossel, timeline e menu. Canvas WebGL nunca gerencia navegação primária. Sem backend na V1.

Consequências: melhora baseline de acesso e SEO, exige fronteiras bem definidas e atenção ao tamanho de bundles.

Reavaliar se: houver necessidade real de autenticação, conteúdo atualizado via CMS ou funções server-only.
