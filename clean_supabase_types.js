import fs from 'fs';

// Lire le fichier corrompu
const corrupted = fs.readFileSync('supabase_types.tmp', 'utf-8');

// Supprimer les caractères nuls
const cleaned = corrupted.replace(/\u0000/g, '');

// Écrire le fichier nettoyé
fs.writeFileSync('supabase_types_cleaned.tmp', cleaned);

console.log('Fichier nettoyé avec succès');