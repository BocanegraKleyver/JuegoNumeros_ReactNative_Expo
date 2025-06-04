import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const InicioScreen = () => {
  const [jugadores, setJugadores] = useState([]);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [jugadorActual, setJugadorActual] = useState(null);
  const [permitirRepetidos, setPermitirRepetidos] = useState(false);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

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
      setJugadorActual(actual);
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
        "Solo se permiten 3 jugadores. Elimina uno para continuar."
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
    <View style={styles.container}>
      <Text style={styles.title}>Inicio</Text>

      <TextInput
        placeholder="Nombre del nuevo jugador"
        value={nombreNuevo}
        onChangeText={setNombreNuevo}
        style={styles.input}
      />
      <Button title="Crear Jugador" onPress={crearJugador} />

      <FlatList
        data={jugadores}
        keyExtractor={(item) => item.nombre}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => seleccionarJugador(item.nombre)}>
            <Text
              style={[
                styles.jugador,
                item.nombre === jugadorActual && styles.jugadorSeleccionado,
              ]}
            >
              {item.nombre} - Ganadas: {item.ganadas} | Perdidas:{" "}
              {item.perdidas}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.switchContainer}>
        <Text>¿Permitir dígitos repetidos?</Text>
        <Switch
          value={permitirRepetidos}
          onValueChange={setPermitirRepetidos}
        />
      </View>

      <Button title="▶️ Nueva Partida" onPress={iniciarNuevaPartida} />
      <Button title="⏯ Continuar Partida" onPress={continuarPartida} />
    </View>
  );
};

export default InicioScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
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
  },
  jugadorSeleccionado: {
    backgroundColor: "#cce5ff",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
});
