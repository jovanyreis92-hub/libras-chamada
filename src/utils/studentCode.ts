import QRCode from 'qrcode';

/**
 * Gera um código alfanumérico único para o aluno individual (ex: LIB-9482-K)
 */
export const generateStudentAccessCode = (prefix: string = 'LIB'): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing O/0, I/1
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const checksum = chars.charAt(Math.floor(Math.random() * chars.length));
  return `${prefix}-${randomPart}-${checksum}`;
};

/**
 * Gera um PIN numérico rápido de 4 dígitos para auto check-in (ex: 7842)
 */
export const generateStudentPin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Gera DataURL de QR Code com o código individual do aluno
 */
export const generateQRCodeDataURL = async (
  studentCode: string,
  extraMetadata?: { studentName: string; enrollmentId: string }
): Promise<string> => {
  try {
    const payload = JSON.stringify({
      app: 'LibrasFrequencia',
      code: studentCode,
      ra: extraMetadata?.enrollmentId,
      name: extraMetadata?.studentName,
      timestamp: Date.now(),
    });

    return await QRCode.toDataURL(payload, {
      width: 256,
      margin: 1.5,
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Erro ao gerar QRCode:', err);
    return '';
  }
};
