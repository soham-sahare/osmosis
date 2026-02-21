# Osmosis - ETL Platform

A production-ready ETL (Extract, Transform, Load) platform clone of Talend/DataStage built with React+Vite frontend and Flask backend.

## 🚀 Features

- **Workspace Management**: Create, organize, and manage multiple workspaces
- **Job Management**: Build ETL jobs with drag-and-drop canvas interface
- **Visual Canvas**: Interactive canvas powered by React Flow with pan, zoom, and grid-snap
- **Data Connectors**:
  - Input: Database Reader, CSV Reader, Excel Reader, Custom File Reader
  - Output: Database Writer, CSV Writer, Excel Writer, Custom File Writer
- **Pipeline Execution**: Run ETL pipelines with real-time visual feedback
- **Undo/Redo**: Full history management with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- **Auto-Save**: Real-time auto-save functionality
- **Import/Export**: Export and import jobs as JSON files
- **Dark/Light Theme**: Vercel-inspired color palette with theme persistence
- **Database Support**: MySQL, PostgreSQL, MongoDB, SQLite, Oracle (planned)

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Flow for canvas
- Zustand for state management
- React Router for navigation
- Axios for API calls

### Backend
- Flask (Python)
- SQLite3 for metadata storage
- Pandas for data processing
- Multiple database connectors

## 📖 Usage Guide & Flows

### 1. Authentication & Workspace Creation
1. **Login/Signup**: 
   - Enter your credentials in the login page.
   - If you are new, sign up to create an account.
2. **Dashboard**:
   - Access the main dashboard where you can view all your workspaces.
3. **Create Workspace**:
   - Click the "New Workspace" card.
   - Enter a unique name for your workspace (e.g., "Finance ETL", "Marketing Data").
   - Click "Create". You will be redirected to the workspace view.

### 2. Job Creation & Management
1. **Inside a Workspace**:
   - You will see a list of existing jobs (if any).
2. **Create New Job**:
   - Click the "+ New Job" button.
   - Give your job a descriptive name (e.g., "Daily Sales Sync").
   - The job will open in the Visual Canvas editor.

### 3. Using the Visual Canvas (Drag & Drop)
The heart of Osmosis is the visual editor.

- **Component Sidebar**: Located on the left. Contains all available ETL components (Readers, Processors, Writers).
- **Drag and Drop**:
  - Click on a component in the sidebar (e.g., "CSV Reader") and drag it onto the grid canvas.
  - Release to drop it. A node instance is created.
- **Connecting Nodes**:
  - Hover over the **right handle** (output) of a source node.
  - Click and drag a line to the **left handle** (input) of a target node (e.g., "Map Fields").
  - This establishes data flow direction.
- **Configuring Component**:
  - Click on any node on the canvas to open the **Properties Panel** on the right.
  - Configure specific settings (e.g., File Path for CSV, Connection String for DB, Transformation logic).

### 4. Running the Pipeline
1. **Validation**: Ensure all required configurations are set for each node.
2. **Execute**:
   - Click the **"Run"** button (Play icon) in the top toolbar.
   - Watch the nodes light up as data flows through them.
   - **Logs**: Check the bottom panel for execution logs, success messages, or errors.

### 5. Map & Navigation
- **Pan**: Click and drag on an empty area of the canvas to move around.
- **Zoom**: Use the mouse wheel or +/- buttons in the bottom left to zoom in/out.
- **Mini-Map**: Use the mini-map in the corner to quickly navigate large pipelines.
- **Grid Snap**: Nodes align automatically to the grid for clean layouts.

## 🧩 Component Library

### Sources (Input)
- **Database Reader**: Read tables from Postgres, MySQL, Oracle, SQLite, MongoDB.
- **File Reader**: Parse CSV, JSON, Parquet, and Excel files from local storage or S3.
- **Kafka Consumer**: Stream real-time data from Kafka topics.
- **REST Client**: Fetch data from external APIs.
- **Row Generator**: Generate mock data for testing.

### Processors (Transform)
- **Map Fields**: Rename, reorder, or calculate new fields (supports Python expressions).
- **Filter Rows**: Filter data streams based on conditions (SQL-like syntax).
- **Aggregate**: Group by fields and calculate Sum, Average, Count, Min, Max.
- **Sort**: Order data by specific columns.
- **Deduplicate**: Remove duplicate records based on keys.
- **Python Script**: Execute custom Python code for complex row-by-row logic.

### Destinations (Output)
- **Database Writer**: Insert/Update data into SQL/NoSQL databases.
- **File Writer**: Export data to CSV, JSON, or Parquet files.
- **Kafka Producer**: Push transformed data to Kafka topics.

## 🚀 Deployment

### Deploying to Vercel

**Frontend**:
1. Connect your repository to Vercel.
2. Set the `Output Directory` to `dist`.
3. Set the `Build Command` to `npm run build`.
4. Deploy.

**Backend**:
1. The backend is Python/Flask.
2. Ensure you have a `vercel.json` configured for serverless deployment if hosting on Vercel, or use a separate service like Railway/Render.

## 💻 Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ and pip

### Installation

#### 1. Clone the repository
```bash
git clone <repo-url>
cd Osmosis
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

#### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend runs on `http://localhost:5000`

## 🤝 Contributing
Contributions are welcome! Please submit a Pull Request.

## 📄 License
MIT


