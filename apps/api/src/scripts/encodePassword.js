// Codifica una contraseña para pegarla en una URL de Supabase.
// Uso: node src/scripts/encodePassword.js "<contraseña>"
// Imprime solo el valor codificado. No repite la contraseña.

const password = process.argv[2];

if (!password) {
  console.error('Falta la contraseña.');
  console.error('Uso: node src/scripts/encodePassword.js "<contraseña>"');
  process.exit(1);
}

process.stdout.write(`${encodeURIComponent(password)}\n`);
