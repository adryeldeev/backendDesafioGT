import express from 'express'
import cors from "cors";
import { router } from './routes/routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'
dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Habilita CORS
app.use(cors());
app.use(express.json());

// Configura CORS Headers


app.use(router);


const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});