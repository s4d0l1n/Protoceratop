# RaptorGraph

Import Velociraptor data to help visualize the data.

## Docker Deployment

### Prerequisites
- Docker
- Docker Compose

### Running with Docker Compose

1. Build and start the container:
```bash
docker-compose up -d
```

2. Access the application:
Open your browser and navigate to `http://localhost:4276`

3. View logs:
```bash
docker-compose logs -f
```

4. Stop the container:
```bash
docker-compose down
```

### Building Docker Image Manually

```bash
docker build -t raptorgraph .
docker run -p 4276:4276 raptorgraph
```

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Technology Stack
- React 18
- TypeScript
- Vite
- Zustand (State Management)
- Lucide React (Icons)
- AntV G6 (Graph Visualization)
