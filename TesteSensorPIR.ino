#define PIR_PIN 13

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
}

void loop() {
  int movimento = digitalRead(PIR_PIN);
  if (movimento == HIGH) {
    Serial.println("Movimento detectado!");
  } else {
    Serial.println("Nenhum movimento.");
  }
  delay(500);
}
