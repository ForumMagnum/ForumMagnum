// Jest stand-in for `geist/font/sans` and `geist/font/mono` (mapped in
// jest.config.ts): the real modules are ESM and invoke next/font/local at
// module scope, which only works under the Next build.
export const GeistSans = { variable: '--font-geist-sans', className: '' };
export const GeistMono = { variable: '--font-geist-mono', className: '' };
