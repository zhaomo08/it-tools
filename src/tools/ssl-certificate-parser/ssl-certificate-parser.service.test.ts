import { describe, expect, it } from 'vitest';
import { parseCertificate } from './ssl-certificate-parser.service';

// Self-signed throwaway certificate, generated only to pin the parser's output shape.
const samplePem = [
  '-----BEGIN CERTIFICATE-----',
  'MIIDhDCCAmygAwIBAgIUBxdWq1qzyZkH64ImB2+P+D2sxI8wDQYJKoZIhvcNAQEL',
  'BQAwPDELMAkGA1UEBhMCQ04xFjAUBgNVBAoMDUlUIFRvb2xzIFRlc3QxFTATBgNV',
  'BAMMDGV4YW1wbGUudGVzdDAeFw0yNjA4MjMxMzU0NDBaFw0yNzA4MjMxMzU0NDBa',
  'MDwxCzAJBgNVBAYTAkNOMRYwFAYDVQQKDA1JVCBUb29scyBUZXN0MRUwEwYDVQQD',
  'DAxleGFtcGxlLnRlc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDT',
  'EgsRdHQdETqHgOk8WkpK2VP9kvg+GmoyD7QXgBD8TdnPFFMUz6PfRkX5g2t9gqbu',
  '3pqgkrwojKOKjUM4mebHctCWm2lVVPsnHWXbD8Q5CdU1r0aTZzmaEdQrN9y5ILhf',
  'a6so8xdo1f2UlKzXYF1XkMqcXdv8n5aqVkxqmzjexyT0uIJntr/f+SWFH4X0j2Si',
  'yTClmUpPk0u5Yd3wJ3Uz6KlC4yA/n9O1IylFdPajJWPSSEoZXxzpkDTZW7wBDDYt',
  'hevOXkJPKv2CXTJvrOqUdtL6FN2vKA/HiC9grjDpck+hWtdKeQ1LNqPx8QJC2cwZ',
  'gw9EZ7MHjDC/JnKNWRMBAgMBAAGjfjB8MB0GA1UdDgQWBBR04VLGs9vA7zmfR/SK',
  '32r0F70dvzAfBgNVHSMEGDAWgBR04VLGs9vA7zmfR/SK32r0F70dvzAPBgNVHRMB',
  'Af8EBTADAQH/MCkGA1UdEQQiMCCCDGV4YW1wbGUudGVzdIIQd3d3LmV4YW1wbGUu',
  'dGVzdDANBgkqhkiG9w0BAQsFAAOCAQEAAHbosrmWYpMPqHkG4zhhY0yggAYhDXml',
  'IuTBaP3FX7Qt//ph0C+/zCJ+eu6kGBdGyaDJvQs+yJm8XjFe5m4q6sQkASX6NxFz',
  'TTKVJhpzepRs8OHyADHYYHKosO6AqqgBvlNbzo0CoqxxpZrnikWVqHqUjiMxbEAg',
  'gAPyjSyzwFca1FcWJ/mRf2V6owGfo07lycDGJd8OrcSP+JcK1jABlwEUQL5m4zH/',
  'AEVcKhbHramXOu9U6RYyFBe2PsOd0v/1FO6TAggkxIV3Uoc8ch2RuC3lAN+lWU6y',
  'dS/2k+P4gqlUV6sbrLZhbLhTAWZLQXF47w9onPWMR5TIPnrdxr09pw==',
  '-----END CERTIFICATE-----',
].join('\n');

describe('ssl-certificate-parser', () => {
  it('reads the subject and issuer of a self-signed certificate', () => {
    const info = parseCertificate(samplePem);
    const subject = Object.fromEntries(info.subject.map(field => [field.key, field.value]));

    expect(subject).toMatchObject({ 'Common Name (CN)': 'example.test', 'Organization (O)': 'IT Tools Test' });
    expect(info.issuer).toEqual(info.subject);
  });

  it('reports validity and the subject alternative names', () => {
    const info = parseCertificate(samplePem);

    expect(info.isExpired).toBe(false);
    expect(info.daysUntilExpiry).toBeGreaterThan(300);
    expect(info.subjectAltNames).toEqual(['example.test', 'www.example.test']);
  });

  it('exposes the key details a reviewer actually checks', () => {
    const info = parseCertificate(samplePem);

    expect(info.publicKeyAlgorithm).toBe('RSA');
    expect(info.publicKeySize).toContain('2048');
    expect(info.thumbprint).toMatch(/^[\dA-F:]+$/i);
    expect(info.version).toBe(3);
  });

  it('throws on input that is not a certificate', () => {
    expect(() => parseCertificate('not a certificate')).toThrow();
  });
});
