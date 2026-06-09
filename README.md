# Consulta de Produtos Protheus

Aplicação full-stack para consultar produtos, saldo por armazém, cadastro e notas fiscais de entrada com fornecedor. O schema foi adaptado das abas `SB1`, `SB2`, `SD1`, `SA1` e `SA2` da planilha `.xlsb` informada.

## Stack

- Backend: Node.js, Express, Prisma, PostgreSQL
- Frontend: React, TypeScript, TanStack Query, Tailwind CSS
- Banco: PostgreSQL com migration SQL em `backend/prisma/migrations/001_init/migration.sql`

## Rodando Localmente

### Opcao sem administrador

Se voce nao consegue instalar Docker, use o modo local sem admin:

```bat
run-local-no-admin.bat
```

Ele sobe um servidor unico em `http://127.0.0.1:5173`, cria um SQLite local em `local-no-admin/consulta_produtos.sqlite` e usa o seed do projeto. Esse modo serve para testar a tela e os endpoints sem instalar Docker, PostgreSQL ou npm.

### Carregar a base completa do XLSB na VM

Para carregar todos os registros da planilha `scavjpv0.xlsb` no modo local sem admin, rode no PowerShell dentro da pasta do projeto:

```powershell
git pull
Unblock-File "C:\CAMINHO\scavjpv0.xlsb"
powershell -ExecutionPolicy Bypass -File work\export_xlsb_csv.ps1 -Source "C:\CAMINHO\scavjpv0.xlsb" -Sheets sa2
powershell -ExecutionPolicy Bypass -File work\export_xlsb_csv.ps1 -Source "C:\CAMINHO\scavjpv0.xlsb" -Sheets sb1
powershell -ExecutionPolicy Bypass -File work\export_xlsb_csv.ps1 -Source "C:\CAMINHO\scavjpv0.xlsb" -Sheets sb2
powershell -ExecutionPolicy Bypass -File work\export_xlsb_csv.ps1 -Source "C:\CAMINHO\scavjpv0.xlsb" -Sheets sd1 -MaxColumns 100
powershell -ExecutionPolicy Bypass -File work\export_xlsb_csv.ps1 -Source "C:\CAMINHO\scavjpv0.xlsb" -Sheets sa1
py work\import_csv_sqlite.py --csv-dir work\extracted-csv --db local-no-admin\consulta_produtos.sqlite
run-local-no-admin.bat
```

O import direto no SQLite evita versionar arquivos gigantes. Na base atual, a importacao carregou `SB1: 38482`, `SB2: 69916`, `SD1: 393067`, `SA1: 112028` e `SA2: 21014` registros.

### Opcao completa com Docker

1. Suba banco, API e frontend:

```bash
docker compose up
```

2. Acesse:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

Também é possível rodar o frontend fora do Docker com `cd frontend && npm install && npm run dev`.

## Variáveis

Backend:

- `DATABASE_URL`: conexão PostgreSQL
- `PORT`: porta da API, padrão `3001`
- `CORS_ORIGIN`: origem permitida para o frontend

Frontend:

- `VITE_API_URL`: URL da API, padrão `http://localhost:3001`

## Endpoints

- `GET /api/produtos/busca?q={termo}`: busca por código ou descrição, substring e case-insensitive
- `GET /api/produtos/:codigo?filial=0101&page=1&pageSize=20`: detalhes do produto, estoque consolidado e notas paginadas

## Regras Implementadas

- Busca aplica `TRIM` e comparação case-insensitive.
- Registros deletados são filtrados por `d_e_l_e_t_ <> '*'`.
- Custo unitário é calculado no backend e retorna `null` quando quantidade é zero ou nula.
- `SD1 -> SA2` usa `D1_FORNECE + D1_LOJA = A2_COD + A2_LOJA`.
- Filtro `filial` é opcional; sem filtro consolida todas as filiais.

## Seed

O seed em `backend/prisma/seed-data/sample.json` contém dados de exemplo baseados nas linhas lidas da planilha anexada, com amostras reais de produtos, saldos, fornecedores e notas fiscais.
