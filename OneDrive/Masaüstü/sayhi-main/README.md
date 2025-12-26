https://github.com/KristiyanEnchev/StockDock

https://github.com/mtemin/PersonnelManagement

https://github.com/javeria2108/Task-Management-System-with-.NET-Typescript-React-and-SQL

---

# Sayhi

## Solution

Make sure of Aspire
```
dotnet workload install aspire
```

Create Solution
```
cd C:\Projects.SoftHub2\
mkdir Sayhi
cd Sayhi
dotnet new aspire-starter -n Sayhi
cd Sayhi.AppHost
aspire add nodejs
aspire add ct-extensions >> CommunityToolkit.Aspire.Hosting.NodeJS.Extensions
aspire add ct-extensions >> CommunityToolkit.Aspire.Hosting.Sqlite
cd ..
```

Create React Project
```
npm create vite@latest sayhi.client -- --template react-ts
cd sayhi.client
npm install
```

Add Tailwind CSS

https://tailwindcss.com/docs/installation/using-vite

Add Shadcn UI

https://ui.shadcn.com/docs/installation/vite

```
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add tooltip
npx shadcn@latest add avatar
npx shadcn@latest add breadcrumb
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add progress
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add checkbox
npx shadcn@latest add dropdown-menu
npx shadcn@latest add alert
npx shadcn@latest add alert-dialog
npx shadcn@latest add form
npx shadcn@latest add sonner
npx shadcn@latest add popover
npx shadcn@latest add calendar

npm install @tanstack/react-table
npm install @xyflow/react
npm install xlsx
npm i @hookform/resolvers
```

```
cd ..
dotnet sln add sayhi.client
```

- (Opsiyonel) Proxy ayarı ile React -> Backend
- package.json içine ekle:

  "proxy": "https://localhost:5001"

- (Opsiyonel) EF Core ile database

  `dotnet ef migrations add InitialCreate`

  `dotnet ef database update`

## DB

Docker container oluştur

`docker run --name postgres-db -e POSTGRES_USER=dbuser -e POSTGRES_PASSWORD=1 -e POSTGRES_DB=beedialer -p 5432:5432 -d postgres:15`

Container durumunu kontrol et

`docker ps`

Container içine girip kontrol et

`docker exec -it postgres-db psql -U dbuser -d beedialer`

---

```sql
ALTER TABLE call_attempts
ADD COLUMN amd_status TEXT CHECK (amd_status IN ('HUMAN','MACHINE','MACHINE_END','UNKNOWN'));
```

```sql
CREATE TABLE call_attempts (
    id SERIAL PRIMARY KEY,
    asterisk_unique_id TEXT UNIQUE,
    agent_name TEXT,
    campaign_name TEXT,
    call_status TEXT,  -- ANSWERED / NOANSWER / BUSY / FAILED
    amd_status TEXT CHECK (amd_status IN ('HUMAN','MACHINE','MACHINE_END','UNKNOWN')),
    call_duration INT, -- saniye
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Gravatar
6412:gk-Qsq_SsXunxakhG14IQ4Qof66NRU_wiVF0olN_eGZ5om5JzOB1l947rp3MO9-c

https://api.gravatar.com/v3

https://api.gravatar.com/v3/profiles/{profileIdentifier}
"Authorization: Bearer $GRAVATAR_API_KEY"
"Authorization: Bearer 6412:gk-Qsq_SsXunxakhG14IQ4Qof66NRU_wiVF0olN_eGZ5om5JzOB1l947rp3MO9-c"


## API KEY

```js
<!-- Sayfanın </body> etiketinden önce -->
<script>
(function() {
    var script = document.createElement('script');
    script.src = 'https://yourdomain.com/js/chat-widget-loader.js';
    script.setAttribute('data-site-key', 'DEMO-KEY-12345');
    document.body.appendChild(script);
})();
</script>
```