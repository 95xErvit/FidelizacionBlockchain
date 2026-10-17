-- Esquema de la base de datos (Supabase / Postgres) de Puntos del Barrio.
-- Ya está aplicado en el proyecto "fidelizacion-blockchain". Este archivo sirve
-- para recrear la base desde cero (Supabase → SQL Editor → pegar y ejecutar).
--
-- Lo que NO va a la blockchain: nombres, celulares y el historial indexado.

create extension if not exists pgcrypto;

create table public.comercios (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  barrio          text,
  responsable     text,
  cuenta_stellar  text unique check (cuenta_stellar ~ '^G[A-Z2-7]{55}$'),
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente','aprobado','rechazado','inactivo')),
  limite_mensual  integer not null default 2000 check (limite_mensual >= 0),
  creado_en       timestamptz not null default now()
);

create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  celular     text not null unique check (celular ~ '^[0-9]{10}$'),
  -- Identificador anónimo que usa el contrato (32 bytes aleatorios en hex):
  -- no se puede deducir el celular a partir de él.
  cliente_id  text not null unique default encode(gen_random_bytes(32), 'hex')
              check (cliente_id ~ '^[0-9a-f]{64}$'),
  creado_en   timestamptz not null default now()
);

create table public.movimientos (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in ('entrega','redencion')),
  cliente_id    text not null references public.clientes(cliente_id),
  comercio_id   uuid not null references public.comercios(id),
  puntos        integer not null check (puntos > 0),
  valor_compra  integer check (valor_compra is null or valor_compra >= 0),
  tx_hash       text not null unique check (tx_hash ~ '^[0-9a-f]{64}$'),
  ledger        integer,
  creado_en     timestamptz not null default now()
);

create index movimientos_cliente_idx  on public.movimientos (cliente_id, creado_en desc);
create index movimientos_comercio_idx on public.movimientos (comercio_id, creado_en desc);

-- Nadie entra directo desde el navegador: solo la API (llave secreta) lee y escribe.
alter table public.comercios   enable row level security;
alter table public.clientes    enable row level security;
alter table public.movimientos enable row level security;

-- Datos de prueba (los mismos de frontend/src/data/mockData.js).
insert into public.comercios (nombre, barrio, responsable, estado, limite_mensual) values
  ('Tienda Doña Rosa',    'Belén',    'Rosa Gutiérrez', 'aprobado',  5000),
  ('Panadería El Trigal', 'Laureles', 'Jorge Pineda',   'aprobado',  3000),
  ('Droguería La 33',     'Laureles', 'Marta Restrepo', 'pendiente', 2000);

insert into public.clientes (nombre, celular) values
  ('Camila Ospina', '3001234567'),
  ('Andrés Mejía',  '3109876543');
