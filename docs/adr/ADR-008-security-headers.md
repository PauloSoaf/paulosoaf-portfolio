# ADR-008 — CSP para páginas pré-renderizadas

Status: baseline implementada pelo Claude na S00. Data: 10/10/2026.

`next.config.ts` configura CSP, `nosniff`, política de referrer, restrição de frames e de permissões. Recursos de runtime são locais. `script-src 'unsafe-inline'` atende ao payload RSC inline e ao bootstrap de tema sem nonce por requisição; `unsafe-eval` é limitado ao desenvolvimento. `style-src 'unsafe-inline'` atende aos estilos do framework.

Essa baseline restringe origens mas não protege contra todas as formas de script inline injetado. Uma CSP estrita com nonce exigiria rever o pré-renderizado estático e o cache; não afirmar que essa melhoria já foi implementada. Não há backend, analytics, formulário nem segredos adicionados.

Auditoria local: `npm audit --omit=dev` não encontrou vulnerabilidades conhecidas. A auditoria completa apontou cinco entradas de severidade alta na cadeia de desenvolvimento `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`, originadas no aviso GHSA-vfj7-8cjw-p6xm. A ferramenta sugeriu downgrade incompatível de `eslint-config-next` para 14.2.35; não foi aplicado `audit fix --force`. Aguardar correção compatível, sem tratar o aviso como resolvido.

Playwright e playwright-core foram alinhados em 1.63.0 para que axe use o mesmo contrato de tipos. Antes, a dependência peer de axe resolvia playwright-core 1.64.0 e quebrava o typecheck.
