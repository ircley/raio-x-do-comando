# RAIO-X DO COMANDO

**RAIO-X DO COMANDO** é uma aplicação web responsiva para empresários e gestores identificarem, em menos de dois minutos, quanto a empresa ainda depende do dono e qual dimensão mais limita a autonomia da equipe.

A experiência foi desenhada como um produto digital guiado, não como um formulário tradicional. O fluxo inclui abertura editorial, dez perguntas em telas individuais, captura de lead, cálculo do diagnóstico, classificação em quatro estágios e uma tela final visual com indicadores e próximo passo.

## Como executar

```bash
pnpm install
pnpm dev
```

Para validar tipos e gerar a versão de produção:

```bash
pnpm check
pnpm build
```

## Estrutura do diagnóstico

As dez respostas são pontuadas de `0` a `3` e distribuídas em quatro dimensões. **Dependência do Dono** é apresentada como risco, enquanto **Autonomia da Equipe**, **Delegação & Decisão** e **Controle da Operação** são apresentadas como maturidade. O Índice de Autonomia é a média normalizada das quatro dimensões.

| Faixa do índice | Estágio |
| --- | --- |
| 0–29 | DONO OPERADOR |
| 30–49 | CENTRALIZADOR |
| 50–74 | GESTOR |
| 75–100 | NO COMANDO |

A lógica e o conteúdo das perguntas estão centralizados em `client/src/pages/Home.tsx`.

## Configuração de integrações

O arquivo `client/src/config/integrations.ts` concentra todos os pontos de configuração solicitados:

| Integração | Campo |
| --- | --- |
| WhatsApp | `INTEGRATIONS.whatsapp.baseUrl` e `message` |
| Captura de leads | `INTEGRATIONS.leadCapture.webhookUrl` |
| CRM | `INTEGRATIONS.crm.webhookUrl` |
| Analytics/pixel | `INTEGRATIONS.analytics.pixelId` e `dataLayerName` |

Enquanto nenhum webhook estiver configurado, a aplicação permanece funcional e salva os leads no `localStorage` do navegador. Quando URLs forem adicionadas, o mesmo payload será enviado por `POST` em JSON aos destinos configurados.

## Fotografia do especialista

A tela final contém um placeholder claramente identificado para a fotografia oficial de **Ircley Oliveira**. Nenhuma imagem genérica ou depoimento fictício foi usado.

## Tecnologias

A aplicação utiliza React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide Icons e componentes shadcn/ui. O projeto é estático e não expõe chaves ou credenciais no frontend.
