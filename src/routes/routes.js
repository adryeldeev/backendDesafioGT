import { Router } from 'express';
import multer from 'multer';
import { uploadImagem } from '../Controllers/UploadImagemController.js';
import path from 'path';
import { fileURLToPath } from 'url';
import CategoriaController from '../Controllers/CategoriaController.js';

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


router.get('/categoria',CategoriaController.getCategorias );
router.get('/categoria/:id',CategoriaController.getCategoriaById );
router.post('/createCategoria',CategoriaController.createCategoria);
router.put('/updateCategoria/:id',CategoriaController.updateCategoria);
router.delete('/deleteCategoria/:id',CategoriaController.deleteCategoria);

export { router };
