# Ambiente de estúdio da Workstation

`studio-pmrem-v1.bin.gz` é o atlas CubeUV HDR já filtrado, produzido localmente com Three.js r186 e `RoomEnvironment`. Não usa fotografia/HDR baixado de terceiros. A licença do código/cena de origem está em `THREE-LICENSE.txt`; parâmetros, tamanho e SHA-256 em `studio-pmrem-v1.json`.

Reprodução com as dependências do projeto e Chromium Playwright instalados:

```powershell
node scripts/bake-workstation-environment.mjs
```

O script inicia/encerra um servidor Vite local na porta 3044 e Chromium sem janela, gera PMREM de 64px/face, lê RGBA16F e salva gzip. A aplicação apenas descompacta/upload a textura, sem executar a geração de PMREM durante a visita. O formato tem cabeçalho `OOEN`, largura/altura uint32 LE e pixels half-float LE. Contrato validado em `tests/unit/workstation-studio.test.ts`.

Falha de rede/formato/descompressão mantém a iluminação direta e a tela 2D. A textura é descartada ao desmontar a cena. O script não é executado no build nem pelo visitante.
