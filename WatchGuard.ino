// ESP32 Super Server: Web, RFID, Buzzer & Logs

// --- Bibliotecas ---
#include <WiFi.h>
#include <WebServer.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include "SPIFFS.h" // Adicionada para servir ficheiros

// --- Pinos ---
#define SS_PIN    15  // SDA (CS) do RFID
#define RST_PIN   16  // RST do RFID
#define BUZZER_PIN 2
// SCK: 14, MOSI: 13, MISO: 12 (padrão SPI)

// --- Configurações ---
const char* ssid = "NOME_DA_SUA_REDE_WIFI";
const char* password = "SENHA_DA_SUA_REDE_WIFI";
String authorizedUID = "XX XX XX XX"; // IMPORTANTE: SUBSTITUA PELO UID DO SEU CARTÃO

// --- Globais ---
WebServer server(80);
MFRC522 mfrc522(SS_PIN, RST_PIN);
bool sistemaArmado = true; // Começa armado por padrão

JsonDocument logDoc;
JsonArray logs = logDoc.to<JsonArray>();

// --- Funções Auxiliares ---
void addLog(String type, String details) {
  JsonObject logEntry = logs.add<JsonObject>();
  logEntry["type"] = type;
  logEntry["details"] = details;
  logEntry["timestamp"] = millis(); // Simples timestamp

  // Limita o número de logs para não esgotar a memória
  if (logs.size() > 50) {
    logs.remove(0);
  }
  Serial.print("Log adicionado: ");
  Serial.println(details);
}

String getContentType(String filename) {
  if (filename.endsWith(".html")) return "text/html";
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".png")) return "image/png";
  else if (filename.endsWith(".jpg")) return "image/jpeg";
  return "text/plain";
}

bool handleFileRead(String path) {
  Serial.println("Pedido do navegador para: " + path);
  if (path.endsWith("/")) {
    path += "primeira.html"; // Ficheiro padrão a ser servido na raiz
  }
  String contentType = getContentType(path);
  if (SPIFFS.exists(path)) {
    File file = SPIFFS.open(path, "r");
    server.streamFile(file, contentType);
    file.close();
    Serial.println("Ficheiro " + path + " servido com sucesso.");
    return true;
  }
  Serial.println("Erro: Ficheiro " + path + " não encontrado no SPIFFS.");
  return false;
}

// --- Funções de Controlo ---
void handleRFID() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += (mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ") + String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  uid.trim();

  if (uid == authorizedUID) {
    sistemaArmado = !sistemaArmado; // Inverte o estado
    String status = sistemaArmado ? "ARMADO" : "DESARMADO";
    addLog("RFID", "Sistema " + status + " pelo cartao " + uid);
    
    // Feedback sonoro: um apito para desarmado, dois para armado
    digitalWrite(BUZZER_PIN, HIGH);
    delay(50);
    digitalWrite(BUZZER_PIN, LOW);
    if(sistemaArmado) {
      delay(100);
      digitalWrite(BUZZER_PIN, HIGH);
      delay(50);
      digitalWrite(BUZZER_PIN, LOW);
    }
  } else {
    addLog("RFID", "Tentativa de acesso negada: " + uid);
    // Feedback sonoro para acesso negado (3 apitos curtos)
    for(int i=0; i<3; i++) {
      digitalWrite(BUZZER_PIN, HIGH); delay(75); digitalWrite(BUZZER_PIN, LOW); delay(75);
    }
  }

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

// --- Endpoints do Servidor Web ---
void setupServerEndpoints() {
  // Endpoint para o Python saber o estado
  server.on("/status", HTTP_GET, []() {
    JsonDocument doc;
    doc["armed"] = sistemaArmado;
    String output;
    serializeJson(doc, output);
    server.send(200, "application/json", output);
  });

  // Endpoint para o Python acionar o buzzer
  server.on("/buzz", HTTP_GET, []() {
    digitalWrite(BUZZER_PIN, HIGH); delay(1000); digitalWrite(BUZZER_PIN, LOW);
    server.send(200, "text/plain", "Buzz OK");
  });

  // Endpoint para o Python registar uma deteção
  server.on("/log-detection", HTTP_GET, []() {
    addLog("Camera", "Movimento detectado");
    server.send(200, "text/plain", "Log OK");
  });

  // Endpoint para a interface web obter os logs
  server.on("/logs", HTTP_GET, []() {
    String output;
    serializeJson(logs, output);
    server.send(200, "application/json", output);
  });
  
  // Rota genérica "apanha-tudo" para servir os ficheiros do SPIFFS
  server.onNotFound([]() {
    if (!handleFileRead(server.uri())) {
      server.send(404, "text/plain", "404: Ficheiro Nao Encontrado");
    }
  });

  server.begin();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  SPI.begin();
  mfrc522.PCD_Init();

  if (!SPIFFS.begin(true)) {
    Serial.println("Erro fatal ao montar o sistema de ficheiros SPIFFS");
    return;
  }

  WiFi.begin(ssid, password);
  Serial.print("A conectar ao WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nConectado!");
  Serial.print("IP do ESP32: http://");
  Serial.println(WiFi.localIP());

  setupServerEndpoints();
  addLog("System", "Sistema iniciado. Estado: " + String(sistemaArmado ? "ARMADO" : "DESARMADO"));
}

void loop() {
  server.handleClient(); // Processa pedidos web
  handleRFID();          // Verifica se há um novo cartão
}
