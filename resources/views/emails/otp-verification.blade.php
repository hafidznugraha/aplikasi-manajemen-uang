<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi BudgetKu</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 40px 0;
    }
    .main-table {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 520px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .otp-box {
      background-color: #f1f5f9;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #0d6efd;
      margin: 0;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" align="center" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <h1>BudgetKu</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Aplikasi Manajemen Keuangan Cerdas</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <p style="font-size: 16px; margin: 0 0 16px 0; color: #1e293b;">
            Halo, <strong>{{ $name }}</strong>!
          </p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #64748b;">
            Terima kasih telah mendaftar di BudgetKu. Silakan gunakan kode OTP di bawah ini untuk menyelesaikan pendaftaran akun Anda:
          </p>

          <div class="otp-box">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 8px 0; font-weight: 600;">Kode Verifikasi OTP Anda</p>
            <div class="otp-code">{{ $otp }}</div>
            <p style="font-size: 12px; color: #ef4444; margin: 10px 0 0 0; font-weight: 500;">
              ⏱️ Berlaku selama 10 menit
            </p>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0;">
            Demi keamanan akun Anda, <strong>jangan bagikan kode ini kepada siapa pun</strong>. Jika Anda tidak merasa melakukan pendaftaran ini, abaikan email ini.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; {{ date('Y') }} BudgetKu. Hak cipta dilindungi undang-undang.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
