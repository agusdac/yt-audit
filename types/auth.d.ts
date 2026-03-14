declare module '#auth-utils' {
  interface User {
    id: string
  }

  interface UserSession {
    user?: User
    loggedInAt?: Date
  }
}

export {}
