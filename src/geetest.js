// src/geetest.js
import { useGeeTest } from "react-geetest-v4";

const CAPTCHA_ID = "5a589307d9f26d84b6308457c7dbc837"; // ID pública de GeeTest
const VERIFY_URL = "https://fastpass-backend.vercel.app/api/verify-geetest";

export function usePuzzleCaptcha() {
  const { captcha } = useGeeTest(CAPTCHA_ID, {
    product: "bind",
    protocol: "https://",
  });

  const verify = () =>
    new Promise((resolve, reject) => {
      if (!captcha) {
        console.error("GeeTest todavía no está listo");
        return reject(new Error("Captcha no está listo aún"));
      }

      captcha.onSuccess(async (result) => {
        try {
          console.log("Resultado bruto de GeeTest:", result);

          // 👇 MAPEAR camelCase -> snake_case para el backend
          const payload = {
            captcha_output: result.captcha_output || result.captchaOutput,
            gen_time: result.gen_time || result.genTime,
            lot_number: result.lot_number || result.lotNumber,
            pass_token: result.pass_token || result.passToken,
          };

          console.log("Payload enviado al backend:", payload);

          const resp = await fetch(VERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await resp.json();
          console.log("Respuesta backend GeeTest:", data);

          if (data.ok) {
            resolve(true);
          } else {
            alert("No se pudo verificar el puzzle. Intenta de nuevo.");
            resolve(false);
          }
        } catch (e) {
          console.error("Error llamando al backend GeeTest:", e);
          alert("Error al verificar el puzzle en el servidor.");
          resolve(false);
        }
      });

      captcha.showCaptcha();
    });

  return { verify };
}
