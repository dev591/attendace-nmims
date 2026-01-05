import bcrypt from 'bcryptjs';

const hash = '$2b$10$dr3X826KZuTL5klTTy7R5.8V25fXaicNEl3FfzTwb4AON4kNr0cLC'; // from DB dump for 90012023
const pass = 'password123';

bcrypt.compare(pass, hash).then(res => {
    console.log(`Password '${pass}' matches hash? ${res}`);
});
