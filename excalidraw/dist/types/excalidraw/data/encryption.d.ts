export declare const IV_LENGTH_BYTES = 12;
export declare const createIV: () => Uint8Array<ArrayBuffer>;
export declare const generateEncryptionKey: <T extends "string" | "cryptoKey" = "string">(returnAs?: T) => Promise<T extends "cryptoKey" ? CryptoKey : string>;
export declare const getCryptoKey: (key: string, usage: KeyUsage) => Promise<CryptoKey>;
export declare const encryptData: (key: string | CryptoKey, data: Uint8Array<ArrayBuffer> | ArrayBuffer | Blob | File | string) => Promise<{
    encryptedBuffer: ArrayBuffer;
    iv: Uint8Array<ArrayBuffer>;
}>;
export declare const decryptData: (iv: Uint8Array<ArrayBuffer>, encrypted: Uint8Array<ArrayBuffer> | ArrayBuffer, privateKey: string) => Promise<ArrayBuffer>;
