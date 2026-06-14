import { Request, Response, NextFunction } from 'express';
import Room from '../models/Room';

export const checkRoomRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId } = req.params;
      const currentUserId = req.user!._id;

      const room = await Room.findById(roomId);
      if (!room || !room.isActive) {
        return res.status(404).json({ message: 'Salon introuvable ou inactif.' });
      }

      // Vérifier si l'utilisateur est membre
      const member = room.members.find(m => m.user.toString() === currentUserId.toString());
      
      if (!member) {
        return res.status(403).json({ message: "Vous ne faites pas partie de ce salon." });
      }

      // Vérifier si son rôle est autorisé
      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ message: "Privilèges insuffisants pour cette action." });
      }

      // On attache le salon à la requête pour que le contrôleur l'utilise sans refaire un appel DB
      (req as any).room = room; 
      next();
    } catch (error) {
      res.status(500).json({ message: "Erreur de vérification des permissions." });
    }
  };
};