# Reino das Tirinhas App 🍗👑

Projeto pessoal para estudo e treinamento prático intensivo focado em **Desenvolvimento Mobile com Arquitetura de Dados Local**.
Este MVP foi construído como um aplicativo de autoatendimento ("Cardápio Digital" e "Finalizador de Ordens") para um restaurante gourmet estilo dark-kitchen / delivery.

## 🚀 Tecnologias Utilizadas
- **React Native** + **Expo**: Motor multiplataforma nativo.
- **TypeScript**: Programação assíncrona robusta previnindo falsas invocações.
- **Expo SQLite (Embarcado)**: Manipulação nativa local de banco de dados (`reino_das_tirinhas.db`), rodando queries offline com Transações de Banco e chaves estrangeiras para relacionamentos 1-N e N-N.
- **React Navigation**: Gerenciador (`@react-navigation/native-stack`) para transição controlada das pilhas de telas.
- **Design System Customizado**: Todos os componentes bebem de um único ecossistema centralizado (`theme.ts`) que mapeia cores Creme/Marrom/Dourado harmonizadas nativamente.

## 🌟 Estrutura e Funcionalidades Construídas

### 🛒 A Jornada do Cliente
- **Aterrissagem Animada (Splash)**: Animações assíncronas `Animated.spring` com opacidade que convergem com perfeição o fundo da logo com o fundo renderizado do container.
- **Cardápio "No-Login" Flexível**: Uma lista dinâmica populada a partir da inicialização da base de dados local, categorizando Frangos de Molhos Extras de maneira super leve via `FlatList`. Acompanhado de **8 imagens geradas ativamente via Inteligência Artificial** com estilo cartoon flat-minimalista.
- **Bouncer de Negócio (Carrinho Restrito)**: O OrderBuilder impede a navegação para o checkout usando logica atrelada ao limite máximo de *State* (A regra OBRIGA a escolha de 2 e apenas 2 molhos especiais no carrinho).

### 🍳 A Jornada da Cozinha (Staff)
- **Passagem Secreta**: Uma tela oculta de verificação em cascata, que só engatilha acesso validando senhas parametrizadas, substituindo a Pilha limpa de App para um painel que clientes normais são incapazes de ver ou "Voltar" (Back-Button Android inativado).
- **Data-Mining Real Time (O Dashboard)**: Usa Queries puras de `SQL JOINs` para buscar simultaneamente as 3 pontas (Nome do Cliente, Ordem Numérica e Nome dos Produtos atrelados na String), varrendo a tabela de Item_Ordens com `GROUP_CONCAT` para exibir na mão do chef tudo o que ele tem que separar na panela!

---
> *Status: MVP Base Funcionalizado. Desenvolvido para finalidades de aperfeiçoamento arquitetônico de estado em React Native com Relacional SQLite.*
