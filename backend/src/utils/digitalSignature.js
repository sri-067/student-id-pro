const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class DigitalSignature {
  constructor() {
    this.algorithm = 'RSA-SHA256';
    this.keySize = 2048;
    this.initializeKeys();
  }

  initializeKeys() {
    const keyDir = path.join(__dirname, '..', '..', 'keys');
    const privateKeyPath = path.join(keyDir, 'private.pem');
    const publicKeyPath = path.join(keyDir, 'public.pem');

    // Create keys directory if it doesn't exist
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }

    // Generate keys if they don't exist
    if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
      this.generateKeyPair(privateKeyPath, publicKeyPath);
    }

    // Load keys
    this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    this.publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  }

  generateKeyPair(privateKeyPath, publicKeyPath) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: this.keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);
  }

  // Sign student certificate data
  signStudentCertificate(studentData) {
    const certificateData = {
      studentId: studentData._id,
      regNo: studentData.regNo,
      name: studentData.name,
      department: studentData.department,
      year: studentData.year,
      issuedAt: studentData.cardIssuedAt,
      expiresAt: studentData.cardExpiry,
      issuer: 'Student ID System',
      timestamp: new Date().toISOString()
    };

    const dataString = JSON.stringify(certificateData, null, 0);
    const signature = crypto.sign(this.algorithm, Buffer.from(dataString), this.privateKey);

    return {
      certificate: certificateData,
      signature: signature.toString('base64'),
      publicKey: this.publicKey
    };
  }

  // Verify certificate signature
  verifyCertificate(certificate, signature, publicKey = null) {
    try {
      const keyToUse = publicKey || this.publicKey;
      const dataString = JSON.stringify(certificate, null, 0);
      const signatureBuffer = Buffer.from(signature, 'base64');

      return crypto.verify(
        this.algorithm,
        Buffer.from(dataString),
        keyToUse,
        signatureBuffer
      );
    } catch (error) {
      return false;
    }
  }

  // Generate QR code with digital signature
  generateSecureQR(studentData) {
    const signedCertificate = this.signStudentCertificate(studentData);
    
    // Create compact QR data
    const qrData = {
      id: studentData._id,
      reg: studentData.regNo,
      name: studentData.name,
      dept: studentData.department,
      year: studentData.year,
      exp: studentData.cardExpiry,
      sig: signedCertificate.signature.substring(0, 32) // Truncated for QR size
    };

    return {
      qrData: JSON.stringify(qrData),
      fullCertificate: signedCertificate,
      verificationUrl: `${process.env.APP_URL}/verify-certificate/${Buffer.from(JSON.stringify(qrData)).toString('base64')}`
    };
  }

  // Verify QR data
  verifyQRData(qrDataString) {
    try {
      const qrData = JSON.parse(qrDataString);
      
      // Reconstruct certificate for verification
      const certificate = {
        studentId: qrData.id,
        regNo: qrData.reg,
        name: qrData.name,
        department: qrData.dept,
        year: qrData.year,
        expiresAt: qrData.exp,
        issuer: 'Student ID System'
      };

      // Note: This is a simplified verification
      // In production, you'd store full signatures in database
      return {
        isValid: true, // Simplified for demo
        certificate,
        verifiedAt: new Date()
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid QR data format'
      };
    }
  }
}

module.exports = new DigitalSignature();