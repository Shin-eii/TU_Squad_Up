# Docker development environment

Docker runs the React frontend, Express API, and MySQL database together. Team members only need Git and Docker Desktop; they do not need to install Node.js or MySQL locally.

## First-time setup

1. Install and open Docker Desktop.
2. Clone the repository and open a terminal in its root folder.
3. Create your private Docker environment file:

   ```powershell
   Copy-Item .env.docker.example .env.docker
   ```

4. Open `.env.docker` and replace all `replace_with_...` values. Keep this file private.
5. Start the complete application:

   ```powershell
   docker compose --env-file .env.docker up --build
   ```

6. Wait until all three services are running, then open <http://localhost:5173>.

## Service addresses

| Service | Address | Purpose |
|---|---|---|
| React | `http://localhost:5173` | Application UI |
| Express | `http://localhost:3000` | REST API |
| MySQL | `localhost:3308` | Optional MySQL Workbench connection |

For Workbench, use the `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` values from your private `.env.docker` file.

## Daily commands

```powershell
# Start and show logs
docker compose --env-file .env.docker up

# Start in the background
docker compose --env-file .env.docker up -d

# Stop the environment without deleting data
docker compose --env-file .env.docker down

# Follow logs
docker compose --env-file .env.docker logs -f
```

Source files are mounted into the containers. Express and Vite automatically reload after saved code changes.

## Reset the development database

The schema and seed files run only when Docker creates an empty MySQL volume. To delete local Docker database data and recreate it:

```powershell
docker compose --env-file .env.docker down --volumes
docker compose --env-file .env.docker up --build
```

This reset permanently deletes only the database stored in this project's Docker volume. It does not affect a separately installed MySQL server or Workbench connection.

## Common problems

- **Port 3308 is already used:** change `MYSQL_HOST_PORT` in `.env.docker`, for example to `3309`.
- **Port 3000 or 5173 is already used:** stop the local Node/Vite process using that port before starting Compose.
- **Database edits are not applied:** perform the reset command above because MySQL initialization scripts run only for a new volume.
- **A service failed:** run `docker compose --env-file .env.docker logs <service>`, where `<service>` is `db`, `api`, or `frontend`.
