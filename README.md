# nextHome

Microserviced web application for posting and finding nearby room/home vacancies.

## Architecture

- **vacancy-service (Spring Boot, port 8081)**
  - `POST /api/vacancies` to post vacancy
  - `GET /api/vacancies` to view vacancies
  - optional nearby filtering via query params: `latitude`, `longitude`, `radiusKm`
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
- `address`
- `latitude`
- `longitude`
- `createdBy`
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

Configure MySQL env vars for vacancy-service:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

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
- Vacancy service CRUD subset (post + list)
- Nearby filtering support
- Search microservice and gateway
- React UI for post/view flows
- Basic validation, CORS, health endpoints
- Backend tests for vacancy API

Not included yet:
- Authentication/JWT
- Service discovery/config server
- Map integration
