# Biblioteca Aurora

API REST simple para gestionar una colección de libros.

Contenido del repositorio
- `biblioteca-aurora/` - código del servidor (Node.js + Express) y datos (`libros.json`).
- `package.json` - scripts y dependencias para el proyecto.

Cómo ejecutar
1. Abrir PowerShell y situarse en la carpeta del proyecto:

```powershell
Set-Location 'C:\Users\edugu\OneDrive\Desktop\Bibleoteca Aurora\biblioteca-aurora'
npm install
npm start
```

2. El servidor escucha por defecto en `http://localhost:3000`.

Rutas principales
- `GET /api/libros` → lista completa de libros
- `GET /api/libros/:id` → obtener libro por id (UUID)
- `POST /api/libros` → crear libro (body JSON con `title`, `author`, `year` opcional)
- `DELETE /api/libros/:id` → eliminar por id

Notas
- El archivo de datos es `biblioteca-aurora/libros.json` y el servidor lo lee/reescribe sincrónicamente.
- Si quieres subir este repositorio a GitHub, crea un repositorio remoto y añade el remote con:

```powershell
Set-Location 'C:\Users\edugu\OneDrive\Desktop\Bibleoteca Aurora'
git remote add origin <URL-del-repo>
git push -u origin main
```

Si quieres, puedo crear el repo remoto por ti (necesitaré que me proves la URL o me indiques que quieres que genere instrucciones para GitHub).