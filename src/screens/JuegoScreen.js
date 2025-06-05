import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const JuegoScreen = ({ navigation, route }) => {
  const [numeroSecreto, setNumeroSecreto] = useState("");
  const [intento, setIntento] = useState("");
  const [intentoActual, setIntentoActual] = useState(1);
  const [historial, setHistorial] = useState([]);
  const [resultado, setResultado] = useState("");
  const [jugador, setJugador] = useState("");
  const [ayudasRestantes, setAyudasRestantes] = useState(3);
  const [reinicioUsado, setReinicioUsado] = useState(false);
  const [mostrarRepetidos, setMostrarRepetidos] = useState(false);

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
        const repetidosStr = await AsyncStorage.getItem("juego_repetidos");
        setMostrarRepetidos(repetidosStr === "true");

        setNumeroSecreto(numero);
        setIntentoActual(parseInt(intentoN));
        setHistorial(histo ? JSON.parse(histo) : []);
        setAyudasRestantes(ayudas ? parseInt(ayudas) : 3);
      } else {
        const numero = await AsyncStorage.getItem("juego_numero");
        setNumeroSecreto(numero);
        await AsyncStorage.setItem("juego_ayudas", "3");
      }

      const reiniciado = await AsyncStorage.getItem("juego_reiniciado");
      setReinicioUsado(reiniciado === "true");
    };

    inicializar();
  }, []);

  const generarNumeroSecreto = (permitirRepetidos) => {
    let numeros = [];
    while (numeros.length < 4) {
      const n = Math.floor(Math.random() * 10);
      if (permitirRepetidos || !numeros.includes(n)) {
        numeros.push(n);
      }
    }
    return numeros.join("");
  };

  const evaluarIntento = (entrada) => {
    let bien = 0,
      regular = 0,
      mal = 0;
    for (let i = 0; i < 4; i++) {
      if (entrada[i] === numeroSecreto[i]) bien++;
      else if (numeroSecreto.includes(entrada[i])) regular++;
      else mal++;
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

    if (resultado.startsWith("4B")) finalizarPartida(true);
    else if (intentoActual >= MAX_INTENTOS) finalizarPartida(false);
    else {
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
      "juego_reiniciado",
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
          onPress: async () => {
            await iniciarPartidaNueva();
          },
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
      { text: "Cancelar", style: "cancel" },
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

  const reiniciarPartida = () => {
    Alert.alert(
      "¿Reiniciar partida?",
      "Solo se puede reiniciar una vez por juego. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, reiniciar",
          style: "destructive",
          onPress: async () => {
            const repetidosStr = await AsyncStorage.getItem("juego_repetidos");
            const permitirRepetidos = repetidosStr === "true";

            const nuevoNumero = generarNumeroSecreto(permitirRepetidos);

            await AsyncStorage.multiSet([
              ["juego_numero", nuevoNumero],
              ["juego_intento", "1"],
              ["juego_historial", JSON.stringify([])],
              ["juego_enCurso", "true"],
              ["juego_ayudas", "3"],
              ["juego_reiniciado", "true"],
            ]);

            setNumeroSecreto(nuevoNumero);
            setIntentoActual(1);
            setHistorial([]);
            setAyudasRestantes(3);
            setIntento("");
            setResultado("");
            setReinicioUsado(true);

            Alert.alert("Partida reiniciada", "Solo podés reiniciar una vez.");
          },
        },
      ]
    );
  };

  const iniciarPartidaNueva = async () => {
    const repetidosStr = await AsyncStorage.getItem("juego_repetidos");
    const permitirRepetidos = repetidosStr === "true";

    const nuevoNumero = generarNumeroSecreto(permitirRepetidos);

    await AsyncStorage.multiSet([
      ["juego_numero", nuevoNumero],
      ["juego_intento", "1"],
      ["juego_historial", JSON.stringify([])],
      ["juego_enCurso", "true"],
      ["juego_ayudas", "3"],
      ["juego_reiniciado", "false"],
    ]);

    setNumeroSecreto(nuevoNumero);
    setIntentoActual(1);
    setHistorial([]);
    setAyudasRestantes(3);
    setIntento("");
    setResultado("");
    setReinicioUsado(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>🎮 Jugador: {jugador}</Text>
        <Text style={styles.intento}>
          🔢 Intento {intentoActual} de {MAX_INTENTOS}
        </Text>

        <TextInput
          placeholder="Ingresá un número de 4 cifras"
          value={intento}
          onChangeText={setIntento}
          keyboardType="numeric"
          maxLength={4}
          style={styles.input}
        />

        <View style={styles.boton}>
          <Button
            title="✅ Verificar"
            onPress={manejarVerificacion}
            color="#007BFF"
          />
        </View>

        <View style={styles.boton}>
          <Button title="🆘 Pedir ayuda" onPress={pedirAyuda} color="#FFA500" />
        </View>

        {resultado !== "" && (
          <Text style={styles.resultado}>
            📊 <Text style={styles.verde}>{resultado.split(" ")[0]}</Text>{" "}
            <Text style={styles.naranja}>{resultado.split(" ")[1]}</Text>{" "}
            <Text style={styles.rojo}>{resultado.split(" ")[2]}</Text>
          </Text>
        )}

        <Text style={styles.subheader}>📜 Historial:</Text>
        {historial.map((linea, i) => {
          const partes = linea.split("→");
          const texto = partes[0].trim();
          const resultado = partes[1]?.trim().split(" ") || [];

          return (
            <Text key={i} style={styles.historial}>
              {texto} → <Text style={styles.verde}>{resultado[0]}</Text>{" "}
              <Text style={styles.naranja}>{resultado[1]}</Text>{" "}
              <Text style={styles.rojo}>{resultado[2]}</Text>
            </Text>
          );
        })}

        <View style={styles.boton}>
          <Button
            title="🔁 Reiniciar"
            onPress={reiniciarPartida}
            disabled={reinicioUsado}
          />
        </View>
        <View style={styles.boton}>
          <Button
            title="🛑 Finalizar"
            onPress={() => finalizarPartida(false)}
            color="#dc3545"
          />
        </View>
        <View style={styles.boton}>
          <Button
            title="🔙 Volver al menú"
            onPress={() => navigation.replace("Inicio")}
            color="#28a745"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JuegoScreen;

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  intento: { marginBottom: 10, fontSize: 16, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 5,
    padding: 12,
    fontSize: 18,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  resultado: {
    fontSize: 18,
    marginVertical: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  subheader: {
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
    fontSize: 16,
  },
  historial: {
    fontFamily: "monospace",
    marginVertical: 4,
    backgroundColor: "#e6e6e6",
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  boton: {
    marginVertical: 8,
  },
  verde: {
    color: "green",
    fontWeight: "bold",
  },
  naranja: {
    color: "orange",
    fontWeight: "bold",
  },
  rojo: {
    color: "red",
    fontWeight: "bold",
  },
});
