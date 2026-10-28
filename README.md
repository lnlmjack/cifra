# Cifra Studio

Aplicativo web estático para músicos: cadastro e leitura de cifras autorizadas, transposição, biblioteca local, playlists, diagramas sugeridos de violão/guitarra, rolagem automática e preferências salvas no dispositivo.

## O que está implementado

- Pesquisa instantânea **no acervo local**, com comparação que ignora acentos e maiúsculas.
- Cadastro, edição, exclusão e importação de cifras em `.txt` e `.json`.
- Leitor com acordes em `[colchetes]` ou em linhas próprias, organização por estrofes, ajuste de fonte e de espaçamento.
- Transposição por semitom, grafia preferida com sustenidos ou bemóis e preservação de baixos, como `G/B`.
- Modo de cifra simplificada: redução local de extensões para a família básica do acorde; é uma conveniência de visualização, não substitui uma versão simplificada editorialmente revisada.
- Diagramas gerados para violão/guitarra em afinação padrão, derivados das notas do acorde.
- Rolagem automática suave, pausa/retomada no mesmo ponto, velocidade ajustável, voltar ao início e saltar entre estrofes.
- Playlists com descrição, ordenação, renomeação, duplicação, favorito, remoção e navegação entre músicas.
- Favoritos, histórico recente, tema claro/escuro, tela cheia e salvamento no IndexedDB.
- Exportação/importação de backup JSON. Cifras também podem ser exportadas individualmente.
- PWA com cache básico para abrir a aplicação sem conexão. A instalação exige servir o site por HTTPS ou localhost.

## Limites importantes

Não existe, nesta entrega, uma API externa de busca de músicas ou cifras. A pesquisa é real, mas limitada às músicas cadastradas ou importadas no dispositivo; nenhum resultado de demonstração é inventado. Para pesquisa online, conecte uma fonte oficial/licenciada por meio de um backend próprio, respeitando autorização, termos e direitos do conteúdo. Não raspe sites de cifras nem publique material de terceiros sem permissão.

Os dados são locais a cada navegador e dispositivo. Limpar os dados do navegador pode apagá-los; faça backups. O modo offline depende do cache já carregado e não disponibiliza conteúdo online que não tenha sido salvo localmente.

Os diagramas são posições calculadas a partir da harmonia do símbolo do acorde e da afinação padrão; podem não corresponder à digitação ou inversão escolhida pelo arranjador. Revise-os antes da execução. A simplificação automática conserva famílias de acorde, mas não é uma edição musical especializada.

## Executar localmente

O projeto é estático e não requer dependências npm. Como usa módulos ES e IndexedDB, sirva a pasta por HTTP em `localhost`, não abra o HTML como `file://`.

Com Python 3 instalado:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000/` na pasta do projeto. Alternativamente, use qualquer servidor estático local.

## Testes

Com Node.js 18 ou superior, na raiz do projeto:

```bash
npm test
npm run check
```

Os testes cobrem pesquisa local/acento, validação de cifra, transposição, baixos alternativos, geração dos diagramas e persistência/importação por backup. A rolagem usa a API de animação do navegador; teste-a no navegador com a cifra aberta.

## Publicar no GitHub Pages

1. Envie **todo o conteúdo desta pasta** para a raiz de um repositório público, preservando `index.html`, `src/`, `manifest.webmanifest`, `sw.js` e `favicon.svg`.
2. No GitHub, abra **Settings → Pages**.
3. Escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/(root)`, e salve.
4. Aguarde o endereço publicado e teste a aplicação por HTTPS.

Se publicar em uma subpasta de um projeto, os caminhos relativos já usam `./`; mantenha o `index.html` na raiz publicada.

## Formatos de importação

### Texto `.txt`

```text
Título: Minha música
Artista: Meu artista
Tom: G
Versão: normal

[G]Trecho de letra com acorde
[D]Outro trecho

Em       C
Uma linha só de acordes também é aceita
```

Os cabeçalhos são opcionais. Para alinhamento mais confiável, use acordes em colchetes; linhas separadas de cifras servem para repertórios existentes.

### JSON de músicas

Um objeto por música, em um array ou no campo `songs`:

```json
[
  {
    "title": "Minha música",
    "artist": "Meu artista",
    "key": "G",
    "version": "normal",
    "source": "Conteúdo autorizado",
    "text": "[G]Trecho de letra\n[D]Outro trecho"
  }
]
```

Para transferência completa entre dispositivos, use os botões de backup: esse formato guarda as cifras, playlists, favoritos, histórico e preferências.

## Estrutura

- `index.html`: ponto de entrada e estrutura da interface.
- `src/app.js`: interface, eventos, rolagem, busca local, playlists e importação.
- `src/music.js`: normalização de pesquisa, acordes, transposição e voicings.
- `src/store.js`: camada IndexedDB e backups.
- `src/styles.css`: layout adaptável e temas.
- `tests/`: testes automatizados.
- `manifest.webmanifest`, `sw.js`: metadados PWA e cache estático.

## Privacidade e licença

Nenhuma credencial de API é necessária ou incluída. O conteúdo fica no navegador do usuário até que ele exporte um backup. O código desta entrega é distribuído sob MIT; as letras, cifras, imagens ou outros conteúdos adicionados pelo usuário não passam a ser cobertos por essa licença. Consulte os termos das fontes e obtenha autorização para qualquer conteúdo ou integração externa.
