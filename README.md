# Focus Blocker

Extensão para Chrome que bloqueia sites que distraem e ajuda a manter o foco.

## Recursos

- Bloqueio de sites por palavra‑chave usando a API `declarativeNetRequest`.
- Página de configurações para adicionar ou remover sites bloqueados.
- Página de bloqueio com estatísticas diárias e frases motivacionais.
- Dados armazenados localmente usando `chrome.storage`.

## Instalação

1. Baixe ou clone este repositório.
2. No Chrome, acesse `chrome://extensions`.
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto.

## Uso

- Para bloquear um site, abra a página de opções da extensão e adicione o endereço desejado.
- Ao tentar acessar um site bloqueado, a extensão redireciona para uma página de aviso com estatísticas e mensagens motivacionais.

## Estrutura do projeto

- `manifest.json`: definições da extensão.
- `background.js`: gerenciamento dinâmico de regras de bloqueio.
- `options/`: interface para configurar sites bloqueados.
- `blocked/`: página exibida quando um site é bloqueado.

## Contribuições

Sinta‑se à vontade para abrir issues e pull requests com melhorias ou correções.
