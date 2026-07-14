# Kết nối đầu đọc RFID Arduino với trạm OCR (Gate Control)

Luồng hoàn chỉnh khi quẹt thẻ trên phần cứng:

```
[Thẻ RFID] → [MFRC522 + ESP32/ESP8266]
                │  HTTP POST /api/iot/rfid-tap  { rfidUid, gateId, direction }
                ▼
        [Backend Node (server.js)]
                │  SSE /api/iot/rfid-events (đẩy tức thì)
                ▼
        [Trang Gate Control của Staff]
                │  tự chạy pipeline như quẹt tay:
                │  1. POST /api/rfid-scans        (tạo bản ghi "Scanned")
                │  2. Chụp ảnh webcam             (camera đang bật)
                │  3. PaddleOCR đọc biển số       (ocr-service :8868)
                │  4. PATCH /api/rfid-scans/:id   (lưu ảnh + biển số + hash, link xe)
                ▼
        [SQL Server — dbo.rfid_scans]
```

Trạm OCR nhận **mọi** lượt quẹt do backend phát — chỉ cần trang Gate Control
đang mở và camera đã bật là toàn bộ diễn ra không cần chạm tay. `gateId` /
`direction` do thiết bị gửi sẽ được ghi vào bản ghi quét (thiết bị gắn ở cổng
nào thì khai báo cổng đó trong firmware).

## Phần cứng

| Linh kiện | Ghi chú |
|---|---|
| ESP32 (khuyên dùng) hoặc ESP8266/NodeMCU | Có WiFi sẵn — Arduino Uno cần thêm shield Ethernet/WiFi |
| Đầu đọc RFID MFRC522 (13.56MHz) | Đi kèm thẻ/tag MIFARE |
| Dây nối | SPI |

Nối MFRC522 ↔ ESP32 (SPI mặc định):

| MFRC522 | ESP32 |
|---|---|
| SDA (SS) | GPIO 5 |
| SCK | GPIO 18 |
| MOSI | GPIO 23 |
| MISO | GPIO 19 |
| RST | GPIO 27 |
| 3.3V / GND | 3.3V / GND |

## Firmware (Arduino IDE — cài thư viện `MFRC522` của GithubCommunity)

```cpp
#include <WiFi.h>          // ESP8266: #include <ESP8266WiFi.h> + ESP8266HTTPClient.h
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// ── Cấu hình ──────────────────────────────────────────────────────────────
const char* WIFI_SSID = "TEN_WIFI";
const char* WIFI_PASS = "MAT_KHAU_WIFI";
// IP máy chạy backend Node (server.js) trong cùng mạng LAN, port 4000
const char* API_URL   = "http://192.168.1.10:4000/api/iot/rfid-tap";
const char* GATE_ID   = "A1";      // Cổng thiết bị này phụ trách
const char* DIRECTION = "entry";   // "entry" (xe vào) hoặc "exit" (xe ra)

#define SS_PIN  5
#define RST_PIN 27
MFRC522 rfid(SS_PIN, RST_PIN);

String lastUid = "";
unsigned long lastTapMs = 0;

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Dang ket noi WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\nWiFi OK, IP: " + WiFi.localIP().toString());
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  // UID dạng hex hoa, ví dụ "04A2B1C3"
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  // Chống dội: bỏ qua nếu cùng thẻ quẹt lại trong vòng 3 giây
  if (uid == lastUid && millis() - lastTapMs < 3000) {
    rfid.PICC_HaltA();
    return;
  }
  lastUid = uid;
  lastTapMs = millis();

  Serial.println("The: " + uid + " → gui backend...");
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");
    String body = String("{\"rfidUid\":\"") + uid +
                  "\",\"gateId\":\"" + GATE_ID +
                  "\",\"direction\":\"" + DIRECTION + "\"}";
    int code = http.POST(body);
    Serial.printf("HTTP %d: %s\n", code, http.getString().c_str());
    http.end();
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
```

## Kiểm tra không cần phần cứng

Giả lập một lượt quẹt bằng curl (backend đang chạy):

```bash
curl -X POST http://localhost:4000/api/iot/rfid-tap \
  -H "Content-Type: application/json" \
  -d '{"rfidUid":"04A2B1C3","gateId":"A1","direction":"entry"}'
```

Mở trang Staff → Điều khiển cổng, bật camera, chạy lệnh trên — ô UID tự điền,
hệ thống tự chụp ảnh, PaddleOCR đọc biển số và lưu vào `dbo.rfid_scans` kèm
ghi chú "📡 Thẻ quét từ đầu đọc IoT".

## Lưu ý vận hành

- Backend lắng nghe trên `0.0.0.0:4000` nên ESP32 trong cùng LAN gọi thẳng
  bằng IP máy chủ; nếu backend chạy qua ngrok, dùng URL ngrok (https) thay IP.
- Camera và PaddleOCR chạy trên máy của staff đang mở Gate Control — thiết bị
  Arduino chỉ cần gửi UID, không đụng gì đến ảnh.
- Hai thẻ quẹt sát nhau: lượt sau bị bỏ qua nếu lượt trước đang xử lý
  (firmware cũng đã chống dội 3 giây cho cùng một thẻ).
