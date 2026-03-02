import { Request, Response, NextFunction } from 'express';

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }

  next();
};
