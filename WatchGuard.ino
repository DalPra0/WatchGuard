#include <SPI.h>
#include <SD.h>
#include "FS.h"
#include <ArduinoJson.h>

const int BUTTON_PIN = 4;
const int BUZZER_PIN = 2;
const int SD_CS_PIN  = 5;

const unsigned long DOT_DASH_THRESHOLD = 300;
const unsigned long SEQUENCE_TIMEOUT = 2000;
const char* LOG_FILE = "/logs.json";

String morseSequence = "";
unsigned long buttonPressTime = 0;
unsigned long lastButtonEventTime = 0;
bool buttonIsPressed = false;


void addLog(String logJsonString) {
    File file = SD.open(LOG_FILE, FILE_READ);
    JsonDocument doc;
    JsonArray logs;

    if (file && file.size() > 2) {
        DeserializationError error = deserializeJson(doc, file);
        if (error) {
            Serial.println("Falha ao ler o ficheiro de logs, a começar um novo.");
            logs = doc.to<JsonArray>();
        } else {
            logs = doc.as<JsonArray>();
        }
    } else {
        logs = doc.to<JsonArray>();
    }
    file.close();

    JsonDocument newLogDoc;
    deserializeJson(newLogDoc, logJsonString);
    if (!newLogDoc.isNull()) {
        logs.add(newLogDoc.as<JsonObject>());
    }
    
    while (logs.size() > 200) {
        logs.remove(0);
    }

    file = SD.open(LOG_FILE, FILE_WRITE);
    if (!file) {
        Serial.println("Falha ao abrir o ficheiro de logs para escrita");
        return;
    }
    if (serializeJson(doc, file) == 0) {
        Serial.println("Falha ao escrever no ficheiro de logs");
    } else {
        Serial.println("Log guardado no cartão SD.");
    }
    file.close();
}


void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  
  SPI.begin();

  if (!SD.begin(SD_CS_PIN)) {
    Serial.println("FALHA NA INICIALIZAÇÃO DO CARTÃO SD! Verifique a fiação e o cartão.");
    while (1); 
  }
  Serial.println("Cartão SD inicializado.");

  long timestamp = millis();
  addLog("{\"type\":\"System\", \"details\":\"Sistema reiniciado.\", \"timestamp\":" + String(timestamp) + "}");
  Serial.println("Leitor de Codigo Morse: Online.");
}


void loop() {
  bool currentButtonState = (digitalRead(BUTTON_PIN) == LOW);
  if (currentButtonState && !buttonIsPressed) {
    buttonPressTime = millis();
    buttonIsPressed = true;
  }
  if (!currentButtonState && buttonIsPressed) {
    unsigned long pressDuration = millis() - buttonPressTime;
    morseSequence += (pressDuration < DOT_DASH_THRESHOLD) ? "." : "-";
    digitalWrite(BUZZER_PIN, HIGH); delay(20); digitalWrite(BUZZER_PIN, LOW);
    lastButtonEventTime = millis();
    buttonIsPressed = false;
  }
  if (morseSequence.length() > 0 && !buttonIsPressed && (millis() - lastButtonEventTime > SEQUENCE_TIMEOUT)) {
    Serial.println("MORSE:" + morseSequence);
    morseSequence = "";
  }

  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "GET_LOGS") {
        File file = SD.open(LOG_FILE, FILE_READ);
        if(file && file.size() > 0){
            while(file.available()){
                Serial.write(file.read());
            }
        } else {
            Serial.print("[]");
        }
        file.close();
        Serial.println();
    } else if (command.startsWith("LOG:")) {
        String logDetails = command.substring(4);
        addLog(logDetails);
    } else if (command == "BUZZ_ALARM") {
      digitalWrite(BUZZER_PIN, HIGH); delay(1000); digitalWrite(BUZZER_PIN, LOW);
    } else if (command == "BUZZ_SUCCESS") {
      digitalWrite(BUZZER_PIN, HIGH); delay(50); digitalWrite(BUZZER_PIN, LOW); delay(50);
      digitalWrite(BUZZER_PIN, HIGH); delay(50); digitalWrite(BUZZER_PIN, LOW);
    } else if (command == "BUZZ_FAIL") {
      digitalWrite(BUZZER_PIN, HIGH); delay(500); digitalWrite(BUZZER_PIN, LOW);
    }
  }
}
