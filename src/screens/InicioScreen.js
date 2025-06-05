import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Button,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const InicioScreen = () => {
  const [jugadores, setJugadores] = useState([]);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [jugadorActual, setJugadorActual] = useState(null);
  const [permitirRepetidos, setPermitirRepetidos] = useState(false);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [jugadorConPartida, setJugadorConPartida] = useState(null);

  useEffect(() => {
    if (isFocused) {
      cargarJugadores();
    }
  }, [isFocused]);

  const cargarJugadores = async () => {
    try {
      const data = await AsyncStorage.getItem("jugadores");
      const parsed = data ? JSON.parse(data) : [];
      setJugadores(parsed);

      const actual = await AsyncStorage.getItem("juego_jugador");
      const enCurso = await AsyncStorage.getItem("juego_enCurso");

      const jugadorExiste = parsed.some((j) => j.nombre === actual);

      if (enCurso === "true" && jugadorExiste) {
        setJugadorConPartida(actual);
        setJugadorActual(actual);
      } else {
        await AsyncStorage.multiRemove([
          "juego_jugador",
          "juego_numero",
          "juego_intento",
          "juego_historial",
          "juego_enCurso",
          "juego_ayudas",
          "juego_reiniciado",
          "juego_repetidos",
        ]);

        setJugadorConPartida(null);
        setJugadorActual(null);
      }

      const repetidos = await AsyncStorage.getItem("config_repetidos");
      if (repetidos !== null) {
        setPermitirRepetidos(repetidos === "true");
      }
    } catch (error) {
      console.error("Error al cargar jugadores", error);
    }
  };

  const guardarJugadores = async (lista) => {
    try {
      await AsyncStorage.setItem("jugadores", JSON.stringify(lista));
    } catch (error) {
      console.error("Error al guardar jugadores", error);
    }
  };

  const crearJugador = () => {
    if (nombreNuevo.trim() === "") return;

    if (nombreNuevo.length > 15) {
      Alert.alert("Nombre muy largo", "Máximo 15 caracteres.");
      return;
    }

    if (
      jugadores.find(
        (j) => j.nombre.toLowerCase() === nombreNuevo.toLowerCase()
      )
    ) {
      Alert.alert("Nombre repetido", "Ese jugador ya existe.");
      return;
    }

    if (jugadores.length >= 3) {
      Alert.alert(
        "Máximo alcanzado",
        "Solo se permiten 3 jugadores.\nPara eliminar uno, mantené presionado sobre su nombre."
      );
      return;
    }

    const nuevo = { nombre: nombreNuevo, ganadas: 0, perdidas: 0 };
    const listaActualizada = [...jugadores, nuevo];
    setJugadores(listaActualizada);
    guardarJugadores(listaActualizada);
    setNombreNuevo("");
  };

  const seleccionarJugador = (nombre) => {
    setJugadorActual(nombre);
    AsyncStorage.setItem("juego_jugador", nombre);
  };

  const iniciarNuevaPartida = async () => {
    if (!jugadorActual) {
      Alert.alert("Seleccioná un jugador");
      return;
    }

    const numeroSecreto = generarNumeroSecreto(permitirRepetidos);
    await AsyncStorage.multiSet([
      ["juego_jugador", jugadorActual],
      ["juego_numero", numeroSecreto],
      ["juego_intento", "1"],
      ["juego_enCurso", "true"],
      ["juego_repetidos", permitirRepetidos.toString()],
      ["juego_historial", JSON.stringify([])],
      ["juego_ayudas", "3"],
    ]);

    navigation.navigate("Juego");
  };

  const continuarPartida = async () => {
    const enCurso = await AsyncStorage.getItem("juego_enCurso");
    const activo = await AsyncStorage.getItem("juego_jugador");

    if (enCurso === "true" && activo === jugadorActual) {
      navigation.navigate("Juego", { continuar: true });
    } else {
      Alert.alert("No hay partida activa para este jugador");
    }
  };

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <FlatList
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Bienvenido</Text>

            {/* Crear jugador */}
            <TextInput
              placeholder="Nombre del nuevo jugador"
              value={nombreNuevo}
              onChangeText={setNombreNuevo}
              style={styles.input}
              maxLength={15}
            />
            <Button
              title="Crear Jugador"
              onPress={crearJugador}
              disabled={
                nombreNuevo.trim() === "" ||
                jugadores.some(
                  (j) =>
                    j.nombre.toLowerCase() === nombreNuevo.trim().toLowerCase()
                )
              }
            />

            <Text style={styles.subtitulo}>Jugadores registrados:</Text>
          </>
        }
        data={jugadores}
        keyExtractor={(item) => item.nombre}
        contentContainerStyle={styles.scroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => {
              Alert.alert(
                "Eliminar jugador",
                `¿Querés eliminar a ${item.nombre}?`,
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                      const nuevaLista = jugadores.filter(
                        (j) => j.nombre !== item.nombre
                      );
                      setJugadores(nuevaLista);
                      guardarJugadores(nuevaLista);
                      if (item.nombre === jugadorActual) {
                        setJugadorActual(null);
                        setJugadorConPartida(null);
                        await AsyncStorage.multiRemove([
                          "juego_jugador",
                          "juego_numero",
                          "juego_intento",
                          "juego_historial",
                          "juego_enCurso",
                          "juego_ayudas",
                          "juego_reiniciado",
                          "juego_repetidos",
                        ]);
                      }
                    },
                  },
                ]
              );
            }}
            onPress={() => seleccionarJugador(item.nombre)}
          >
            <Text
              style={[
                styles.jugador,
                item.nombre === jugadorActual && styles.jugadorSeleccionado,
              ]}
            >
              {item.nombre} -{" "}
              <Text style={styles.statGanadas}>Ganadas: {item.ganadas}</Text> |{" "}
              <Text style={styles.statPerdidas}>Perdidas: {item.perdidas}</Text>
              {item.nombre === jugadorConPartida && " 🟢 En partida"}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <>
            {/* Configuración */}
            <View style={styles.switchContainer}>
              <Text>¿Permitir dígitos repetidos?</Text>

              <Switch
                value={permitirRepetidos}
                onValueChange={(valor) => {
                  setPermitirRepetidos(valor);
                  AsyncStorage.setItem("config_repetidos", valor.toString());
                }}
              />
            </View>

            {/* Botones */}
            <View style={styles.botones}>
              <Button title="▶️ Nueva Partida" onPress={iniciarNuevaPartida} />
              <View style={{ marginVertical: 8 }} />
              <Button
                title="⏯ Continuar Partida"
                onPress={continuarPartida}
                color="#007BFF"
                disabled={jugadorActual !== jugadorConPartida}
              />
            </View>
            <View style={{ marginVertical: 8 }} />
            <Button
              title="🚪 Salir del juego"
              onPress={() =>
                Alert.alert("¿Salir?", "¿Querés cerrar la aplicación?", [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Salir",
                    style: "destructive",
                    onPress: () => BackHandler.exitApp(),
                  },
                ])
              }
              color="#dc3545"
            />
          </>
        }
      />
    </SafeAreaView>
  );
};

export default InicioScreen;

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  jugador: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    textAlign: "center",
  },
  jugadorSeleccionado: {
    backgroundColor: "#cce5ff",
  },
  statGanadas: {
    color: "green",
    fontWeight: "bold",
  },
  statPerdidas: {
    color: "red",
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  botones: {
    marginTop: 20,
  },
});
