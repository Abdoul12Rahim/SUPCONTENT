import { Request, Response } from 'express';
import authService from '../services/authService';
import { IUser } from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register({ username, email, password });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById((req.user as IUser)._id);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = await authService.updateProfile((req.user as IUser)._id, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword((req.user as IUser)._id, currentPassword, newPassword);
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const googleCallback = (req: Request, res: Response) => {
  const token = authService.generateToken((req.user as IUser)._id);
  res.redirect(`${process.env.WEB_CLIENT_URL}/auth/callback?token=${token}`);
};

export const githubCallback = (req: Request, res: Response) => {
  const token = authService.generateToken((req.user as IUser)._id);
  res.redirect(`${process.env.WEB_CLIENT_URL}/auth/callback?token=${token}`);
};
