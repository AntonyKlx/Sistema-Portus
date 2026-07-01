# Portus

Sistema de gestao operacional para condominios: controle de encomendas, moradores, unidades, reservas de areas comuns, logs e backups.

## Pre-requisitos

Antes de rodar o projeto, instale:

- Node.js 20 ou superior
- MySQL Server
- Git

Para a funcionalidade de backup do banco, o comando `mysqldump` tambem precisa estar disponivel no PATH do sistema.

## Como rodar localmente

1. Instale as dependencias:

```
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

No Windows PowerShell:

```
Copy-Item .env.example .env
```

No Git Bash/Linux/macOS:

```
cp .env.example .env
```

3. Edite o `.env` com as credenciais do seu banco MySQL:

```
DATABASE_URL="mysql://usuario:senha@localhost:3306/portus_db"
NEXTAUTH_SECRET="preencha_com_uma_chave_segura"
NEXTAUTH_URL="http://localhost:3000"
```

As variaveis `SMTP_*` sao usadas para envio de e-mail com Mailtrap em ambiente local. Se nao for testar e-mails, elas podem ficar vazias.

4. Crie o banco no MySQL.

Exemplo:

```
CREATE DATABASE portus_db;
```

5. Rode as migrations:

```
npx prisma migrate dev
```

6. Popule o banco com dados iniciais:

```
npx prisma db seed
```

7. Inicie o servidor local:

```
npm run dev
```

Depois acesse:

```
http://localhost:3000
```

## Usuarios iniciais

Todos os usuarios criados pelo seed usam a senha:

```
123456
```

Exemplos de acesso:

- `master@portus.com` - Admin Master
- `admin@portus.com` - Administrador
- `ana.sindica@email.com` - Sindico
- `carlos.porteiro@email.com` - Porteiro
- `joao.silva@email.com` - Morador
