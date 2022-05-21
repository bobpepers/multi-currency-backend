## SUPPORTED
- Runebase
- Pirate
- Tokel

# SETUP

##Create .env

```

#DATABASE
DB_NAME=runebaseGames
DB_USER=newuser
DB_PASS=@123TestDBFo
DB_HOST=localhost
DB_PORT=3306


#OPEN EXHANGE RATES KEY APP KEY()
OPEN_EXCHANGE_RATES_KEY=xx

#SESSION DASHBOARD
SESSION_SECRET="xxx"

#EMAIL
MAIL_HOST=mail.xxx.io
MAIL_PORT=587
MAIL_USER=xx@xx.com
MAIL_PASS=xx

#RECAPTCHA
RECAPTCHA_SITE_KEY=xx
RECAPTCHA_SECRET_KEY=xx

#ROOT_URL
ROOT_URL=localhost

# COIN NODES
## RUNEBASE
RUNEBASE_RPC_USER=xx
RUNEBASE_RPC_PASS=xx
RUNEBASE_RPC_PORT=9432

## PIRATE
PIRATE_RPC_USER=xx
PIRATE_RPC_PASS=xx
PIRATE_RPC_PORT=45453
PIRATE_CONSOLIDATION_ADDRESS=xx

## TOKEL
TOKEL_RPC_USER=xx
TOKEL_RPC_PASS=xx
TOKEL_RPC_PORT=29405

```
## Create database mysql terminal
```
CREATE DATABASE runebaseGames;

GRANT ALL ON runebaseGames.* TO 'newuser'@'localhost';

FLUSH PRIVILEGES;
```

## Migrations

run migrations
````
npx sequelize-cli db:migrate
````

generate a new empty migration file
````
npx sequelize-cli migration:generate --name Sleet-table

````

undo single migration
````
npx sequelize-cli db:migrate:undo --name 20211208092519-Add-user-association-to-features.js

````

undo migration
````
npx sequelize-cli db:migrate:undo
````

deploy demo seeds (development only)
````
npx sequelize-cli db:seed:all
````

generte empty seed file
````
npx sequelize-cli seed:generate --name demo-jackpot
````



## Runebase Node Config
```
daemon=1
rpcuser=runebaseinfo
rpcpassword=runebaseinfo
blocknotify=curl --header "Content-Type: application/json" --request POST --data "{ \"payload\" : \"%s\", \"ticker\" : \"RUNES\"}" http://127.0.0.1:8080/api/rpc/blocknotify
walletnotify=curl --header "Content-Type: application/json" --request POST --data "{ \"payload\" : \"%s\", \"ticker\" : \"RUNES\"}" http://127.0.0.1:8080/api/rpc/walletnotify
server=1
txindex=1
logevents=1
zmqpubrawblock=tcp://127.0.0.1:29000
zmqpubrawtx=tcp://127.0.0.1:29000
zmqpubhashtx=tcp://127.0.0.1:29000
zmqpubhashblock=tcp://127.0.0.1:29000
rpcworkqueue=128

```


## Pirate Node Config
```
rpcuser=xx
rpcpassword=xx
rpcport=45453
server=1
txindex=1
rpcworkqueue=256
rpcallowip=127.0.0.1
rpcbind=127.0.0.1
blocknotify=curl --header "Content-Type: application/json" --request POST --data "{ \"payload\" : \"%s\", \"ticker\" : \"ARRR\"}" http://127.0.0.1:8080/api/rpc/blocknotify
walletnotify=curl --header "Content-Type: application/json" --request POST --data "{ \"payload\" : \"%s\", \"ticker\" : \"ARRR\"}" http://127.0.0.1:8080/api/rpc/walletnotify
daemon=1

consolidation=1
consolidationtxfee=10000
consolidationsaplingaddress=xx
sweep=1
sweeptxfee=10000
sweepsaplingaddress=xx
deletetx=1
deleteinterval=10000

```

## Tokel Node Config
```
rpcuser=xx
rpcpassword=xx
rpcport=29405
server=1
txindex=1
rpcworkqueue=256
rpcallowip=127.0.0.1
rpcbind=127.0.0.1
blocknotify=curl --header "Content-Type: application/json" --request POST --data "{ \"payload\" : \"%s\", \"ticker\" : \"TKL\"}" http://127.0.0.1:8080/api/rpc/blocknotify
walletnotify=curl --header "Content-Type: application/json" --request POST --data "{ \"payload\" : \"%s\", \"ticker\" : \"TKL\"}" http://127.0.0.1:8080/api/rpc/walletnotify
daemon=1

```

## Read this

https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository

https://choosealicense.com/no-permission/

## Contact

If you want host this tipbot yourself, you must ask the developer for permission.

If you want the developer to host this tipbot for your project and have your project integrated, you can apply in the appropriate channel on discord

join the discord:
https://discord.gg/CdUSaVfp8Q
