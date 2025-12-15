import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Response, Request } from "express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ALLOWED_IMAGE_MIME = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller("media")
export class MediaController {
  @Post("upload")
  @UseGuards(JwtAuthGuard) // ✅ nur Upload geschützt
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (
          _req: Request,
          _file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (
          _req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
          return cb(
            new BadRequestException("Nur PNG, JPG oder WEBP Bilder sind erlaubt."),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException("Keine Datei hochgeladen.");
    return { storageKey: file.filename };
  }

  @Get(":key")
  getFile(@Param("key") key: string, @Res() res: Response) {
    const safeKey = path.basename(key);
    const filePath = path.join(UPLOAD_DIR, safeKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Datei nicht gefunden." });
    }

    return res.sendFile(filePath);
  }
}
