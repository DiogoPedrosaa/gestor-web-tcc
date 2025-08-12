import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User, UserCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

type Role = "admin" | "patient";
type Profile = { uid: string; email: string | null; displayName?: string | null; role: Role };

type Ctx = {
  firebaseUser: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<UserCredential>; // <-- retorna UserCredential
  signOutApp(): Promise<void>;
};

const AuthContext = createContext<Ctx>({} as any);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = (snap.exists() ? (snap.data().role as Role) : "patient");
        setProfile({ uid: user.uid, email: user.email, displayName: user.displayName, role });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const value: Ctx = useMemo(() => ({
    firebaseUser, profile, loading,
    async signIn(email, password) {
      return await signInWithEmailAndPassword(auth, email, password); // <-- devolve cred
    },
    async signOutApp() { await signOut(auth); },
  }), [firebaseUser, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
