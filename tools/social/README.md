# Carrosséis mensais — RT Estética Avançada

- `content.py`: textos (capa, 5 lâminas, legenda, data) dos 10 carrosséis do mês.
- `render.py`: gera as lâminas 1080x1350 em estilo editorial (capa e CTA vinho, lâminas creme, Lora + Inter, cores chapadas). Nada de degradê, brilho, bokeh ou texto com efeito: a meta é parecer feito por designer, não por IA.
  Uso: `python3 tools/social/render.py social/AAAA-MM`
- As imagens ficam em `social/AAAA-MM/<slug>/<n>.jpg` e são servidas em
  `https://rtestetica.com.br/social/AAAA-MM/...` para o Metricool puxar.
- Depois do push, disparar deploy manual no Render (serviço srv-dbth99rm8hqs73aub180),
  porque o auto-deploy não dispara sozinho.
- Agendamento: Metricool, marca 8149597, Instagram + Facebook, carrossel (POST).
- Temas que se repetem: Por que fazer com a gente, Por que se cuidar, Engraçado,
  Irônico, Pra mulher moderna, Pra se valorizar, Pra se sentir bem.
- Regras de texto: sem promessa de resultado definitivo, sem "grátis"/preço/promoção
  inventada, sem antes/depois. Sempre WhatsApp (64) 99272-4619 e rtestetica.com.br.
  Público: Morrinhos - GO, região e zona rural; atendimento presencial com horário marcado.
- Legendas: tom de conversa, frases completas, no máximo 1 emoji (ou nenhum), sem
  fórmulas repetidas de emoji no rodapé. Rodapé padrão já está em `FOOT` no content.py.
- Se a pasta do mês já existir no site, gere em uma pasta nova (ex.: AAAA-MM-v2) para o
  Metricool não pegar imagem antiga do cache.
