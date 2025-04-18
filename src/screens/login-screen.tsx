"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native"
import { useAuth } from "../contexts/auth-context"
import LoadingSpinner from "../components/loading-spinner"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    try {
      setLoading(true)
      await login(email, password)
      navigation.replace("MainTabs")
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Logging in..." />
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={{ uri: "https://placeholder.svg?height=100&width=100" }} style={styles.logo} />
        <Text style={styles.title}>FDA-1 Mobile</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  formContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  }
})
