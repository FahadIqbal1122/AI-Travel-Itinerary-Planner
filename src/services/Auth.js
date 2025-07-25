import Client from "./api"

export const SignInUser = async (data) => {
  try {
    const res = await Client.post("/auth/login", data)
    localStorage.setItem("token", res.data.token)
    return res.data.user
  } catch (error) {
    throw error
  }
}

export const RegisterUser = async (data) => {
  try {
    const res = await Client.post("/auth/register", data)
    return res.data
  } catch (error) {
    throw error
  }
}

export const CheckSession = async () => {
  try {
    const response = await Client.get("/auth/session")
    console.log("Session response:", response.data)
    return response.data.user
  } catch (error) {
    throw error
  }
}
