# Status de liberação — Raio-X do Comando

- Captura no Supabase: VALIDADA
- Sincronização Brevo: VALIDADA
- Atributos RX no Brevo: CRIADOS
- CRM/deal Brevo: integração ativa
- Sequência de 6 e-mails: AUTOMATIZADA via fila Supabase
- Disparo imediato: VALIDADO com messageId Brevo
- Disparador recorrente: ATIVO a cada 10 minutos
- CTA final: grupo da Sala de Comando
- Foto oficial Ircley: aplicada na tela final

## CTA
Entrar gratuitamente na Sala de Comando

## Cadência
Imediato, D+1, D+3, D+5, D+7 e D+10.

## Observação de build
As alterações de código-fonte estão completas. O ambiente de empacotamento não conseguiu reinstalar dependências do npm por indisponibilidade de rede; por isso o build de produção deve ser executado no ambiente de deploy/CI com as dependências do projeto.
