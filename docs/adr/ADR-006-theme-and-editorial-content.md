# ADR-006 — Tema por tokens e gate editorial

Status: implementado na S00, aprovação editorial pendente. Data: 10/10/2026.

Dark mantém os nove tokens base do pacote v0.1. Light troca apenas variáveis semânticas, com superfícies branco/grafite. Testes comparam a paleta Dark ao JSON de referência e medem contraste de texto e botões nos dois temas.

Tema é salvo em cookie e aplicado por script inline no `<head>` antes da hidratação. Dark é o fallback sem JS. O toggle usa store externa a partir do atributo de `<html>`, sem remontar componentes. Não foram adicionadas bibliotecas de i18n/tema.

Conteúdo estático tipado segue `draft → review → approved`; produção filtra as coleções. Desenvolvimento e build explícito de prévia exibem os candidatos com avisos. O perfil e textos da interface continuam renderizados para revisar a fundação; a publicação exige aprovação pelo comando `release:check`, que também exige origem HTTPS, contatos, CV e mínimo de três projetos aprovados. CI técnico e gate editorial têm propósitos separados; não existe deploy automático nesta configuração.

O validador de datas rejeita normalização de dias inexistentes pelo JavaScript, como 30 de fevereiro. Isso evita registrar uma verificação de link com data inválida.
