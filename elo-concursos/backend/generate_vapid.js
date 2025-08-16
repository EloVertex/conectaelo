import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('\nCopie a PUBLIC para o frontend (index.html - VAPID_PUBLIC_KEY) e configure a PRIVATE como variável de ambiente no backend.');
