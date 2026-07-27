# Mister Contador — Apresentação do ecossistema

Página única em HTML que apresenta o ecossistema do Mister Contador como um
sistema solar: um núcleo central e camadas de integrações orbitando ao redor,
reveladas conforme a rolagem afasta a câmera.

## Como abrir

Abra `index.html` no navegador. Não há build, dependências instaladas nem
servidor obrigatório — as bibliotecas são zero e as fontes vêm de CDN com
fallback para as do sistema.

Publicado em: https://nicomota.github.io/luiz_mister/

Para hospedar em outro lugar, basta servir a pasta como site estático
(Netlify, Vercel ou qualquer servidor de arquivos).

## Estrutura

```
index.html          a página: estilos, shader de abertura e o sistema solar
neural.js           a rede neural em Three.js, carregada sob demanda
neural-data.js      camadas e nomes da rede (gerado — veja abaixo)
logo.png            logo exibida dentro da esfera central
img/                logos dos buscadores de notas e das instituições financeiras
img/erp/            logos dos sistemas contábeis
img/banks/          logos das 184 instituições da rede neural
```

O `index.html` não depende de nada para funcionar. O `neural.js` depende de
Three.js, que vem de CDN e só é baixado quando a rolagem passa de 34% — se o
CDN estiver bloqueado, aquela seção não aparece e o resto da página segue
normalmente.

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

Depois da camada 3 a curva de zoom inverte: um meteoro cai, a câmera mergulha
de volta ao núcleo e o impacto abre a rede neural.

## A rede neural

Porte do componente Angular `neural-bank` (projeto mistercontador) para
JavaScript puro. A cena é a mesma — medalha central, nós distribuídos por
espiral de Fibonacci, conexões aos vizinhos, batimento periódico. O que mudou:
saiu o Angular, e a distância da câmera passou a vir da rolagem da página em
vez da roda do mouse. As camadas continuam surgindo conforme a câmera se
afasta, como no original.

Para regenerar `neural-data.js` a partir do componente original, extraia
`nameMap` e `bankTiers` do `.ts` e remapeie os caminhos de `assets/img/` para
`img/banks/`.

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
