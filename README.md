# TaskFlow: A Collaborative Task Management Application

**TaskFlow** is a multi-tenant task management web application designed for teams to organize and track their work in a collaborative environment. It features a clean, intuitive interface with a Kanban board style to manage tasks, invite team members, and oversee team settings. The application uses WebSockets for real-time updates and has a modern dark-themed UI.

## ✨ Features

- **Multi-tenant Architecture**: Each team (tenant) has its own isolated space for tasks and users.
- **User Authentication**: Secure user login and signup with JWT-based authentication.
- **Team Management**: Admins can invite new users and manage team-wide settings.
- **Kanban Board**: A dynamic dashboard to visualize tasks in different states (To-do, In Progress, Done) with drag-and-drop functionality.
- **Real-time Updates**: WebSockets enable real-time updates for tasks and other team activities.
- **Responsive Design**: A modern, dark-themed UI built with Tailwind CSS that adapts to different screen sizes.

---

## 💻 Technologies

### Frontend

- **HTML5**
- **JavaScript (ES6+)**
- **Tailwind CSS**: For a utility-first styling workflow.
- **Font Awesome**: For icons.

### Backend

- **FastAPI**: A high-performance Python web framework.
- **SQLAlchemy**: A Python SQL toolkit and Object Relational Mapper (ORM) for database interactions.
- **PostgreSQL**: A powerful, open-source relational database.
- **Bcrypt**: For secure password hashing.
- **PyJWT**: For JSON Web Token (JWT) based authentication.
- **Websockets**: For real-time communication.

---

## 🚀 Setup & Installation

Follow these steps to get the project up and running on your local machine.

### Prerequisites

- Python 3.8+
- Node.js & npm (for Tailwind CSS)
- A running PostgreSQL database instance

### 1\. Backend Setup

First, navigate to your project's `backend` directory.

1.  **Create a Virtual Environment**:

    ```bash
    python -m venv venv
    source venv/bin/activate # On Windows, use `venv\Scripts\activate`
    ```

2.  **Install Dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

    This will install all required Python packages.

3.  **Configure Environment Variables**:
    Create a `.env` file in the `backend` directory and add your database and JWT secret key information.

    `.env`

    ```
    DATABASE_URL=postgresql://user:password@host:port/database_name
    JWT_SECRET_KEY=your_secret_key_here
    ```

    Make sure to replace the placeholder values with your PostgreSQL credentials.

4.  **Run Database Migrations**:
    The `create_tables.sql` file contains the schema for the database. Connect to your PostgreSQL instance and execute this script to create the necessary tables.

    ```bash
    # Example using psql
    psql -f create_tables.sql -d your_database_name -U your_user
    ```

5.  **Start the Backend Server**:

    ```bash
    uvicorn main:app --reload
    ```

    The API will be running at `http://localhost:8000`.

### 2\. Frontend Setup

The frontend is located in the `frontend` directory.

1.  **Install Tailwind CSS**:

    ```bash
    npm install
    ```

    This will install the necessary frontend dependencies.

2.  **Serve the Files**:
    You can use a simple server like Python's `http.server` or a VS Code extension like `Live Server` to serve the `index.html` file. Ensure the server is running on `http://127.0.0.1:5500` as configured in the backend's CORS policy.

    ```bash
    # Example using Python
    cd frontend
    python -m http.server 5500
    ```

---

## 🚀 Usage

Once both the backend and frontend servers are running, open your web browser and navigate to `http://127.0.0.1:5500`.

1.  **Sign Up**: The first user to sign up will create a new team and be designated as the team's admin.
2.  **Log In**: Use your credentials to access the team dashboard.
3.  **Manage Tasks**: On the dashboard, you can create new tasks, assign them to team members, and drag them between "To Do", "In Progress", and "Done" columns.
4.  **Invite Users**: As an admin, use the "Invite User" page to add new members to your team.
5.  **Update Settings**: Admins can update the team name from the "Team Settings" page.
