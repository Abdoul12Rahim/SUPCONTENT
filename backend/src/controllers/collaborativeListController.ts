import { Request, Response } from 'express';
import CollaborativeList from '../models/CollaborativeList';
import Content from '../models/Content';
import notificationService from '../services/notificationService';
import { io } from '../app';

// Créer une liste collaborative
export const createList = async (req: Request, res: Response) => {
  try {
    const { name, description, visibility, tags } = req.body;
    const userId = req.user!._id;

    const list = await CollaborativeList.create({
      name,
      description,
      owner: userId,
      visibility: visibility || 'private',
      tags: tags || [],
      members: [
        {
          user: userId,
          role: 'owner',
          addedAt: new Date(),
        },
      ],
      items: [],
    });

    const populatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('items.content', 'title slug backgroundImage externalId')
      .populate('items.addedBy', 'username displayName');

    res.status(201).json(populatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Obtenir toutes les listes d'un utilisateur
export const getUserLists = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    const lists = await CollaborativeList.find({
      'members.user': userId,
    })
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .sort({ updatedAt: -1 });

    // Ajouter le rôle de l'utilisateur dans chaque liste
    const listsWithRole = lists.map((list) => {
      const listObj = list.toObject();
      const member = list.members.find((m) => m.user._id.toString() === userId.toString());
      return {
        ...listObj,
        userRole: member?.role || 'viewer',
      };
    });

    res.json({ lists: listsWithRole });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir une liste spécifique
export const getList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user?._id;

    const list = await CollaborativeList.findById(listId)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('items.content', 'title slug backgroundImage externalId')
      .populate('items.addedBy', 'username displayName');

    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier les permissions
    const isMember = list.members.some((m) => m.user._id.toString() === userId?.toString());
    if (list.visibility === 'private' && !isMember) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Ajouter le rôle de l'utilisateur
    const listObj = list.toObject();
    const member = list.members.find((m) => m.user._id.toString() === userId?.toString());
    
    res.json({
      ...listObj,
      userRole: member?.role || null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une liste
export const updateList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const { name, description, visibility, tags } = req.body;
    const userId = req.user!._id;

    const list = await CollaborativeList.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier si l'utilisateur est propriétaire ou éditeur
    const member = list.members.find((m) => m.user.toString() === userId.toString());
    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }

    // Seul le propriétaire peut changer la visibilité
    if (visibility && member.role !== 'owner') {
      return res.status(403).json({ message: 'Seul le propriétaire peut changer la visibilité' });
    }

    if (name) list.name = name;
    if (description !== undefined) list.description = description;
    if (visibility && member.role === 'owner') list.visibility = visibility;
    if (tags) list.tags = tags;

    await list.save();

    const updatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('items.content', 'title slug backgroundImage externalId')
      .populate('items.addedBy', 'username displayName');

    // Notifier les membres
    list.members.forEach((m) => {
      if (m.user.toString() !== userId.toString()) {
        io.to(`user_${m.user}`).emit('list_updated', { listId: list._id });
      }
    });

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une liste
export const deleteList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user!._id;

    const list = await CollaborativeList.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Seul le propriétaire peut supprimer
    if (list.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Seul le propriétaire peut supprimer cette liste' });
    }

    // Notifier les membres avant suppression
    list.members.forEach((m) => {
      if (m.user.toString() !== userId.toString()) {
        io.to(`user_${m.user}`).emit('list_deleted', { listId: list._id });
      }
    });

    await list.deleteOne();
    res.json({ message: 'Liste supprimée' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Ajouter un membre
export const addMember = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const { userId: newUserId, role } = req.body;
    const currentUserId = req.user!._id;

    const list = await CollaborativeList.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier si l'utilisateur est propriétaire
    if (list.owner.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Seul le propriétaire peut ajouter des membres' });
    }

    // Vérifier si l'utilisateur n'est pas déjà membre
    const existingMember = list.members.find((m) => m.user.toString() === newUserId);
    if (existingMember) {
      return res.status(400).json({ message: 'Utilisateur déjà membre de cette liste' });
    }

    list.members.push({
      user: newUserId,
      role: role || 'viewer',
      addedAt: new Date(),
    });

    await list.save();

    const updatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar');

    // Notifier le nouvel utilisateur
    await notificationService.createNotification({
      user: newUserId,
      type: 'recommendation',
      from: currentUserId.toString(),
      reference: list._id.toString(),
      message: `Vous avez été ajouté à la liste "${list.name}"`,
    });
    io.to(`user_${newUserId}`).emit('list_invited', { listId: list._id });

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Retirer un membre
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { listId, userId: memberUserId } = req.params;
    const currentUserId = req.user!._id;

    const list = await CollaborativeList.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Le propriétaire peut retirer n'importe qui, ou l'utilisateur peut se retirer lui-même
    const isOwner = list.owner.toString() === currentUserId.toString();
    const isSelf = currentUserId.toString() === memberUserId;

    if (!isOwner && !isSelf) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }

    // Ne pas permettre au propriétaire de se retirer
    if (list.owner.toString() === memberUserId) {
      return res.status(400).json({ message: 'Le propriétaire ne peut pas quitter sa liste' });
    }

    list.members = list.members.filter((m) => m.user.toString() !== memberUserId);
    await list.save();

    const updatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar');

    // Notifier l'utilisateur retiré
    io.to(`user_${memberUserId}`).emit('list_removed', { listId: list._id });

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Modifier le rôle d'un membre
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { listId, userId: memberUserId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user!._id;

    const list = await CollaborativeList.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Seul le propriétaire peut modifier les rôles
    if (list.owner.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Seul le propriétaire peut modifier les rôles' });
    }

    // Ne pas permettre de modifier le rôle du propriétaire
    if (list.owner.toString() === memberUserId) {
      return res.status(400).json({ message: 'Impossible de modifier le rôle du propriétaire' });
    }

    const member = list.members.find((m) => m.user.toString() === memberUserId);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    member.role = role;
    await list.save();

    const updatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar');

    // Notifier le membre
    io.to(`user_${memberUserId}`).emit('list_role_updated', { listId: list._id, newRole: role });

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Ajouter un jeu à la liste
export const addItem = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const { contentId, note } = req.body;
    const userId = req.user!._id;

    const list = await CollaborativeList.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier si l'utilisateur peut éditer
    const member = list.members.find((m) => m.user.toString() === userId.toString());
    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }

    // Vérifier si le jeu existe
    let content = await Content.findById(contentId).catch(() => null);
    if (!content) {
      // Essayer avec externalId
      if (!isNaN(parseInt(contentId))) {
        const externalApiService = require('../services/externalApiService').default;
        content = await externalApiService.getOrCreateContent(parseInt(contentId));
      }
    }

    if (!content) {
      return res.status(404).json({ message: 'Jeu non trouvé' });
    }

    // Vérifier si le jeu n'est pas déjà dans la liste
    const existingItem = list.items.find((item) => item.content.toString() === content!._id.toString());
    if (existingItem) {
      return res.status(400).json({ message: 'Ce jeu est déjà dans la liste' });
    }

    list.items.push({
      content: content._id,
      addedBy: userId,
      addedAt: new Date(),
      note: note || undefined,
    });

    await list.save();

    const updatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('items.content', 'title slug backgroundImage externalId')
      .populate('items.addedBy', 'username displayName');

    // Notifier les autres membres
    list.members.forEach((m) => {
      if (m.user.toString() !== userId.toString()) {
        io.to(`user_${m.user}`).emit('list_item_added', { listId: list._id });
      }
    });

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Retirer un jeu de la liste
export const removeItem = async (req: Request, res: Response) => {
  try {
    const { listId, itemId } = req.params;
    const userId = req.user!._id;

    const list = await CollaborativeList.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier si l'utilisateur peut éditer
    const member = list.members.find((m) => m.user.toString() === userId.toString());
    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }

    // Trouver l'item par contentId
    const itemIndex = list.items.findIndex((item) => item.content.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Jeu non trouvé dans la liste' });
    }

    list.items.splice(itemIndex, 1);
    await list.save();

    const updatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('items.content', 'title slug backgroundImage externalId')
      .populate('items.addedBy', 'username displayName');

    // Notifier les autres membres
    list.members.forEach((m) => {
      if (m.user.toString() !== userId.toString()) {
        io.to(`user_${m.user}`).emit('list_item_removed', { listId: list._id });
      }
    });

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Obtenir les listes publiques
export const getPublicLists = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const query: any = { visibility: 'public' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    const [lists, total] = await Promise.all([
      CollaborativeList.find(query)
        .populate('owner', 'username displayName avatar')
        .populate('members.user', 'username displayName avatar')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      CollaborativeList.countDocuments(query),
    ]);

    res.json({
      lists,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Rejoindre une liste via code d'invitation
export const joinListByCode = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user!._id;

    const list = await CollaborativeList.findOne({ inviteCode })
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar');

    if (!list) {
      return res.status(404).json({ message: 'Code d\'invitation invalide' });
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = list.members.find((m) => m.user._id.toString() === userId.toString());
    if (existingMember) {
      return res.status(400).json({ message: 'Vous êtes déjà membre de cette liste', list });
    }

    // Ajouter l'utilisateur comme viewer
    list.members.push({
      user: userId,
      role: 'viewer',
      addedAt: new Date(),
    });

    await list.save();

    const updatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('items.content', 'title slug backgroundImage externalId')
      .populate('items.addedBy', 'username displayName');

    // Notifier le propriétaire
    await notificationService.createNotification({
      user: list.owner._id.toString(),
      type: 'recommendation',
      from: userId.toString(),
      reference: list._id.toString(),
      message: `${req.user!.username} a rejoint votre liste "${list.name}"`,
    });
    io.to(`user_${list.owner}`).emit('list_member_joined', { listId: list._id });

    res.json({ message: 'Vous avez rejoint la liste avec succès', list: updatedList });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Rejoindre une liste publique directement
export const joinListPublic = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user!._id;

    const list = await CollaborativeList.findById(listId)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar');

    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier si la liste est bien publique
    if (list.visibility !== 'public') {
      return res.status(403).json({ message: 'Cette liste est privée. Utilisez un code d\'invitation.' });
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = list.members.find((m) => m.user._id.toString() === userId.toString());
    if (existingMember) {
      return res.status(400).json({ message: 'Vous êtes déjà membre de cette liste' });
    }

    // Ajouter l'utilisateur comme viewer
    list.members.push({
      user: userId,
      role: 'viewer',
      addedAt: new Date(),
    });

    await list.save();

    const updatedList = await CollaborativeList.findById(list._id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('items.content', 'title slug backgroundImage externalId')
      .populate('items.addedBy', 'username displayName');

    // Notifier le propriétaire
    await notificationService.createNotification({
      user: list.owner._id.toString(),
      type: 'recommendation',
      from: userId.toString(),
      reference: list._id.toString(),
      message: `${req.user!.username} a rejoint votre liste "${list.name}"`,
    });
    io.to(`user_${list.owner}`).emit('list_member_joined', { listId: list._id });

    res.json({ message: 'Vous avez rejoint la liste avec succès', list: updatedList });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Régénérer le code d'invitation (pour sécurité)
export const regenerateInviteCode = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user!._id;

    const list = await CollaborativeList.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier si l'utilisateur est propriétaire
    if (list.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Seul le propriétaire peut régénérer le code d\'invitation' });
    }

    // Générer un nouveau code unique
    const crypto = require('crypto');
    let newCode: string;
    let isUnique = false;

    while (!isUnique) {
      newCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existingList = await CollaborativeList.findOne({ inviteCode: newCode });
      if (!existingList) {
        isUnique = true;
        list.inviteCode = newCode;
      }
    }

    await list.save();

    res.json({ message: 'Code d\'invitation régénéré avec succès', inviteCode: list.inviteCode });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
