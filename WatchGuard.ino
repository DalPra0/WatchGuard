// ESP32 - Leitor de Código Morse Físico

// --- Pinos ---
const int BUTTON_PIN = 4;  // Pino onde o botão está ligado
const int BUZZER_PIN = 2;

// --- Configurações de Tempo para o Morse ---
const unsigned long DOT_DASH_THRESHOLD = 300; // ms - Duração que separa um ponto de um traço
const unsigned long SEQUENCE_TIMEOUT = 2000;  // ms - Tempo de inatividade para enviar a sequência

// --- Variáveis Globais ---
String morseSequence = "";
unsigned long buttonPressTime = 0;
unsigned long lastButtonEventTime = 0;
bool buttonIsPressed = false;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP); // Usa o resistor interno. O botão liga o pino ao GND.
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("Leitor de Codigo Morse: Online.");
}

void loop() {
  // --- LÓGICA DE LEITURA DO CÓDIGO MORSE ---
  bool currentButtonState = (digitalRead(BUTTON_PIN) == LOW); // Pressionado é LOW

  // Detecta a borda de subida (quando o botão é pressionado)
  if (currentButtonState && !buttonIsPressed) {
    buttonPressTime = millis();
    buttonIsPressed = true;
  }
  
  // Detecta a borda de descida (quando o botão é solto)
  if (!currentButtonState && buttonIsPressed) {
    unsigned long pressDuration = millis() - buttonPressTime;
    if (pressDuration < DOT_DASH_THRESHOLD) {
      morseSequence += ".";
    } else {
      morseSequence += "-";
    }
    // Feedback sonoro para cada toque
    digitalWrite(BUZZER_PIN, HIGH);
    delay(20);
    digitalWrite(BUZZER_PIN, LOW);

    lastButtonEventTime = millis();
    buttonIsPressed = false;
  }

  // Verifica se o tempo de espera para enviar a sequência foi atingido
  if (morseSequence.length() > 0 && !buttonIsPressed && (millis() - lastButtonEventTime > SEQUENCE_TIMEOUT)) {
    // Envia a sequência completa para o PC
    Serial.println("MORSE:" + morseSequence);
    morseSequence = ""; // Limpa a sequência para a próxima tentativa
  }

  // --- ESCUTA POR COMANDOS DO PC ---
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command == "BUZZ_ALARM") { // Comando de alarme de movimento
      digitalWrite(BUZZER_PIN, HIGH);
      delay(1000);
      digitalWrite(BUZZER_PIN, LOW);
    }
    if (command == "BUZZ_SUCCESS") { // Feedback de senha correta
      digitalWrite(BUZZER_PIN, HIGH); delay(50); digitalWrite(BUZZER_PIN, LOW);
      delay(50);
      digitalWrite(BUZZER_PIN, HIGH); delay(50); digitalWrite(BUZZER_PIN, LOW);
    }
     if (command == "BUZZ_FAIL") { // Feedback de senha incorreta
      digitalWrite(BUZZER_PIN, HIGH); delay(500); digitalWrite(BUZZER_PIN, LOW);
    }
  }
}
