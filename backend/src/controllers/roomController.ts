import { Request, Response } from 'express';
import Room from '../models/Room';

// --- ACTIONS GÉNÉRALES ---

export const getActiveRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find({ isActive: true, visibility: 'public' })
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, description, visibility, rules, avatar } = req.body;
    const currentUserId = req.user!._id;

    const newRoom = new Room({
      name, description, visibility, rules, avatar,
      creator: currentUserId,
      members: [{
        user: currentUserId,
        role: 'admin' // Le créateur est admin automatiquement
      }]
    });

    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user!._id;
    const room = await Room.findById(roomId);

    if (!room || !room.isActive) return res.status(404).json({ message: 'Salon introuvable' });

    // 1. Vérification du banissement
    const banRecord = room.bannedUsers.find(b => b.user.toString() === currentUserId.toString());
    if (banRecord) {
      if (!banRecord.bannedUntil || new Date(banRecord.bannedUntil) > new Date()) {
        return res.status(403).json({ message: "Vous êtes banni de ce salon." });
      } else {
        // Le ban a expiré, on le nettoie
        room.bannedUsers = room.bannedUsers.filter(b => b.user.toString() !== currentUserId.toString());
      }
    }

    // 2. Vérifier s'il est déjà membre
    if (room.members.some(m => m.user.toString() === currentUserId.toString())) {
      return res.status(400).json({ message: "Vous êtes déjà dans ce salon." });
    }

    // 3. Logique Public vs Privé
    if (room.visibility === 'private') {
      if (!room.pendingRequests.includes(currentUserId)) {
        room.pendingRequests.push(currentUserId);
        await room.save();
      }
      return res.json({ message: "Demande envoyée aux modérateurs." });
    }

    // Si public, il rejoint directement
    room.members.push({ user: currentUserId, role: 'normal', joinedAt: new Date() });
    await room.save();
    res.json({ message: "Vous avez rejoint le salon.", room });

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user!._id;
    
    await Room.findByIdAndUpdate(roomId, {
      $pull: { members: { user: currentUserId } }
    });
    res.json({ message: "Vous avez quitté le salon." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// --- ACTIONS MODÉRATEURS & ADMINS ---

export const acceptRequest = async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
    const room = (req as any).room;

    room.pendingRequests = room.pendingRequests.filter((id: any) => id.toString() !== targetUserId);
    room.members.push({ user: targetUserId, role: 'normal', joinedAt: new Date() });
    
    await room.save();
    res.json({ message: "Utilisateur accepté dans le salon." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
    const { duration, reason } = req.body; 
    const currentUserId = req.user!._id;
    const room = (req as any).room;

    const currentMember = room.members.find((m: any) => m.user.toString() === currentUserId.toString());
    const targetMember = room.members.find((m: any) => m.user.toString() === targetUserId);

    if (!targetMember) return res.status(404).json({ message: "Joueur introuvable ici." });

    // Hiérarchie : Un modérateur ne peut pas bannir un autre modérateur ni un admin
    if (currentMember.role === 'moderator' && ['admin', 'moderator'].includes(targetMember.role)) {
      return res.status(403).json({ message: "Vous n'avez pas l'autorité pour bannir ce membre." });
    }

    // Création de la date d'expiration
    let bannedUntil = null; // Par défaut : banni à vie
    if (duration === '1_day') bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (duration === '1_week') bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (duration === '1_month') bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Retirer des membres et ajouter aux bannis
    room.members = room.members.filter((m: any) => m.user.toString() !== targetUserId);
    room.bannedUsers.push({ user: targetUserId, bannedBy: currentUserId, bannedUntil, reason });

    await room.save();
    res.json({ message: "Utilisateur banni avec succès." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBannedUsers = async (req: Request, res: Response) => {
  try {
    const room = (req as any).room;
    await room.populate('bannedUsers.user', 'username avatar');
    res.json(room.bannedUsers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- ACTIONS STRICTEMENT ADMINS ---

export const updateRoomSettings = async (req: Request, res: Response) => {
  try {
    const room = (req as any).room;
    const { name, description, avatar, visibility, rules } = req.body;
    
    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (avatar) room.avatar = avatar;
    if (visibility) room.visibility = visibility;
    if (rules !== undefined) room.rules = rules;

    await room.save();
    res.json({ message: "Paramètres mis à jour.", room });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const promoteMember = async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
    const { newRole } = req.body; // 'admin', 'moderator', 'normal'
    const room = (req as any).room;

    const targetMember = room.members.find((m: any) => m.user.toString() === targetUserId);
    if (!targetMember) return res.status(404).json({ message: "Membre introuvable." });

    targetMember.role = newRole;
    await room.save();
    res.json({ message: `Le rôle a été changé en ${newRole}.` });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!._id;
    const room = (req as any).room;

    // SÉCURITÉ ABSOLUE : Seul le créateur originel peut détruire la room
    if (room.creator.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Seul le créateur original peut supprimer ce salon." });
    }

    await Room.findByIdAndDelete(room._id);
    res.json({ message: "Le salon a été définitivement supprimé." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user!._id;
    const room = (req as any).room;

    // Ne jamais permettre de retirer le créateur original.
    if (room.creator.toString() === targetUserId) {
      return res.status(400).json({ message: 'Impossible de retirer le créateur du salon.' });
    }

    const currentMember = room.members.find((m: any) => m.user.toString() === currentUserId.toString());
    const targetMember = room.members.find((m: any) => m.user.toString() === targetUserId);

    if (!targetMember) {
      return res.status(404).json({ message: 'Membre introuvable dans ce salon.' });
    }

    // Un modérateur ne peut pas retirer un admin/modérateur.
    if (currentMember?.role === 'moderator' && ['admin', 'moderator'].includes(targetMember.role)) {
      return res.status(403).json({ message: "Vous n'avez pas l'autorité pour retirer ce membre." });
    }

    room.members = room.members.filter((m: any) => m.user.toString() !== targetUserId);
    await room.save();

    res.json({ message: 'Membre retiré du salon.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};