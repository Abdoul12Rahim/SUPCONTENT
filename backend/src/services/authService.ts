import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import validator from 'validator';

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Génère un token JWT pour un utilisateur
   */
  generateToken(userId: string): string {
    return jwt.sign(
      { id: userId }, 
      process.env.JWT_SECRET || 'default-secret', 
      { expiresIn: '7d' }
    );
  }

  /**
   * Vérifie un token JWT
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  /**
   * Valide les données d'inscription
   */
  validateRegistration(data: RegisterData): string[] {
    const errors: string[] = [];

    // Validation username
    if (!data.username || data.username.length < 3) {
      errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }
    if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores');
    }

    // Validation email
    if (!validator.isEmail(data.email || '')) {
      errors.push('Email invalide');
    }

    // Validation mot de passe
    if (!data.password || data.password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (data.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');
    }

    return errors;
  }

  /**
   * Inscrit un nouvel utilisateur
   */
  async register(data: RegisterData): Promise<{ user: IUser; token: string }> {
    const errors = this.validateRegistration(data);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email: data.email.toLowerCase() }, { username: data.username }],
    });

    if (existingUser) {
      if (existingUser.email === data.email.toLowerCase()) {
        throw new Error('Cet email est déjà utilisé');
      }
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    // Créer le nouvel utilisateur
    const user = await User.create({
      username: data.username,
      email: data.email.toLowerCase(),
      password: data.password,
    });

    const token = this.generateToken(user._id.toString());

    return { user, token };
  }

  /**
   * Connecte un utilisateur
   */
  async login(data: LoginData): Promise<{ user: IUser; token: string }> {
    if (!data.email || !data.password) {
      throw new Error('Identifiant et mot de passe requis');
    }

    // Trouver l'utilisateur par email OU username
    const user = await User.findOne({
      $or: [
        { email: data.email.toLowerCase() },
        { username: data.email }
      ]
    });
    if (!user) {
      throw new Error('Identifiant ou mot de passe incorrect');
    }

    // Vérifier si l'utilisateur est banni
    if (user.isBanned) {
      throw new Error('Ce compte a été banni');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const token = this.generateToken(user._id.toString());

    return { user, token };
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(userId: string): Promise<any> {
    return User.findById(userId).select('-password');
  }

  /**
   * Met à jour le profil d'un utilisateur
   */
  async updateProfile(
    userId: string,
    data: Partial<IUser>
  ): Promise<IUser | null> {
    // Si le username est modifié, vérifier qu'il n'est pas déjà pris
    if (data.username) {
      const existingUser = await User.findOne({ username: data.username });
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }
      // Valider le format du username
      if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        throw new Error('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores');
      }
      if (data.username.length < 3) {
        throw new Error('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      }
    }
    
    // Champs autorisés à être mis à jour
    const allowedFields = [
      'username',
      'displayName',
      'bio',
      'avatar',
      'website',
      'theme',
      'language',
      'emailNotifications',
      'pushNotifications',
    ];

    const updateData: any = {};
    allowedFields.forEach((field) => {
      if (data[field as keyof IUser] !== undefined) {
        updateData[field] = data[field as keyof IUser];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    return user;
  }

  /**
   * Change le mot de passe d'un utilisateur
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Valider le nouveau mot de passe
    if (newPassword.length < 8) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new Error(
        'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
      );
    }

    user.password = newPassword;
    await user.save();
  }
}

export default new AuthService();
