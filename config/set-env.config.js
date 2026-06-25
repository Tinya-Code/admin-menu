import { writeFile, existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Detecta el argumento --environment=development o --environment=prod
const environmentArg = process.argv.find(arg => arg.startsWith('--environment='));
const environment = environmentArg ? environmentArg.split('=')[1] : 'prod';
const isDevelopment = environment === 'development';

// Función para escribir archivo
const writeFileUsingFs = (targetPath, environmentFileContent) => {
  writeFile(targetPath, environmentFileContent, (err) => {
    if (err) console.error(err);
    else console.log(`✅ Variables escritas en ${targetPath}`);
  });
};

// Directorio de environments
const envDirectory = './src/environments';
if (!existsSync(envDirectory)) mkdirSync(envDirectory);

// Rutas de archivos
const envProdPath = `${envDirectory}/environment.ts`;               // producción
const envDevPath = `${envDirectory}/environment.development.ts`;    // desarrollo

// Contenido para producción
const prodContent = `
// Archivo generado automáticamente
export const environment = {
  production: true,
  apiURL: '${process.env.APIURL_PROD}',

  firebaseConfig: {
    apiKey: '${process.env.FIREBASE_API_KEY_PROD}',
    authDomain: '${process.env.FIREBASE_AUTH_DOMAIN_PROD}',
    projectId: '${process.env.FIREBASE_PROJECT_ID_PROD}',
    storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET_PROD}',
    messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID_PROD}',
    appId: '${process.env.FIREBASE_APP_ID_PROD}'
  }
};
`;

// Contenido para desarrollo
const devContent = `
// Archivo generado automáticamente
export const environment = {
  production: false,
  apiURL: '${process.env.APIURL_DEV}',

  firebaseConfig: {
    apiKey: '${process.env.FIREBASE_API_KEY_DEV}',
    authDomain: '${process.env.FIREBASE_AUTH_DOMAIN_DEV}',
    projectId: '${process.env.FIREBASE_PROJECT_ID_DEV}',
    storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET_DEV}',
    messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID_DEV}',
    appId: '${process.env.FIREBASE_APP_ID_DEV}'
  }
};
`;


// Siempre genera ambos archivos
writeFileUsingFs(envProdPath, prodContent);
writeFileUsingFs(envDevPath, devContent);
