SKYTRIPTRANSFER WEBSITE UI V1.3

Bu paket C:\Projects\SKYFLEET-AI\website klasorunun uzerine acilmak icindir.
Mevcut package.json ve node_modules klasorune dokunmaz.

Sayfalar:
  /                 Ana sayfa
  /transfer         Transfer talep sayfasi
  /supplier/join    Tedarikci basvuru sayfasi
  /supplier/        Mevcut tedarikci paneli

Bu surumde:
- Tedarikci basvuru formu gercek public supplier endpointine baglidir.
- Transfer formu gercek POST /api/public/transfer-requests endpointine baglidir.
- Basarili transfer taleplerinde STR ile baslayan talep numarasi gosterilir.
- Formlarda yukleniyor, dogrulama, hata ve basari durumlari bulunur.
