import pkg from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; 
import dotenv from 'dotenv'
dotenv.config()
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export default {
  async createUser(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    try {
      const userExiste = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }]
        }
      });

      if (userExiste) {
        return res.status(400).json({ message: "Usuário ou email já existem" });
      }
      const hashPassword = await bcrypt.hash(password,10)

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashPassword 
        }
      });

      return res.status(201).json({
        error: false,
        message: 'Usuário criado com sucesso!',
        user
      });

    } catch (error) {
      return res.status(400).json({
        error: true,
        message: 'Ocorreu um erro ao tentar cadastrar o usuário',
        errorMessage: error.message  
      });
    }
  },

  async loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    try {
      const user = await prisma.user.findFirst({
        where: { email }
      });

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        error: false,
        message: 'Login realizado com sucesso!',
        token
      });

    } catch (error) {
      return res.status(400).json({
        error: true,
        message: 'Ocorreu um erro ao tentar fazer login',
        errorMessage: error.message  
      });
    }
  },
  async updatePassword(req, res) {
    const { userId, currentPassword, newPassword } = req.body;

    // Verificar se todos os campos estão presentes
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    try {
      // Encontrar o usuário pelo ID (esse ID pode vir de um token JWT ou da requisição)
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Verificar se o usuário existe
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Comparar a senha atual com a senha armazenada no banco
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      // Se a senha atual não coincidir
      if (!isMatch) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }

      // Criptografar a nova senha antes de salvar no banco de dados
      const hashedNewPassword = await bcrypt.hash(newPassword, 10); 

      // Atualizar a senha no banco de dados
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      // Retornar sucesso
      return res.status(200).json({
        message: "Senha atualizada com sucesso",
        user: updatedUser,
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erro ao atualizar a senha",
        error: error.message,
      });
    }
  },
  };
