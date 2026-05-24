# Portus

Sistema de gestão operacional para condomínios — controle de encomendas e reservas de áreas comuns.

## Como rodar

```bash
npm install             # instala as dependências do projeto
cp .env.example .env    # cria seu arquivo de configuração local (preencha com suas credenciais)
npx prisma migrate dev  # cria as tabelas no banco de dados
npx prisma db seed      # popula o banco com dados iniciais para desenvolvimento
npm run dev             # inicia o servidor local
```
