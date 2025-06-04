import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

const JuegoScreen = ({ navigation, route }) => {
  const [numeroSecreto, setNumeroSecreto] = useState("");
  const [intento, setIntento] = useState("");
  const [intentoActual, setIntentoActual] = useState(1);
  const [historial, setHistorial] = useState([]);
  const [resultado, setResultado] = useState("");
  const [jugador, setJugador] = useState("");
  const [ayudasRestantes, setAyudasRestantes] = useState(3);

  const MAX_INTENTOS = 10;

  useEffect(() => {
    const inicializar = async () => {
      const continuar = route.params?.continuar;
      const jugadorGuardado = await AsyncStorage.getItem("juego_jugador");
      setJugador(jugadorGuardado);

      if (continuar) {
        const numero = await AsyncStorage.getItem("juego_numero");
        const intentoN = await AsyncStorage.getItem("juego_intento");
        const histo = await AsyncStorage.getItem("juego_historial");
        const ayudas = await AsyncStorage.getItem("juego_ayudas");

        setNumeroSecreto(numero);
        setIntentoActual(parseInt(intentoN));
        setHistorial(histo ? JSON.parse(histo) : []);
        setAyudasRestantes(ayudas ? parseInt(ayudas) : 3);
      } else {
        const numero = await AsyncStorage.getItem("juego_numero");
        setNumeroSecreto(numero);
        await AsyncStorage.setItem("juego_ayudas", "3");
      }
    };
    inicializar();
  }, []);

  const evaluarIntento = (entrada) => {
    let bien = 0,
      regular = 0,
      mal = 0;

    for (let i = 0; i < 4; i++) {
      if (entrada[i] === numeroSecreto[i]) {
        bien++;
      } else if (numeroSecreto.includes(entrada[i])) {
        regular++;
      } else {
        mal++;
      }
    }

    return `${bien}B ${regular}R ${mal}M`;
  };

  const manejarVerificacion = async () => {
    if (intento.length !== 4 || !/^\d{4}$/.test(intento)) {
      Alert.alert("Error", "Ingresá un número válido de 4 cifras");
      return;
    }

    const resultado = evaluarIntento(intento);
    setResultado(resultado);

    const entrada = `Intento ${intentoActual}: ${intento} → ${resultado}`;
    const nuevoHistorial = [...historial, entrada];
    setHistorial(nuevoHistorial);

    await AsyncStorage.setItem(
      "juego_historial",
      JSON.stringify(nuevoHistorial)
    );
    await AsyncStorage.setItem("juego_intento", `${intentoActual + 1}`);

    if (resultado.startsWith("4B")) {
      finalizarPartida(true);
    } else if (intentoActual >= MAX_INTENTOS) {
      finalizarPartida(false);
    } else {
      setIntentoActual((prev) => prev + 1);
      setIntento("");
    }
  };

  const finalizarPartida = async (gano) => {
    const listaJson = await AsyncStorage.getItem("jugadores");
    const lista = listaJson ? JSON.parse(listaJson) : [];

    const actualizada = lista.map((j) =>
      j.nombre === jugador
        ? {
            ...j,
            ganadas: j.ganadas + (gano ? 1 : 0),
            perdidas: j.perdidas + (gano ? 0 : 1),
          }
        : j
    );
    await AsyncStorage.setItem("jugadores", JSON.stringify(actualizada));

    await AsyncStorage.multiRemove([
      "juego_jugador",
      "juego_numero",
      "juego_intento",
      "juego_historial",
      "juego_enCurso",
      "juego_ayudas",
    ]);

    Alert.alert(
      gano ? "¡Ganaste!" : "Perdiste",
      gano ? "Adivinaste el número" : `El número era: ${numeroSecreto}`,
      [
        {
          text: "Volver al inicio",
          onPress: () => navigation.replace("Inicio"),
        },
        {
          text: "Jugar otra vez",
          onPress: () => navigation.replace("Juego"),
        },
      ]
    );
  };

  const pedirAyuda = () => {
    if (ayudasRestantes <= 0) {
      Alert.alert("Sin ayudas", "Ya usaste tus 3 ayudas");
      return;
    }

    if (intento.length !== 4) {
      Alert.alert("Ayuda", "Ingresá un número antes de pedir ayuda");
      return;
    }

    Alert.alert("Usar ayuda", "¿Querés una pista sobre tu intento actual?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sí",
        onPress: async () => {
          let pistas = "";
          for (let i = 0; i < 4; i++) {
            pistas +=
              intento[i] === numeroSecreto[i]
                ? `✔️ Posición ${i + 1} es correcta\n`
                : `❌ Posición ${i + 1} es incorrecta\n`;
          }
          const nueva = ayudasRestantes - 1;
          setAyudasRestantes(nueva);
          await AsyncStorage.setItem("juego_ayudas", `${nueva}`);
          Alert.alert("Ayuda", `${pistas}\nAyudas restantes: ${nueva}`);
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Jugador: {jugador}</Text>
      <Text style={styles.intento}>
        Intento {intentoActual} de {MAX_INTENTOS}
      </Text>

      <TextInput
        placeholder="Ingresá un número de 4 cifras"
        value={intento}
        onChangeText={setIntento}
        keyboardType="numeric"
        maxLength={4}
        style={styles.input}
      />

      <Button title="Verificar" onPress={manejarVerificacion} />

      <Text style={styles.resultado}>{resultado}</Text>

      <Button title="🆘 Pedir ayuda" onPress={pedirAyuda} />

      <Text style={styles.subheader}>Historial:</Text>
      {historial.map((linea, i) => (
        <Text key={i} style={styles.historial}>
          {linea}
        </Text>
      ))}

      <Button
        title="🔁 Reiniciar"
        onPress={() => navigation.replace("Juego")}
      />
      <Button title="🛑 Finalizar" onPress={() => finalizarPartida(false)} />
      <Button
        title="🔙 Volver al menú"
        onPress={() => navigation.replace("Inicio")}
      />
    </ScrollView>
  );
};

export default JuegoScreen;

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  intento: { marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    fontSize: 18,
    marginBottom: 10,
    borderRadius: 5,
    borderColor: "#aaa",
  },
  resultado: { marginTop: 10, marginBottom: 20, fontSize: 16 },
  subheader: { fontWeight: "bold", marginTop: 20 },
  historial: { marginVertical: 2 },
});
