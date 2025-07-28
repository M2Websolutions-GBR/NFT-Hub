import multer from 'multer';

// Multer-Speicher im RAM (kein lokales Speichern)
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
