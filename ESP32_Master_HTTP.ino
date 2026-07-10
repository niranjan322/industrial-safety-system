#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>
#include <MFRC522.h>
#include <SPI.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

/* API CONFIGURATION */
const char* API_URL_SENSOR = "http://YOUR_SERVER_IP:5000/api/sensors/update";
const char* API_URL_RFID = "http://YOUR_SERVER_IP:5000/api/logs/rfid";

/* LCD */
LiquidCrystal_I2C lcd(0x27, 16, 2);

/* WIFI */
char ssid[] = "Smriky crush";
char pass[] = "niranjan222";

/* PINS */
#define TEMP_PIN 4
#define CAM_FIRE_PIN 14
#define SERVO_GATE 25
#define SERVO_CAMERA 26
#define SERVO_DOOR 33
#define RFID_SS 5
#define RFID_RST 27
#define BUZZER_PIN 13

/* OBJECTS */
Servo gateServo;
Servo camServo;
Servo doorServo;
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);
MFRC522 rfid(RFID_SS, RFID_RST);

/* DATA STRUCTURES */
typedef struct {
  int id;
  int gas;
  int flame;
} Data;

Data incoming;

typedef struct {
  int fire;
  int gas;
} Alert;

Alert alert;

/* WEARABLE MAC */
uint8_t wearable1[] = {0x1C, 0xDB, 0xD4, 0x3B, 0x28, 0x88};
uint8_t wearable2[] = {0x1C, 0xDB, 0xD4, 0x3B, 0x56, 0x64};

/* CAMERA SCAN */
int scanPos = 30;
int scanTarget = 150;
int SCAN_SPEED_DELAY = 20;
unsigned long lastScan = 0;
unsigned long lastScanMove = 0;

/* VARIABLES */
int slave1Gas = 0;
int slave2Gas = 0;
int slave1Flame = 0;
int slave2Flame = 0;

bool wifiConnected = false;
String allowedUID = "63 16 93 28";

unsigned long lastHttpTime = 0;
unsigned long timerDelay = 2000; // Send data every 2 seconds

/* RECEIVE DATA */
void onReceive(const esp_now_recv_info *info, const uint8_t *data, int len) {
  memcpy(&incoming, data, sizeof(incoming));
  if (incoming.id == 1) {
    slave1Gas = incoming.gas;
    slave1Flame = incoming.flame;
  }
  if (incoming.id == 2) {
    slave2Gas = incoming.gas;
    slave2Flame = incoming.flame;
  }
}

void setup() {
  Serial.begin(115200);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Industrial Safe");
  lcd.setCursor(0, 1);
  lcd.print("System Booting");

  delay(2000);
  lcd.clear();

  pinMode(CAM_FIRE_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  gateServo.attach(SERVO_GATE);
  camServo.attach(SERVO_CAMERA);
  doorServo.attach(SERVO_DOOR);

  gateServo.write(0);
  doorServo.write(0);

  SPI.begin();
  rfid.PCD_Init();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  Serial.print("Connecting WiFi");

  unsigned long wifiTimer = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiTimer < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi Connected");
  } else {
    Serial.println("\nOffline Mode");
  }

  esp_wifi_set_channel(11, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW Init Failed");
    return;
  }

  esp_now_register_recv_cb(onReceive);

  esp_now_peer_info_t peer1 = {};
  memcpy(peer1.peer_addr, wearable1, 6);
  peer1.channel = 11;
  peer1.encrypt = false;
  esp_now_add_peer(&peer1);

  esp_now_peer_info_t peer2 = {};
  memcpy(peer2.peer_addr, wearable2, 6);
  peer2.channel = 11;
  peer2.encrypt = false;
  esp_now_add_peer(&peer2);

  sensors.begin();
}

void loop() {
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);

  int camFire = digitalRead(CAM_FIRE_PIN);
  int fireDetected = 0;
  int gasDetected = 0;

  if (slave1Gas == 1 || slave2Gas == 1) gasDetected = 1;
  if (camFire == 1 && slave1Flame == 1 && slave2Flame == 1) fireDetected = 1;

  int currentGate = 0;
  if (fireDetected || gasDetected) {
    gateServo.write(90);
    currentGate = 90;
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    gateServo.write(0);
    currentGate = 0;
    digitalWrite(BUZZER_PIN, LOW);
  }

  /* SEND ALERT TO WEARABLE */
  alert.fire = fireDetected;
  alert.gas = gasDetected;
  esp_now_send(wearable1, (uint8_t*)&alert, sizeof(alert));
  esp_now_send(wearable2, (uint8_t*)&alert, sizeof(alert));

  lcd.setCursor(0, 0);
  lcd.print("Temp:");
  lcd.print(temp);
  lcd.print("C   ");
  lcd.setCursor(0, 1);

  if (fireDetected) lcd.print("FIRE ALERT     ");
  else if (gasDetected) lcd.print("GAS ALERT      ");
  else lcd.print("SYSTEM SAFE    ");

  /* SEND DATA TO API */
  if (wifiConnected && (millis() - lastHttpTime > timerDelay)) {
    HTTPClient http;
    http.begin(API_URL_SENSOR);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["temperature"] = temp;
    doc["gas1"] = slave1Gas;
    doc["gas2"] = slave2Gas;
    doc["flame1"] = slave1Flame;
    doc["flame2"] = slave2Flame;
    doc["gate"] = currentGate;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
    lastHttpTime = millis();
  }

  cameraScan();
  checkRFID();
  delay(50);
}

void cameraScan() {
  if (millis() - lastScan > 4000) {
    lastScan = millis();
    scanTarget = (scanTarget == 30) ? 150 : 30;
  }
  if (millis() - lastScanMove > SCAN_SPEED_DELAY) {
    lastScanMove = millis();
    if (scanPos < scanTarget) scanPos++;
    else if (scanPos > scanTarget) scanPos--;
    camServo.write(scanPos);
  }
}

void checkRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    uid += " ";
  }
  uid.toUpperCase();
  uid.trim();

  String status = "Denied";
  if (uid == allowedUID) {
    status = "Authorized";
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("RFID ACCESS");
    lcd.setCursor(0, 1);
    lcd.print("GRANTED");
    doorServo.write(90);
    delay(3000);
    doorServo.write(0);
    lcd.clear();
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("RFID ACCESS");
    lcd.setCursor(0, 1);
    lcd.print("DENIED");
    digitalWrite(BUZZER_PIN, HIGH);
    delay(1000);
    digitalWrite(BUZZER_PIN, LOW);
    lcd.clear();
  }

  /* SEND RFID LOG TO API */
  if (wifiConnected) {
    HTTPClient http;
    http.begin(API_URL_RFID);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["card_id"] = uid;
    doc["status"] = status;

    String requestBody;
    serializeJson(doc, requestBody);
    http.POST(requestBody);
    http.end();
  }

  rfid.PICC_HaltA();
}
