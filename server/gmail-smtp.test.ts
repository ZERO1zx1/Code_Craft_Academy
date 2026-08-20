import tls from "node:tls";
import { afterAll, describe, expect, it } from "vitest";

const smtpUser = process.env.GMAIL_SMTP_USER;
const smtpPassword = process.env.GMAIL_SMTP_APP_PASSWORD;

function waitForResponse(socket: tls.TLSSocket, expectedCode: string) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Gmail SMTP did not return ${expectedCode} before the connection timed out.`));
    }, 15_000);

    const onData = (chunk: Buffer) => {
      const response = chunk.toString("utf8");
      if (response.startsWith(expectedCode)) {
        clearTimeout(timeout);
        socket.off("data", onData);
        resolve();
      } else if (/^\d{3}/m.test(response)) {
        clearTimeout(timeout);
        socket.off("data", onData);
        reject(new Error(`Gmail SMTP rejected the credential check with status ${response.slice(0, 3)}.`));
      }
    };

    socket.on("data", onData);
  });
}

describe("Gmail SMTP credentials", () => {
  const socket = tls.connect({ host: "smtp.gmail.com", port: 465, servername: "smtp.gmail.com" });

  afterAll(() => {
    socket.end();
    socket.destroy();
  });

  it("authenticates the configured Gmail App Password without sending a message", async () => {
    expect(smtpUser).toBeTruthy();
    expect(smtpPassword).toBeTruthy();

    await new Promise<void>((resolve, reject) => {
      socket.once("secureConnect", resolve);
      socket.once("error", reject);
    });

    await waitForResponse(socket, "220");
    socket.write("EHLO codecraft-academy.local\r\n");
    await waitForResponse(socket, "250");
    socket.write("AUTH LOGIN\r\n");
    await waitForResponse(socket, "334");
    socket.write(`${Buffer.from(smtpUser!).toString("base64")}\r\n`);
    await waitForResponse(socket, "334");
    socket.write(`${Buffer.from(smtpPassword!.replace(/\s/g, "")).toString("base64")}\r\n`);
    await waitForResponse(socket, "235");
  });
});
