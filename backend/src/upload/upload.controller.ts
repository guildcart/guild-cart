import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// 🆕 Types MIME autorisés
const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/x-rar-compressed': '.rar',
  'application/vnd.rar': '.rar',
  'application/octet-stream': null, // Sera vérifié par extension
};

// 🆕 Extensions autorisées
const ALLOWED_EXTENSIONS = ['.pdf', '.zip', '.rar'];

// 🆕 Vérification des magic bytes (signatures de fichiers)
const FILE_SIGNATURES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  zip: [0x50, 0x4B, 0x03, 0x04], // PK..
  rar: [0x52, 0x61, 0x72, 0x21], // Rar!
};

// 🆕 Fonction de vérification de la signature du fichier
function verifyFileSignature(filePath: string): boolean {
  try {
    const buffer = fs.readFileSync(filePath);
    const header = Array.from(buffer.slice(0, 4));

    // Vérifier si le fichier correspond à l'une des signatures connues
    for (const signature of Object.values(FILE_SIGNATURES)) {
      if (signature.every((byte, index) => byte === header[index])) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Erreur vérification signature:', error);
    return false;
  }
}

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 🆕 100MB max
      },
      fileFilter: (req, file, callback) => {
        const ext = extname(file.originalname).toLowerCase();

        // 🆕 Vérification extension
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return callback(
            new BadRequestException(
              `Type de fichier non autorisé. Extensions acceptées : ${ALLOWED_EXTENSIONS.join(', ')}`
            ),
            false,
          );
        }

        // 🆕 Vérification MIME type
        if (!ALLOWED_MIME_TYPES[file.mimetype] && file.mimetype !== 'application/octet-stream') {
          return callback(
            new BadRequestException(
              'Type MIME non autorisé'
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // 🆕 Vérification de la signature du fichier (magic bytes)
    const filePath = file.path;
    const isValidSignature = verifyFileSignature(filePath);

    if (!isValidSignature) {
      // Supprimer le fichier suspect
      fs.unlinkSync(filePath);
      throw new BadRequestException(
        'Fichier suspect détecté. La signature du fichier ne correspond pas à son extension.'
      );
    }

    // 🆕 Vérification nom de fichier (pas de caractères dangereux)
    const dangerousPattern = /[<>:"|?*\x00-\x1f]/;
    if (dangerousPattern.test(file.originalname)) {
      fs.unlinkSync(filePath);
      throw new BadRequestException('Nom de fichier invalide');
    }

    const url = `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/${file.filename}`;

    return {
      url,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      type: extname(file.originalname).substring(1),
    };
  }
}