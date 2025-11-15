# MMSpace - Mentor-Mentee Management Platform

A comprehensive platform for managing mentor-mentee relationships, facilitating communication, tracking attendance, and managing leave requests.

---

## 🚀 Key Features

### User Management

- **Role-based Access Control**
  - Admin, Mentor, and Mentee roles
  - Secure authentication and authorization
  - User profile management

### Mentor-Mentee Matching

- Smart mentor-mentee pairing
- Easy reassignment when needed
- Performance tracking

### Attendance Tracking

- Real-time attendance monitoring
- Detailed attendance reports
- Analytics and insights

### Communication Tools

- In-app messaging
- Announcements and notifications
- Discussion forums

### Leave Management

- Leave request submission
- Approval workflow
- Leave history and tracking

---

## 🛠️ Technologies Used

- **Frontend**: React.js, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Deployment**: Docker, AWS

---

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher) or yarn

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/MMSpace.git
   cd MMSpace
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   - Create `.env` files in both `server` and `client` directories
   - Add required environment variables

4. **Start the application**
   ```bash
   # Start server
   cd server
   npm run dev
   
   # Start client (in a new terminal)
   cd ../client
   npm start
   ```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Contact

For any queries, please contact [your-email@example.com](mailto:your-email@example.com)
- **Real-time Chat**: Group and individual messaging with Socket.IO
- **Leave Management**: Request and approve leaves
- **Attendance Tracking**: Monitor student attendance
- **Grievance System**: Submit and track grievances
- **Announcements**: Broadcast important updates
- **Analytics Dashboard**: Comprehensive insights for admins

## 🛠️ Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Socket.IO Client
- React Router
- React Hook Form

### Backend

- Node.js
- Express
- MongoDB
- Socket.IO
- JWT Authentication

## 📦 Deployment

### Production Deployment

The application is deployed using:

- **Server**: Render (Docker)
- **Client**: Vercel
- **Database**: MongoDB Atlas

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy

1. **Deploy Server to Render**

   - Push code to GitHub
   - Create Web Service on Render
   - Set environment variables
   - Deploy using Docker

2. **Deploy Client to Vercel**
   - Connect GitHub repository
   - Configure build settings
   - Set `VITE_API_URL` environment variable
   - Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.

## 🔧 Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd MMSpace
   ```

2. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**

   Server `.env`:

   ```properties
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mmspace
   JWT_SECRET=your-secret-key
   CLIENT_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:3000
   ```

   Client `.env`:

   ```properties
   VITE_API_URL=http://localhost:5000
   ```

5. **Run the application**

   Terminal 1 (Server):

   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Client):

   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Client: http://localhost:3000
   - Server: http://localhost:5000

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Feature Implementation](./FEATURE_IMPLEMENTATION_SUMMARY.md)

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- Environment variable protection

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📧 Support

For support, please open an issue in the GitHub repository.

---

**Built with ❤️ by the MMSpace Team**
