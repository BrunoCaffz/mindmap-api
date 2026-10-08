// Ajustes de leitura do mapa. Mude aqui para calibrar o comportamento.

// Níveis abaixo da raiz que começam visíveis (2 = raiz, filhos e netos). Todo o resto começa recolhido.
export const INITIAL_DEPTH = 2;

// Zoom mínimo em que o título ainda é legível (fonte de 13 px vira cerca de 10 px na tela).
export const MIN_ZOOM = 0.75;

// Zoom usado ao clicar num nó (nunca reduz o zoom atual, só aproxima).
export const CLICK_ZOOM = 1;

// Duração da animação ao recolher, expandir e centralizar.
export const ANIMATION_MS = 320;

// Largura do painel de detalhes (w-80). O mapa se desloca esta metade para o nó não ficar atrás dele.
export const DETAIL_PANEL_WIDTH = 320;

// Zoom de leitura usado quando o mapa não cabe na tela: a abertura fica ancorada na raiz neste zoom.
export const READING_ZOOM = 0.9;

// Abaixo deste zoom o nó mostra só o título e o botão de recolher: sem ícones, marcadores e contador.
export const SEMANTIC_ZOOM = 0.85;

// Quantidade de cores da paleta de ramos (as cores ficam em globals.css como --branch-0, --branch-1...).
export const BRANCH_COLORS = 6;

// Espera depois de parar de digitar na busca antes de expandir os ancestrais e focar no resultado.
export const SEARCH_DEBOUNCE_MS = 400;
