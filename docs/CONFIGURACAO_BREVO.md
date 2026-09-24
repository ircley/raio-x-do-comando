# Configuração Brevo — Raio-X do Comando

A Edge Function `raio-x-lead` já está publicada no Supabase e usa a variável secreta `BREVO_API_KEY`.

## Atributos de contato necessários
Crie no Brevo como atributos normais:
- RX_STAGE — texto
- RX_SCORE — número
- RX_OWNER_DEP — número
- RX_TEAM_AUT — número
- RX_DELEGATION — número
- RX_CONTROL — número
- RX_SOURCE — texto

O fluxo também usa FIRSTNAME e SMS.

## Automação
Gatilho: evento personalizado `raio_x_comando_completed`.
Depois, aplique a sequência descrita em `AUTO_RESPONDER_BREVO.md`.

## CRM
A função cria/atualiza o contato e, quando a API retorna o contactId, cria um negócio no CRM Brevo com o nome:
`Raio-X | Nome | Estágio`.

## Segredo obrigatório
Adicionar `BREVO_API_KEY` aos Secrets do projeto Supabase `advice90d`. Não colocar a chave no frontend.
