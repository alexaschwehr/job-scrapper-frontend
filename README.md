# Job Fetcher Dashboard - Frontend

A modern, responsive React dashboard for viewing and filtering job listings from multiple platforms (LinkedIn, Indeed, Glassdoor, ZipRecruiter).

## Features

- 🔐 **Authentication**: Secure login with static credentials
- 📊 **Dashboard**: Beautiful, modern UI built with React and Tailwind CSS
- 🔍 **Advanced Filtering**: Filter jobs by platform and search terms
- 📄 **Pagination**: Efficient pagination for large job datasets
- 🔄 **Manual Fetch**: Trigger manual job fetching from the dashboard
- ⏰ **Last Update Time**: Track when jobs were last updated
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **React 19.2.0**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running (FastAPI)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fetcher
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API endpoint:
   - Create a `.env` file in the root directory
   - Add your backend API URL:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```

4. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

## Project Structure

```
src/
├── components/
│   ├── Dashboard.js       # Main dashboard component
│   ├── Login.js           # Login page component
│   └── ProtectedRoute.js  # Route protection component
├── context/
│   └── AuthContext.js     # Authentication context
├── services/
│   └── api.js             # API service layer
├── App.js                 # Main app component with routing
└── index.js               # Entry point
```

## API Integration

The frontend expects the following API endpoints:

### GET `/jobs/all`
Get all jobs with pagination and filtering.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 20, max: 100)
- `platform` (string, optional): Filter by platform (linkedin, indeed, glassdoor, zip_recruiter)
- `search_term` (string, optional): Search in title, company, or description

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "string",
      "title": "string",
      "company": "string",
      "location": "string",
      "description": "string",
      "link": "string",
      "platform": "string",
      "posted_date": "string",
      "fetched_date": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "page": 0,
    "page_size": 0,
    "total_pages": 0
  }
}
```

### POST `/jobs/fetch-now` (Optional)
Trigger manual job fetching. If this endpoint doesn't exist in your backend, you can:
1. Implement it in your FastAPI backend
2. Or comment out the manual fetch button in the Dashboard component

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner

## Customization

### Changing API Endpoint
Update the `REACT_APP_API_BASE_URL` in your `.env` file or modify `src/services/api.js`.

### Modifying Login Credentials
Edit the static credentials in `src/context/AuthContext.js`:
```javascript
if (username === 'admin' && password === 'admin123') {
  // ...
}
```

### Styling
The app uses Tailwind CSS. Customize colors and styles in `tailwind.config.js`.

## Future Extensibility

The system is designed modularly to support future features:
- AI Resume Tailoring Engine
- Auto-Apply System
- Additional job platforms
- Real-time notifications
- Advanced analytics

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is part of the Job Fetcher system for Milestone 2.
