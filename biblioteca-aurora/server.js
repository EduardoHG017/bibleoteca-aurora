import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, "libros.json");
const app = express();
app.use(express.json());

// ---------- Utilidades ----------
const isUUID = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v || ""
  );

const normalizeString = (s) =>
  typeof s === "string" ? s.trim() : "";

const parseYear = (y) => {
  if (y === undefined || y === null || y === "") return null;
  const n = Number(y);
  if (!Number.isInteger(n)) return NaN;
  // Rango razonable de años de publicación
  if (n < 1450 || n > new Date().getFullYear()) return NaN;
  return n;
};

const safeRead = () => {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error("JSON root no es arreglo");
    return arr;
  } catch (err) {
    // Si falla la carga, devolvemos null para que las rutas respondan 500
    console.error("Fallo al leer datos:", err.message);
    return null;
  }
};

const safeWrite = (arr) => {
  // Persistimos en disco (sincrónico por simplicidad)
  fs.writeFileSync(DATA_PATH, JSON.stringify(arr, null, 2), "utf-8");
};

// Carga inicial
let libros = safeRead();

// ---------- Rutas ----------

// 1) GET /api/libros → lista completa
app.get("/api/libros", (req, res) => {
  if (!libros) {
    return res.status(500).json({ error: "Error al leer datos" });
  }
  return res.status(200).json(libros);
});

// 2) GET /api/libros/:id → libro por id
app.get("/api/libros/:id", (req, res) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }

  if (!libros) {
    return res.status(500).json({ error: "Error al leer datos" });
  }

  const libro = libros.find((l) => l.id === id);
  if (!libro) {
    return res.status(404).json({ error: "Libro no existe" });
  }

  return res.status(200).json(libro);
});

// 3) POST /api/libros → agregar libro (title y author obligatorios; year opcional)
app.post("/api/libros", (req, res) => {
  const title = normalizeString(req.body?.title);
  const author = normalizeString(req.body?.author);
  const year = parseYear(req.body?.year);

  if (!libros) {
    return res.status(500).json({ error: "Error al leer datos" });
  }

  if (!title || !author) {
    return res
      .status(400)
      .json({ error: "Faltan campos obligatorios o datos inválidos" });
  }
  if (Number.isNaN(year)) {
    return res.status(400).json({ error: "Año inválido" });
  }

  // Regla opcional de conflicto: mismo título + mismo año
  const conflicto = libros.find(
    (l) =>
      l.title.toLowerCase() === title.toLowerCase() &&
      (l.year ?? null) === (year ?? null)
  );
  if (conflicto) {
    return res
      .status(409)
      .json({ error: "Ya existe un libro con el mismo título y año" });
  }

  const nuevo = {
    id: randomUUID(),
    title,
    author,
    year: year ?? null
  };

  libros.push(nuevo);
  // Persistimos en disco
  try {
    safeWrite(libros);
  } catch (err) {
    // Si falla escritura, revertimos en memoria y lanzamos error
    libros.pop();
    throw err;
  }

  return res.status(201).json(nuevo);
});

// 4) DELETE /api/libros/:id → eliminar por id
app.delete("/api/libros/:id", (req, res) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }

  if (!libros) {
    return res.status(500).json({ error: "Error al leer datos" });
  }

  const idx = libros.findIndex((l) => l.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Libro no existe" });
  }

  const eliminado = libros.splice(idx, 1)[0];

  try {
    safeWrite(libros);
  } catch (err) {
    // Si falla escritura, reponemos y lanzamos para que lo capture el middleware
    libros.splice(idx, 0, eliminado);
    throw err;
  }

  return res.status(200).json({ mensaje: "Libro eliminado correctamente", libro: eliminado });
});

// ---------- Middleware global de errores (paracaídas) ----------
app.use((err, req, res, next) => {
  console.error("Error inesperado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// ---------- Boot ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
