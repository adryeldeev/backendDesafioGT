import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default {
  async getCategorias(req, res) {
    try {
      const {
        limit = 12,
        page = 1,
        fields,
      } = req.query;

      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);

      const query = {};

      // Seleção de campos
      let select = undefined;
      if (fields) {
        const fieldArray = fields.split(',').reduce((acc, field) => {
          acc[field.trim()] = true;
          return acc;
        }, {});
        select = fieldArray;
      }

      let take = 12;
      let skip = 0;
      if (parsedLimit === -1) {
        take = undefined; // retorna todos os itens
      } else {
        take = parsedLimit;
        skip = (parsedPage - 1) * take;
      }

      const [categorias, total] = await Promise.all([
        prisma.categoria.findMany({
          where: query,
          take,
          skip,
          select,
        }),
        prisma.categoria.count({
          where: query,
        }),
      ]);

      const totalPages = take ? Math.ceil(total / take) : 1;

      res.status(200).json({
        data: categorias,
        meta: {
          total,
          totalPages,
          currentPage: parsedPage,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar categorias', error });
    }
  },

  async getCategoriaById(req, res) {
    try {
      const { id } = req.params;

      // Selecionar campos específicos se "fields" for passado
      const { fields } = req.query;
      let select = undefined;
      if (fields) {
        const fieldArray = fields.split(',').reduce((acc, field) => {
          acc[field.trim()] = true;
          return acc;
        }, {});
        select = fieldArray;
      }

      // Buscar categoria pelo ID
      const categoria = await prisma.categoria.findUnique({
        where: { id: parseInt(id) },
        select,
      });

      if (!categoria) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }

      res.status(200).json(categoria);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar a categoria pelo ID', error });
    }
  },
  async createCategoria(req, res) {
    try {
      const { name, slug, use_in_menu } = req.body;
  
      if (!name || !slug) {
        return res.status(400).json({ message: "Campos obrigatórios: name, slug" });
      }
  
      const novaCategoria = await prisma.categoria.create({
        data: {
          name,
          slug,
          use_in_menu: use_in_menu || false, // Valor padrão: `false`
        },
      });
  
      res.status(201).json(novaCategoria);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao criar a categoria", error });
    }
  },
  async updateCategoria(req, res) {
    try {
      const { id } = req.params;
      const { name, slug, use_in_menu } = req.body;
  
      const categoriaExistente = await prisma.categoria.findUnique({ where: { id: parseInt(id) } });
  
      if (!categoriaExistente) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
  
      const categoriaAtualizada = await prisma.categoria.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(use_in_menu !== undefined && { use_in_menu }),
        },
      });
  
      res.status(200).json(categoriaAtualizada);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar a categoria", error });
    }
  },
  async deleteCategoria(req, res) {
    try {
      const { id } = req.params;
  
      const categoriaExistente = await prisma.categoria.findUnique({ where: { id: parseInt(id) } });
  
      if (!categoriaExistente) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
  
      await prisma.categoria.delete({ where: { id: parseInt(id) } });
  
      res.status(200).json({ message: "Categoria removida com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao remover a categoria", error });
    }
  }
  
  
  
};
