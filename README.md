# Simulação Trinity – Bomba Atômica (2D Pixelada)

Simulação 2D pixelada da bomba atômica do teste Trinity, desenvolvida com **HTML, CSS e JavaScript** puros.

## Sobre o projeto

Este projeto é uma simulação visual estilizada do teste nuclear **Trinity** (16 de julho de 1945), o primeiro teste de bomba atômica da história. A interface exibe um display tipo "painel de controle" com:

- **Tela central 2D pixelada** com representação da bomba, nível de radiação e grade de pixels
- **Barras de status**: Radiação, Temperatura e Pressão
- **Histograma de radiação** em tempo real
- **HUD** com indicadores visuais
- **Registro de eventos** (log)
- **Controles**: Ligar/Parar, Estabilizar, Segurança e Reset

## Como usar

Abra o arquivo `index.html` em qualquer navegador moderno. Não são necessárias dependências externas ou instalação.

```bash
# Exemplo: abrir diretamente
start index.html
```

## Tecnologias

- HTML5
- CSS3 (layout flexbox, gradientes, sombras, animações)
- JavaScript (Canvas 2D, requestAnimationFrame, DOM)

## Estrutura

```
simulacao-trinity/
├── index.html      # Estrutura da página
├── styles.css      # Estilos pixel/industrial
├── script.js       # Lógica da simulação
└── README.md       # Este arquivo
```

## Controles

| Botão | Ação |
|-------|------|
| ▶ Ligar | Ativa o sistema e inicia a simulação |
| ⏹ Parar | Para a simulação (quando está rodando) |
| ⟳ Estabilizar | Estabiliza os níveis de radiação/calor/pressão |
| ⏏ Segurança | Ativa protocolo de emergência (resfriamento rápido) |
| ↺ Reset | Reinicializa todo o sistema |

## Licença

Projeto educacional de simulação visual. Não representa dados reais do teste Trinity.
