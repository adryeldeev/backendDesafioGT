import pkg from '@prisma/client';


const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const uploadImagem = async (req, res) => {
    try {
        const { product_id, userId } = req.body;
    
        
        const product = await prisma.produtos.findUnique({
          where: { id: product_id },
        });
    
        if (!product) {
          return res.status(404).json({ error: "Produto não encontrado." });
        }
    
        
        const imagem = await prisma.imagens.create({
          data: {
            product_id,
            userId,
            path: req.file.path,
            enabled: true,
          },
        });
    
        res.status(201).json({ message: "Imagem criada com sucesso!", imagem });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao fazer upload da imagem." });
      }
    };
