import bcrypt from "bcryptjs";
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
};

export function encryptPassword(password) {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

export function decryptPassword(encryptedPassword) {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};