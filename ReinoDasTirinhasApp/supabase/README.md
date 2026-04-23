# Setup do Supabase — Reino das Tirinhas

## 1. Rode o SQL de setup

No painel do Supabase:

- **SQL Editor → New query** → cole o conteúdo de [`setup.sql`](./setup.sql) → **Run**.

Isso cria as tabelas (`profiles`, `products`, `orders`, `order_items`), o trigger que gera o profile a cada novo `auth.users`, as políticas de RLS, semeia os 8 produtos e habilita realtime na tabela `orders`.

## 2. Desligue a confirmação de e-mail (opcional, recomendado para estudo)

Como é um app de estudo sem servidor SMTP, o mais prático é desligar a confirmação obrigatória:

- **Authentication → Providers → Email** → desmarque **Confirm email** → **Save**.

Com isso o `signUp` já deixa o usuário logado imediatamente.

## 3. Crie o funcionário "Felipe"

O Supabase Auth exige e-mail, então o login literal `Felipe / 1234?` não sobrevive. Recrie o admin assim:

1. **Authentication → Users → Add user → Create new user**
   - Email: `felipe@reino.com` (ou o que preferir)
   - Password: `1234?` (ou o que preferir)
   - Marque **Auto Confirm User**
2. **SQL Editor** → promova o profile criado pelo trigger:

   ```sql
   update public.profiles
      set role = 'employee', name = 'Felipe - Chefe Real'
    where id = (select id from auth.users where email = 'felipe@reino.com');
   ```

## 4. Pronto

O app (`.env` já configurado) vai conectar automaticamente e respeitar as políticas de RLS. Clientes enxergam só os próprios pedidos; funcionários veem tudo e podem avançar o status.
