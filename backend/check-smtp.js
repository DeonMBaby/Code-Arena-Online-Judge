const tls = require('tls');

const HOST = 'smtp.gmail.com';
const PORT = 465;

function formatCert(cert) {
  if (!cert || Object.keys(cert).length === 0) {
    return null;
  }

  return {
    subject: cert.subject,
    issuer: cert.issuer,
    valid_from: cert.valid_from,
    valid_to: cert.valid_to,
    fingerprint256: cert.fingerprint256
  };
}

const socket = tls.connect(
  {
    host: HOST,
    port: PORT,
    servername: HOST,
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  () => {
    const peer = socket.getPeerCertificate(true);
    console.log('SMTP TLS connection succeeded.');
    console.log('This usually means Gmail certificate validation is working from this machine.');
    console.log(JSON.stringify({
      host: HOST,
      port: PORT,
      authorized: socket.authorized,
      authorizationError: socket.authorizationError || null,
      protocol: socket.getProtocol(),
      peerCertificate: formatCert(peer)
    }, null, 2));
    socket.end();
  }
);

socket.setTimeout(10000, () => {
  console.error('SMTP TLS check timed out. A firewall, VPN, proxy, or antivirus product may be interfering.');
  socket.destroy();
  process.exitCode = 1;
});

socket.on('error', (err) => {
  console.error('SMTP TLS connection failed.');
  console.error(JSON.stringify({
    message: err.message,
    code: err.code,
    reason: [
      'If this mentions certificate verification, local TLS interception is likely.',
      'Common causes are antivirus HTTPS inspection, a VPN, a corporate proxy, or a local security suite.'
    ]
  }, null, 2));
  process.exitCode = 1;
});
