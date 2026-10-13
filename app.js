import express from 'express';
import session from 'express-session';
import authRoutes from './routes/auth.routes.js';
import activitiesRoutes from './routes/activities.routes.js';
import db from './config/db.js';

export function createApp({ database = db, sessionSecret = process.env.SESSION_SECRET } = {}) {
  if (process.env.NODE_ENV === 'production' && !sessionSecret) {
    throw new Error('SESSION_SECRET is required in production.');
  }

  const app = express();
  app.locals.db = database;
  app.use(express.json({ limit: '100kb' }));
  app.use(session({
    name: 'tu.sid',
    secret: sessionSecret ?? 'development-only-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    },
  }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/activities', activitiesRoutes);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server.' },
    });
  });

  return app;
}
