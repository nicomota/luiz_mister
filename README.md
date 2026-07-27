# Mister Contador — Apresentação do ecossistema

Página única em HTML que apresenta o ecossistema do Mister Contador como um
sistema solar: um núcleo central e camadas de integrações orbitando ao redor,
reveladas conforme a rolagem afasta a câmera.

## Como abrir

Abra `apresentacao.html` no navegador. Não há build, dependências instaladas
nem servidor obrigatório — as bibliotecas são zero e as fontes vêm de CDN com
fallback para as do sistema.

Para publicar, basta servir a pasta como site estático (GitHub Pages, Netlify,
Vercel ou qualquer servidor de arquivos).

## Estrutura

```
apresentacao.html   toda a página: estilos, shader e animação
logo.png            logo exibida dentro da esfera central
img/                logos dos buscadores de notas e das instituições financeiras
img/erp/            logos dos sistemas contábeis
```

## As camadas

| Raio | Camada | Itens |
|-----:|--------|------:|
|  200 | Notas fiscais | 4 |
|  400 | Buscadores de notas | 5 |
| 1150 | Integração bancária · Open Finance | 25 |
| 2450 | Sistemas contábeis | 24 |
| 5000 | Ecossistema externo | 7 |

Cada camada só aparece quando a câmera recua o bastante para enquadrá-la, então
a rolagem revela o ecossistema de dentro para fora.

## Onde editar

Tudo o que costuma mudar está no topo do `<script>`, em constantes comentadas:

- `RINGS` — as camadas, seus itens, cores, planos orbitais e logos.
  O campo `icons` é opcional e deve ter o mesmo tamanho e ordem de `nodes`;
  `iconFit` define se o logo preenche o disco (`cover`) ou aparece inteiro com
  margem (`contain`).
- `CORE_IMAGE` e vizinhas — a logo dentro da esfera central.
- `T_WARP`, `T_BRAKE`, `T_HANDOFF`, `T_BUILD`, `T_UI` — o ritmo da abertura.
- `ZOOM_KEYS` — que raio cabe na tela em cada ponto da rolagem.
- `CAM_PITCH`, `CAM_PITCH_MID`, `CAM_PITCH_FAR` — a câmera subindo ao longo
  da apresentação.

Os textos de cada seção são as `<section class="panel">` no HTML, com
`data-from` e `data-to` marcando em que trecho da rolagem cada uma aparece.

## Créditos

O shader da abertura é o pen "Warp Speed", de Matthias Hurrle (@atzedent) —
https://codepen.io/atzedent/pen/mdgZyjZ — com três alterações marcadas no
código como `[MOD]`: velocidade controlada pelo JS, posição de repouso da
esfera e a paleta de cores da página.
