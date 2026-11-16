# Rastreamento — como ativar

Edite `assets/js/config.js` e preencha:

| Campo | Onde pegar | Formato |
|---|---|---|
| `ga4` | Google Analytics > Administrador > Fluxos de dados > Web | `G-XXXXXXXXXX` |
| `googleAds` | Google Ads > Metas > Conversões > Tag do Google | `AW-XXXXXXXXXX` |
| `googleAdsLeadLabel` | Rótulo da conversão "Contato pelo WhatsApp" | texto após a barra em `AW-.../RÓTULO` |
| `metaPixel` | Gerenciador de Eventos da Meta > Fontes de dados | só números |

Campo vazio = ferramenta desligada. O aviso de cookies (LGPD) só aparece quando
há pelo menos uma ferramenta ligada, e nada de marketing carrega antes do "Aceitar".

Eventos enviados:
- `whatsapp_click` (com `origem`) → GA4 `generate_lead`, conversão do Google Ads, Meta `Contact`
- `chat_open` → Meta `ChatAberto`
- `servico_interesse` → Meta `ViewContent`
- `servico_categoria`, `faq_abrir`, `chat_resposta`, `como_chegar` → GA4

Search Console: verificar o domínio por registro TXT no DNS da Hostinger.
