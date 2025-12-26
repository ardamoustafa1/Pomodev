# Server Setup

## Login to Server

```powershell
ssh -i \"~/.ssh\id_ed25519\" holu@116.203.77.214 -p 2222
```

## Install .Net

```shell
sudo snap install --classic dotnet
dotnet-installer install runtime 10
```

## Config Postgres

```shell
systemctl is-active postgresql
```

<details>
<summary>optional</summary>

```shell
sudo -u postgres psql 			
```
</details>

```shell
sudo nano /etc/postgresql/16/main/postgresql.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql
sudo ufw allow 5432/tcp
```

## Install pgvector

```shell
sudo apt install postgresql-18-pgvector
```

## Create DB User
```shell
sudo -u postgres psql
> ALTER USER postgres WITH PASSWORD 'TheYeniSifre123';
> CREATE USER myuser WITH PASSWORD 'MySecret123';
> ALTER USER myuser CREATEDB;
> CREATE DATABASE mydatabase OWNER myuser;
```

## Create DB User
```shell
sudo -u postgres psql
> CREATE USER sohbetyetkilisi WITH PASSWORD 'Gecersiz@123.,!';
> ALTER USER sohbetyetkilisi CREATEDB;
> CREATE DATABASE db_chat OWNER sohbetyetkilisi;

> CREATE USER vektoryetkilisi WITH PASSWORD 'Gecersiz@456.,!';
> ALTER USER vektoryetkilisi CREATEDB;
> CREATE DATABASE db_vector OWNER vektoryetkilisi;
> \c db_vector
> CREATE EXTENSION vector;
```

## Install Nginx

> sudo dpkg --configure -a

> http://www.garderoble.com/

```shell
snap info nginx
sudo apt update
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo ufw allow 'Nginx Full'
```

```
server {
    listen 80;
    server_name domain.com www.domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

```shell
sudo nginx -t
sudo systemctl reload nginx
```

## Edit Nginx

```shell
sudo nano /etc/nginx/sites-available/garderoble.com
sudo nano /etc/nginx/sites-available/garderoble.com
```

```
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name garderoble.com www.garderoble.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name garderoble.com www.garderoble.com;

    ssl_certificate /etc/letsencrypt/live/garderoble.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/garderoble.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:5001;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https; # HTTPS kullandığınızı belirtmek için

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_read_timeout 86400;
        proxy_buffering off;
    }
}
```

```shell
sudo ln -s /etc/nginx/sites-available/garderoble.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Install Certbot (Let’s Encrypt)

```shell
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d garderoble.com -d www.garderoble.com
sudo certbot renew --dry-run
```
## Publish

```powershell
C:\Projects.SoftHub2\Sayhi\sayhi.web> npm run build
```

```powershell
C:\Projects.SoftHub2\Sayhi> dotnet publish ./Sayhi.AIGateway -c Release
C:\Projects.SoftHub2\Sayhi> dotnet publish ./Sayhi.ApiService -c Release
```
// C:\Projects.SoftHub2\Sayhi\Sayhi.AIGateway\bin\Release\net10.0\publish\
// C:\Projects.SoftHub2\Sayhi\Sayhi.ApiService\bin\Release\net10.0\publish\

```powershell
C:\Projects.SoftHub2\Sayhi> dotnet publish ./Sayhi.AIGateway -c Release -r linux-x64
C:\Projects.SoftHub2\Sayhi> dotnet publish ./Sayhi.ApiService -c Release -r linux-x64
```
// C:\Projects.SoftHub2\Sayhi\Sayhi.AIGateway\bin\Release\net10.0\linux-x64\
// C:\Projects.SoftHub2\Sayhi\Sayhi.ApiService\bin\Release\net10.0\linux-x64\


```
sudo nano /etc/systemd/system/chat.api.service
```
```
[Unit]
Description=chat.api
After=network.target

[Service]
WorkingDirectory=/home/holu/chat.api
ExecStart=/var/snap/dotnet/common/dotnet/dotnet /home/holu/chat.api/Sayhi.ApiService.dll
Restart=always
RestartSec=10
SyslogIdentifier=chat.api
User=holu
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

sudo systemctl daemon-reload
sudo systemctl enable chat.api.service
sudo systemctl start chat.api.service
sudo systemctl status chat.api.service

```
sudo nano /etc/systemd/system/ai.gateway.service
```
```
[Unit]
Description=ai.gateway
After=network.target

[Service]
WorkingDirectory=/home/holu/ai.gateway
ExecStart=/var/snap/dotnet/common/dotnet/dotnet /home/holu/ai.gateway/Sayhi.AIGateway.dll
Restart=always
RestartSec=10
SyslogIdentifier=ai.gateway
User=holu
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

sudo systemctl daemon-reload
sudo systemctl enable ai.gateway.service
sudo systemctl start ai.gateway.service
sudo systemctl status ai.gateway.service

## Upload

```shell
sudo systemctl stop ai.gateway.service
sudo systemctl stop chat.api.service

C:\Projects.SoftHub2\Sayhi\Sayhi.ApiService\bin\Release\net10.0\linux-x64\publish\
C:\Projects.SoftHub2\Sayhi\Sayhi.AIGateway\bin\Release\net10.0\linux-x64\publish\

sudo systemctl start ai.gateway.service
sudo systemctl start chat.api.service

systemctl is-active ai.gateway.service
systemctl is-active chat.api.service
```

## Debug

```shell
sudo systemctl stop chat.api.service

cd /home/holu/chat.api
dotnet ./Sayhi.ApiService.dll
```

## Drop DB
```shell
sudo -u postgres psql
> DROP DATABASE db_chat;
> CREATE DATABASE db_chat OWNER sohbetyetkilisi;
```

scp -r "C:\Projects.SoftHub2\Sayhi\Sayhi.AIGateway\bin\Release\net10.0\linux-x64\" -p 2222 holu@116.203.77.214:/opt/sayhi/
scp -r "C:\Projects.SoftHub2\Sayhi\Sayhi.AIGateway\bin\Release\net10.0\linux-x64\" -p 2222 holu@116.203.77.214:/home/sayhi/

//ssh -i \"~/.ssh\id_ed25519\" holu@116.203.77.214 -p 2222
sftp user@server_ip

put C:\path\to\file.txt
put -r C:\path\to\folder
ls
exit

ssh holu@116.203.77.214 -p 2222 "sudo mkdir -p /opt/sayhi"
ssh -i \"~/.ssh\id_ed25519\" holu@116.203.77.214 -p 2222 "mkdir -p /opt/sayhi"

scp C:\path\to\file.txt user@server_ip:/home/user/
scp -r C:\path\to\project user@server_ip:/home/user/
scp -P 2222 C:\dosya.zip user@server_ip:/home/user/

mkdir -p /opt/yubis/backup/${{ env.NOW }}
cp -a -p /opt/yubis/release/. /opt/yubis/backup/${{ env.NOW }}

echo "${{ secrets.SSH_PASSWORD }}" | sudo -S systemctl stop yubis.service

cp -a -p /opt/yubis/ftp/. /opt/yubis/release/

echo "${{ secrets.SSH_PASSWORD }}" | sudo -S systemctl start yubis.service

## Docker

C:\Projects.SoftHub2\Sayhi>

docker compose up -d --build
docker save -o sayhi-ai.gateway.tar sayhi-ai.gateway
docker save -o sayhi-chat.api.tar sayhi-chat.api

ssh holu@116.203.77.214 -p 2222 "sudo mkdir -p /opt/sayhi"

scp sayhi-ai.gateway.tar holu@116.203.77.214:/opt/sayhi/ -p 2222
scp sayhi-chat.api.tar holu@116.203.77.214:/opt/sayhi/ -p 2222

docker run -d --name myapp -p 5000:80 myapp:latest


sudo ln -s /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

## Docker

```powershell
docker run --name postgres-chat -e POSTGRES_DB=db-chat -e POSTGRES_USER=yetkili-biri -e POSTGRES_PASSWORD=Gecersiz@123.,! -p 5433:5432 -d postgres
docker run --name pg-vector -e POSTGRES_DB=db-vector -e POSTGRES_USER=yetkili-kisi -e POSTGRES_PASSWORD=Gecersiz@456.,! -p 5432:5432 -d pgvector/pgvector:0.8.1-pg18-trixie
docker exec pg-vector psql -U yetkili-kisi -d db-vector -c "CREATE EXTENSION vector;"
```
