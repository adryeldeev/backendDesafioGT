import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default {
  async getProdutos(req, res) {
    try {
      const {
        limit = 12,
        page = 1,
        fields,
        match,
        category_ids,
        price_range,
        ...options
      } = req.query;

      // Configuração de paginação
      const take = parseInt(limit) === -1 ? undefined : parseInt(limit); // -1 para buscar todos os itens
      const skip = take ? (parseInt(page) - 1) * take : undefined;

      // Seleção de campos (com fallback para todos)
      const selectFields = fields
        ? fields.split(',').reduce((acc, field) => {
            acc[field.trim()] = true;
            return acc;
          }, {})
        : {
            id: true,
            enabled: true,
            name: true,
            slug: true,
            stock: true,
            description: true,
            price: true,
            price_with_discount: true,
          };

      // Filtros
      const where = {
        AND: [
          match
            ? {
                OR: [
                  { name: { contains: match, mode: 'insensitive' } },
                  { description: { contains: match, mode: 'insensitive' } },
                ],
              }
            : undefined,
          category_ids
            ? {
                produtoCategoria: {
                  some: {
                    categoria_id: { in: category_ids.split(',').map(Number) },
                  },
                },
              }
            : undefined,
          price_range
            ? {
                price: {
                  gte: parseFloat(price_range.split('-')[0]),
                  lte: parseFloat(price_range.split('-')[1]),
                },
              }
            : undefined,
        ].filter(Boolean),
      };

      // Busca no banco
      const produtos = await prisma.produtos.findMany({
        where,
        take,
        skip,
        include: {
          produtoCategoria: {
            select: { categoria_id: true },
          },
          imagens: {
            where: { enabled: true },
            select: { id: true, path: true },
          },
          opcoesProdutos: {
            select: { id: true, title: true, shape: true, radius: true, type: true, values: true },
          },
        },
      });

      // Formatação dos dados
      const formattedData = produtos.map((produto) => ({
        ...produto,
        category_ids: produto.produtoCategoria.map((cat) => cat.categoria_id),
        images: produto.imagens.map((img) => ({
          id: img.id,
          content: img.path,
        })),
        options: produto.opcoesProdutos.map((option) => ({
          id: option.id,
          title: option.title,
          shape: option.shape,
          radius: option.radius,
          type: option.type,
          values: option.values.split(','), // Divide as opções em uma lista
        })),
      }));

      // Total de produtos
      const total = await prisma.produtos.count({ where });

      // Resposta
      res.status(200).json({
        data: formattedData,
        total,
        limit: take,
        page: parseInt(page),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar produtos',
        error: error.message,
      });
    }
  },
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      // Verifica se o ID foi fornecido
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do produto é obrigatório.',
        });
      }

      // Busca o produto no banco pelo ID
      const product = await prisma.produtos.findUnique({
        where: { id: parseInt(id) },
        include: {
          produtoCategoria: {
            select: { categoria_id: true },
          },
          imagens: {
            where: { enabled: true },
            select: { id: true, path: true },
          },
          opcoesProdutos: {
            select: { id: true, title: true, shape: true, radius: true, type: true, values: true },
          },
        },
      });

      // Verifica se o produto foi encontrado
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado.',
        });
      }

      // Formata a resposta
      const formattedResponse = {
        id: product.id,
        enabled: product.enabled,
        name: product.name,
        slug: product.slug,
        stock: product.stock,
        description: product.description,
        price: parseFloat(product.price),
        price_with_discount: parseFloat(product.price_with_discount),
        category_ids: product.produtoCategoria.map((cat) => cat.categoria_id),
        images: product.imagens.map((img) => ({
          id: img.id,
          content: img.path, // Assumindo que o campo path já contém a URL completa
        })),
        options: product.opcoesProdutos.map((option) => ({
          id: option.id,
          title: option.title,
          shape: option.shape,
          radius: option.radius,
          type: option.type,
          values: option.values.split(','),
        })),
      };

      // Retorna o produto formatado
      res.status(200).json(formattedResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar produto pelo ID',
        error: error.message,
      });
    }
  },
  async createProduct(req, res) {
    try {
      const {
        enabled,
        name,
        slug,
        stock,
        description,
        price,
        price_with_discount,
        category_ids,
        images,
        options,
      } = req.body;
  
      // Validação básica
      if (!name || !price) {
        return res.status(400).json({
          success: false,
          message: 'Os campos "name" e "price" são obrigatórios.',
        });
      }
  
      // Cria o produto
      const newProduct = await prisma.produtos.create({
        data: {
          enabled,
          name,
          slug,
          stock,
          description,
          price,
          price_with_discount,
          produtoCategoria: {
            create: category_ids?.map((id) => ({ categoria_id: id })),
          },
          imagens: {
            create: images?.map((img) => ({ path: img.content })),
          },
          opcoesProdutos: {
            create: options?.map((option) => ({
              title: option.title,
              shape: option.shape,
              radius: option.radius,
              type: option.type,
              values: option.values.join(','), // Concatena valores
            })),
          },
        },
      });
  
      res.status(201).json({
        success: true,
        data: newProduct,
        message: 'Produto criado com sucesso.',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar produto.',
        error: error.message,
      });
    }
  },
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const {
        enabled,
        name,
        slug,
        stock,
        description,
        price,
        price_with_discount,
        category_ids,
        images,
        options,
      } = req.body;
  
      // Verifica se o ID foi fornecido
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do produto é obrigatório.',
        });
      }
  
      // Atualiza o produto
      const updatedProduct = await prisma.produtos.update({
        where: { id: parseInt(id) },
        data: {
          enabled,
          name,
          slug,
          stock,
          description,
          price,
          price_with_discount,
          produtoCategoria: {
            deleteMany: {}, // Remove as categorias antigas
            create: category_ids?.map((catId) => ({ categoria_id: catId })),
          },
          imagens: {
            deleteMany: {}, // Remove imagens antigas
            create: images?.map((img) => ({ path: img.content })),
          },
          opcoesProdutos: {
            deleteMany: {}, // Remove opções antigas
            create: options?.map((option) => ({
              title: option.title,
              shape: option.shape,
              radius: option.radius,
              type: option.type,
              values: option.values.join(','), // Concatena valores
            })),
          },
        },
      });
  
      res.status(200).json({
        success: true,
        data: updatedProduct,
        message: 'Produto atualizado com sucesso.',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar produto.',
        error: error.message,
      });
    }
  },
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
  
      // Verifica se o ID foi fornecido
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do produto é obrigatório.',
        });
      }
  
      // Deleta o produto
      await prisma.produtos.delete({
        where: { id: parseInt(id) },
      });
  
      res.status(200).json({
        success: true,
        message: 'Produto deletado com sucesso.',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar produto.',
        error: error.message,
      });
    }
  }
  

  
};
