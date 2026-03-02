import dotenv from 'dotenv';
// Charger les variables d'environnement EN PREMIER
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { connectDB } from './config/database';
import passport from './config/auth';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import contentRoutes from './routes/contentRoutes';
import libraryRoutes from './routes/libraryRoutes';
import socialRoutes from './routes/socialRoutes';
import reviewRoutes from './routes/reviewRoutes';
import notificationRoutes from './routes/notificationRoutes';
import messageRoutes from './routes/messageRoutes';
import achievementRoutes from './routes/achievementRoutes';
import collaborativeListRoutes from './routes/collaborativeListRoutes';
import listRoutes from './routes/listRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.WEB_CLIENT_URL!, process.env.MOBILE_CLIENT_URL!],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Middleware de base
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: [process.env.WEB_CLIENT_URL!, process.env.MOBILE_CLIENT_URL!],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configuration des sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI!,
      ttl: 24 * 60 * 60, // 1 jour
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 jour
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  })
);

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/collaborative-lists', collaborativeListRoutes);
app.use('/api/lists', listRoutes);

// Gestion des erreurs
app.use(errorHandler);

// Gestion des WebSockets pour les notifications en temps réel
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export de l'instance io pour l'utiliser dans d'autres fichiers
export { io };

// Connexion à la base de données et démarrage du serveur
import { achievementService } from './services/achievementService';

connectDB().then(async () => {
  // Initialiser les achievements par défaut
  await achievementService.initializeDefaultAchievements();
  console.log('✅ Achievements initialisés');
  
  httpServer.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Web Client: ${process.env.WEB_CLIENT_URL}`);
    console.log(`📱 Mobile Client: ${process.env.MOBILE_CLIENT_URL}`);
  });
});

export default app;

