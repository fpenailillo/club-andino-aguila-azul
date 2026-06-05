import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM ??
  "Club Andino Águila Azul <no-reply@clubandinoaguilaazul.cl>";

export async function sendMagicLinkEmail(
  email: string,
  nombre: string,
  magicUrl: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Tu enlace de acceso al portal del club",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <div style="width: 40px; height: 40px; background: #1e40af; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 20px;">⛰</span>
          </div>
          <div>
            <p style="margin: 0; font-weight: 700; font-size: 16px; color: #111827;">Club Andino Águila Azul</p>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Portal del socio</p>
          </div>
        </div>

        <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 8px;">
          Hola, ${nombre}
        </h2>
        <p style="color: #374151; margin-bottom: 24px; line-height: 1.6;">
          Solicitaste acceso a tu portal de socio. Haz clic en el siguiente botón para ingresar:
        </p>

        <a
          href="${magicUrl}"
          style="display: inline-block; padding: 14px 28px; background: #1e40af; color: white;
                 border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;"
        >
          Acceder al portal
        </a>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; line-height: 1.5;">
          Este enlace expira en <strong>15 minutos</strong>.<br>
          Si no solicitaste acceso, puedes ignorar este email con seguridad.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">
          Club Andino Águila Azul · Sistema de gestión de socios
        </p>
      </div>
    `,
  });
}
