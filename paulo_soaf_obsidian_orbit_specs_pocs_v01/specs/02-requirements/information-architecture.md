# Arquitetura de informação / rotas

## Menu principal
`Work` → `#work` / `About` → `#about` / `Expertise` → `#expertise` / `Services` → `#services` / `Contact` → `#contact`.

## Rotas propostas
- `/pt` e `/en`: landing completa. `/` escolhe locale default de forma estável e amigável a SEO (redirecionamento configurado conforme hosting).
- `/pt/projects/[slug]` e `/en/projects/[slug]`: estudo de caso traduzido.
- `/pt/projects` e `/en/projects`: índice opcional caso haja mais de 5 cases.
- `/robots.txt`, `/sitemap.xml`, `/opengraph-image` ou assets OG otimizados.

## Ordem na landing
1. Header e Hero (nome, proposta, CTAs).
2. Selected Work (3 a 5 projetos aprovados; não publicar cards vazios).
3. About & Experience (trajetória interativa).
4. Engineering (grupos por problema resolvido; stack técnica).
5. Services (sites premium, integração, software sob medida, manutenção, conforme disponibilidade).
6. Contact (e-mail, LinkedIn, CV; WhatsApp apenas quando aprovado).
7. Footer (links e créditos).

## Estrutura dos cases
Hero de projeto → contexto → desafio → arquitetura/solução → contribuição de Paulo → tradeoffs → resultados demonstráveis → stack → mídia/código/demo verificados → contato.

## Idiomas
Idioma em toda rota, links absolutos/canonical e hreflang. Metadados, UI, alt texts e cases traduzidos. Não interpolar strings soltas no código.
