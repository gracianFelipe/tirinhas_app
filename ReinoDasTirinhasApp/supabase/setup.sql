-- =====================================================================
-- Reino das Tirinhas — setup do Supabase
-- Execute este arquivo UMA VEZ no SQL Editor do painel do Supabase.
-- Dashboard: Authentication → Policies → New SQL / SQL Editor
-- =====================================================================

-- ---------- TABELAS ---------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role text not null check (role in ('client', 'employee')) default 'client',
  created_at timestamptz default now()
);

create table if not exists public.products (
  id bigserial primary key,
  name text not null,
  description text,
  price numeric(10,2) not null,
  category text not null check (category in ('Tirinha', 'Molho')),
  image text
);

create table if not exists public.orders (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_number text not null unique,
  status text not null default 'Recebido na Cozinha',
  total_amount numeric(10,2) not null,
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id),
  quantity int not null default 1,
  unit_price numeric(10,2) not null
);

-- ---------- TRIGGER: cria profile ao criar auth.users -----------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- RLS -------------------------------------------------------

alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create or replace function public.is_employee()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'employee'
  );
$$;

-- profiles
drop policy if exists "profiles_select_own_or_employee" on public.profiles;
create policy "profiles_select_own_or_employee" on public.profiles
  for select using (auth.uid() = id or public.is_employee());

-- products: leitura pública (inclusive anônimos podem ver o cardápio)
drop policy if exists "products_read_all" on public.products;
create policy "products_read_all" on public.products
  for select using (true);

-- orders
drop policy if exists "orders_select_own_or_employee" on public.orders;
create policy "orders_select_own_or_employee" on public.orders
  for select using (auth.uid() = user_id or public.is_employee());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "orders_update_employee" on public.orders;
create policy "orders_update_employee" on public.orders
  for update using (public.is_employee()) with check (public.is_employee());

-- order_items: visibilidade herdada do pedido
drop policy if exists "order_items_select_visible" on public.order_items;
create policy "order_items_select_visible" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_employee())
    )
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ---------- SEED: produtos (idempotente) ------------------------------

insert into public.products (name, description, price, category, image) values
  ('Tirinhas Empanadas - 300g', 'Ideal para uma pessoa (+2 Molhos Gourmet Inclusos)', 25.00, 'Tirinha', 'tirinhas_300.png'),
  ('Tirinhas Empanadas - 500g', 'Perfeito para dividir (+2 Molhos Gourmet Inclusos)', 40.00, 'Tirinha', 'tirinhas_500.png'),
  ('Tirinhas Empanadas - 700g', 'A porção tamanho Reino (+2 Molhos Gourmet Inclusos)', 55.00, 'Tirinha', 'tirinhas_700.png'),
  ('Alho e Limão',    'Maionese artesanal, cremosa e cítrica - Alho, sal e limão', 0.00, 'Molho', 'alho_limao.png'),
  ('Baconese',        'Maionese de textura aveludada a base de bacon',            0.00, 'Molho', 'baconese.png'),
  ('Defumado',        'Clássica redução defumada na brasa (Smoked Paprika)',      0.00, 'Molho', 'defumado.png'),
  ('Ervas Finas',     'Mistura harmonizada de sal e ervas finas',                 0.00, 'Molho', 'ervas_finas.png'),
  ('Molho Proteico',  'Creme intenso de alho em base proteica e ervas',           0.00, 'Molho', 'proteico.png')
on conflict do nothing;

-- ---------- REALTIME --------------------------------------------------
-- Habilita streaming de mudanças em `orders` para o painel do funcionário.

alter publication supabase_realtime add table public.orders;
