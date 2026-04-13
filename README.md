# nextHome

Microserviced web application for posting and finding nearby room/home vacancies.

## Architecture

- **vacancy-service (Spring Boot, port 8081)**
  - `POST /api/vacancies` to post vacancy and receive a management token
  - `GET /api/vacancies` to view vacancies (supports optional `city` filter)
  - `GET /api/vacancies/{id}` to view a specific vacancy by id
  - `PUT /api/vacancies/{id}` to modify a vacancy with its management token (`X-Management-Token` header or `token` query param)
  - `DELETE /api/vacancies/{id}` to delete a vacancy with its management token (`X-Management-Token` header or `token` query param)
  - optional nearby filtering via query params: `latitude`, `longitude`, `radiusKm` (only for location-aware search)
- **search-service (Spring Boot, port 8082)**
  - `GET /api/search/nearby` (delegates to vacancy-service nearby search)
- **gateway-service (Spring Cloud Gateway, port 8080)**
  - routes frontend requests to backend services
- **frontend (React + Vite)**
  - Landing screen with two big options: **Post Vacancy**, **View Vacancy**

## Data model

`Vacancy`
- `id`
- `title`
- `description`
- `roomType`
- `rent`
- `city`
- `address`
- `latitude` (optional)
- `longitude` (optional)
- `createdBy`
- `managementToken` (used for future modify/delete)
- `createdAt`

Indexes are configured on `(latitude, longitude)` and `createdAt`.

## Run with Docker Compose

From repository root:

```bash
docker compose up --build
```

Services:
- MySQL: `localhost:3306`
- Vacancy service: `localhost:8081`
- Search service: `localhost:8082`
- Gateway service: `localhost:8080`

## Run locally without Docker

### Backend

```bash
cd backend
mvn clean test
mvn -pl vacancy-service spring-boot:run
mvn -pl search-service spring-boot:run
mvn -pl gateway-service spring-boot:run
```

### Database setup (required for vacancy-service)

Option 1: Start MySQL with Docker:

```bash
docker run --name nexthome-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=vacancy_db -p 3306:3306 -d mysql:8.4
```

Option 2: Use an existing MySQL server and create DB/user:

```sql
CREATE DATABASE IF NOT EXISTS vacancy_db;
CREATE USER IF NOT EXISTS 'nexthome'@'%' IDENTIFIED BY 'nexthome';
GRANT ALL PRIVILEGES ON vacancy_db.* TO 'nexthome'@'%';
FLUSH PRIVILEGES;
```

Set DB env vars for vacancy-service:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Example:

```bash
export DB_URL=jdbc:mysql://localhost:3306/vacancy_db
export DB_USERNAME=root
export DB_PASSWORD=root
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional API base URL:
- `VITE_API_BASE_URL` (default: `http://localhost:8080`)

## Phase coverage

Implemented now:
- Vacancy service token-based post/list/update/delete
- Nearby filtering support
- Search microservice and gateway
- React UI for post/view/modify/delete flows
- Basic validation, CORS, health endpoints
- Backend tests for vacancy API

Not included yet:
- Authentication/JWT
- Service discovery/config server
- Map integration
