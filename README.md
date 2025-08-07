# Bluebook SAT Simulator

A comprehensive SAT preparation platform built with modern web technologies, featuring practice tests, detailed analytics, and personalized learning paths.

## 🚀 Features

### For Students
- **Practice Tests**: Full-length SAT practice tests with realistic timing
- **Section Practice**: Focus on specific sections (Reading, Writing, Math)
- **Detailed Analytics**: Track progress with comprehensive performance insights
- **Personalized Learning**: Get recommendations based on performance
- **Progress Tracking**: Monitor improvement over time
- **Study Goals**: Set and track target scores

### For Teachers & Administrators
- **Test Creation**: Create custom practice tests
- **Question Management**: Add, edit, and organize questions
- **Student Analytics**: Monitor student progress and performance
- **User Management**: Manage student accounts and permissions
- **Content Management**: Upload images and manage test content

### Technical Features
- **JWT Authentication**: Secure user authentication and authorization
- **File Upload**: Support for images and documents using Multer
- **Rich Text Editor**: React Quill integration for content creation
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live progress tracking and notifications
- **Data Analytics**: Comprehensive performance metrics and insights

## 🛠️ Tech Stack

### Frontend
- **React 19.1**: Latest React with modern features
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form validation and management
- **React Query**: Server state management
- **React Quill**: Rich text editor
- **Framer Motion**: Animation library
- **Recharts**: Data visualization
- **React Icons**: Icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Token authentication
- **Multer**: File upload middleware
- **bcryptjs**: Password hashing
- **Express Validator**: Input validation
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bluebook-sat-simulator
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bluebook-sat-simulator

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 5. Run the Application

#### Development Mode (Recommended)

```bash
# Start both backend and frontend concurrently
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

#### Production Mode

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

### 6. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 📁 Project Structure

```
bluebook-sat-simulator/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── uploads/          # File uploads
│   └── index.js          # Server entry point
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Tests
- `GET /api/tests` - Get all tests
- `GET /api/tests/:id` - Get test by ID
- `POST /api/tests` - Create new test
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test
- `GET /api/tests/:id/questions` - Get test questions

### Questions
- `GET /api/questions` - Get questions with filters
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Results
- `GET /api/results` - Get user results
- `GET /api/results/:id` - Get result by ID
- `POST /api/results` - Start new test
- `PUT /api/results/:id` - Submit test answers
- `GET /api/results/analytics/overview` - Get analytics

### File Upload
- `POST /api/upload/profile-picture` - Upload profile picture
- `POST /api/upload/question-image` - Upload question image
- `POST /api/upload/test-image` - Upload test image
- `DELETE /api/upload/:filename` - Delete file

## 👥 User Roles

### Student
- Take practice tests
- View results and analytics
- Track progress
- Set study goals
- Access study plans (student account type only)

### Admin
- Create and manage tests
- Add questions
- View student analytics
- Manage content
- User management
- System configuration
- Content moderation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Express Validator for data validation
- **Rate Limiting**: Prevent abuse with request limiting
- **CORS Protection**: Cross-origin resource sharing security
- **Helmet**: Security headers middleware
- **File Upload Security**: Secure file handling with Multer

## 📊 Database Schema

### User Model
- Personal information (name, email, grade, school)
- Authentication (password, role)
- Profile settings (target score, study goals)
- Account status and verification

### Test Model
- Test metadata (title, description, type)
- Sections and timing
- Difficulty and tags
- Access control and settings

### Question Model
- Question content and type
- Options and correct answers
- Difficulty and topics
- Usage statistics

### Result Model
- Test attempt data
- User answers and scores
- Performance analytics
- Review notes

## 🚀 Deployment

### Backend Deployment (Heroku)

1. Create a Heroku app
2. Set environment variables
3. Deploy using Git:

```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)

1. Build the application:
```bash
cd client
npm run build
```

2. Deploy the `build` folder to your preferred hosting service

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update your environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- College Board for SAT format and content guidelines
- React and Node.js communities for excellent documentation
- Tailwind CSS for the beautiful design system
- All contributors and beta testers

---

**Happy Learning! 🎓** 