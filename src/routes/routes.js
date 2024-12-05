import { Router } from 'express';
import multer from 'multer';
import { uploadImagem } from '../Controllers/UploadImagemController.js';
import path from 'path';
import { fileURLToPath } from 'url';
import CategoriaController from '../Controllers/CategoriaController.js';
import { authenticate } from '../middlewares/auth.js';
import UserController from '../Controllers/UserController.js';
import ProdutosController from '../Controllers/ProdutosController.js';

// Necessário para trabalhar com o __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, "../../uploads/");
        cb(null, uploadsDir); // Diretório para salvar as imagens
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName); // Nome único para o arquivo
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Tipo de arquivo não suportado. Apenas JPEG, PNG e JPG são permitidos."), false);
        }
    },
});

// Rotas
const router = Router();

router.post('/uploads', upload.single('imagem'), uploadImagem);

//User
router.post('/createUser', UserController.createUser)
router.post('/login', UserController.loginUser)
router.put('/updatePassword', UserController.updatePassword)

//Produtos
router.get('/produtos', authenticate, ProdutosController.getProdutos)
router.get('/produtos/:id', authenticate, ProdutosController.getProductById)
router.post('/createProduto', authenticate, ProdutosController.createProduct)
router.put('/updateProduto/:id', authenticate, ProdutosController.updateProduct)
router.delete('/deleteProduto/:id', authenticate, ProdutosController.deleteProduct)


//categoria
router.get('/categoria',authenticate,CategoriaController.getCategorias );
router.get('/categoria/:id', authenticate,CategoriaController.getCategoriaById );
router.post('/createCategoria',authenticate,CategoriaController.createCategoria);
router.put('/updateCategoria/:id',authenticate,CategoriaController.updateCategoria);
router.delete('/deleteCategoria/:id',authenticate,CategoriaController.deleteCategoria);




export { router };
