# Mongo to Postgres

### Setting up a local Postgres DB

1. Install Postgres
	* Mac: `brew install postgresql && brew services start postgresql`
	* Linux: `sudo apt install postgresql`
2. Create a database and user
	* `psql postgres`
	* `CREATE DATABASE <databasename>;`
	* `CREATE ROLE <username> WITH LOGIN PASSWORD '<password>';`
	* `GRANT ALL PRIVILEGES ON DATABASE <databasename> TO <username>;`
	* `GRANT rds_superuser TO <username>` (if using AWS RDS)
	* `ALTER USER <username> CREATEDB;`
	* `ALTER USER <username> WITH SUPERUSER;`
	* `exit;`
3. Start a server with `PG_URL=postgres://<username>:<password>@127.0.0.1:5432/<databasename> yarn ea-start`
   (or with whatever `yarn` command you usually use)
