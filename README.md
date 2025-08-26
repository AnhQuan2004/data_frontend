# DataFlow Analytics Frontend

This is the frontend application for the DataFlow Analytics platform, a tool for uploading, managing, and reviewing data files.

![Screenshot of the All Files page](public/image.png)

## Overview

This application provides a user-friendly interface for interacting with the data processing backend. It allows users to:

*   **Upload CSV files:** Users can upload data files, providing a project ID, uploader name, and filename.
*   **View all files:** A comprehensive view of all uploaded files, categorized into "Pending," "Approved," and "Rejected" tabs.
*   **Approve or reject files:** Users can review pending files and approve or reject them with feedback.
*   **Download files:** All files can be downloaded directly from the UI.

## Tech Stack

*   **Framework:** React with Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS with shadcn/ui components
*   **Routing:** React Router
*   **Data Fetching:** TanStack Query

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or bun

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd data_frontend
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```
    or
    ```bash
    bun install
    ```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

## Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run lint`: Lints the codebase for errors.
*   `npm run preview`: Serves the production build locally for preview.

## Key Features

### Dashboard (`/`)

The main dashboard for uploading new files. It includes:
*   A file upload component.
*   Input fields for `proj_id`, `uploader`, and `filename`.
*   A data preview and quality check for the selected file.

### All Files (`/all-files`)

This page provides a comprehensive view of all files, organized into three tabs:
*   **Pending:** Files awaiting review, with "Approve" and "Reject" actions.
*   **Approved:** Files that have been approved.
*   **Rejected:** Files that have been rejected, with a "Feedback" column displaying the reason for rejection.

All files can be downloaded from this page.